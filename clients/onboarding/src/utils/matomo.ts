import { decodeSearch, encodeSearch, getLocation, subscribeToLocation } from "@swan-io/chicane";
import { noop } from "@swan-io/lake/src/utils/function";
import {
  isEmpty,
  isNotEmpty,
  isNotNullish,
  isNotNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import { createContext, useContext, useEffect, useRef } from "react";
import { EnvType } from "../graphql/unauthenticated";
import { Router, finiteRoutes, routes } from "./routes";

const API_URL = "https://swan.matomo.cloud/matomo.php";

const API_VERSION = "1"; // according to matomo documentation, currently always set to 1
const REC = "1"; // according to matomo documentation, must be set to 1
const SITE_ID = __env.CLIENT_MATOMO_SITE_ID ?? "";

export type TrackSessionInfo = {
  environment: EnvType | undefined;
  projectId: string;
};

type MatomoEvent = {
  idsite: string;
  rec: string;
  action_name: string;
  apiv: string;
  res: string;
  rand: string;
  url: string;
  ca?: "1"; // stands for "custom action" in matomo documentation
  e_c?: string; // stands for "event category" in matomo documentation
  e_a?: string; // stands for "event action" in matomo documentation
  e_n?: string; // stands for "event name" in matomo documentation
  search?: string;
  search_cat?: string;
  search_count?: string;
  dimension1?: string; // defined in matomo dashboard as "environment"
  dimension2?: string; // defined in matomo dashboard as "projectId"
};

const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;
});

/**
 * This function gets route with param names
 * We need this because matomo groups page views by segments
 * And we don't want to group page views by ids in urls
 */
const getRouteToTrack = () => {
  const route = Router.getRoute(finiteRoutes);

  if (route?.name) {
    const routeUrl = routes[route.name];
    // Remove search query param because matomo transforms page view event to search event
    const routeToTrack = routeUrl.split("?")[0];

    if (isNotNullishOrEmpty(routeToTrack)) {
      return `${window.location.origin}${routeToTrack}`;
    }
  }

  return window.location.origin;
};

const getPageViewActionName = () => {
  const search = window.location.search;

  if (search.includes("activate")) {
    const searchParams = decodeSearch(search);
    const activateStep = searchParams.step;

    if (typeof activateStep === "string") {
      return `PageView/Activate/${activateStep}`;
    }

    return "PageView/Activate";
  }

  return "PageView";
};

const getCommonMatomoParams = (actionName: string, session: TrackSessionInfo): MatomoEvent => {
  const url = getRouteToTrack();

  const params: MatomoEvent = {
    idsite: SITE_ID,
    rec: REC,
    action_name: actionName,
    apiv: API_VERSION,
    res: `${windowSize.width}x${windowSize.height}`,
    rand: Date.now().toString(), // random number to prevent caching
    url,
    dimension2: session.projectId, // defined in matomo dashboard
  };

  if (session.environment != null) {
    params.dimension2 = session.environment; // defined in matomo dashboard
  }

  return params;
};

const trackPageView = async (session: TrackSessionInfo) => {
  // We track events only on production or development testing
  if (isEmpty(SITE_ID)) {
    return;
  }

  const actionName = getPageViewActionName();

  const params = getCommonMatomoParams(actionName, session);
  const trackApiUrl = `${API_URL}${encodeSearch(params)}`;

  await fetch(trackApiUrl, {
    mode: "no-cors",
  });
};

type ActionParams = {
  session: TrackSessionInfo;
  category: string; // stands for "event category" in matomo documentation
  action: string; // stands for "event action" in matomo documentation
  name: string; // stands for "event name" in matomo documentation
};

const trackAction = async ({ session, category, action, name }: ActionParams) => {
  // We track events only on production or development testing
  if (isEmpty(SITE_ID)) {
    return;
  }

  const params = getCommonMatomoParams("Action", session);
  params.ca = "1";
  params.e_c = category;
  params.e_a = action;
  params.e_n = name;

  const trackApiUrl = `${API_URL}${encodeSearch(params)}`;

  await fetch(trackApiUrl, {
    mode: "no-cors",
  });
};

type TrackSearchParams = {
  session: TrackSessionInfo;
  category: string;
  filters: string;
  count: number;
};

const trackSearch = async ({ session, category, filters, count }: TrackSearchParams) => {
  // We track events only on production or development testing
  if (isEmpty(SITE_ID)) {
    return;
  }

  const params = getCommonMatomoParams("Search", session);
  params.search = filters;
  params.search_cat = category;
  params.search_count = count.toString();

  const trackApiUrl = `${API_URL}${encodeSearch(params)}`;

  await fetch(trackApiUrl, {
    mode: "no-cors",
  });
};

export const trackButtonClick = (labelKey: string, session: TrackSessionInfo) => {
  trackAction({
    session,
    category: "Button",
    action: "Click",
    name: labelKey,
  }).catch(noop); // no need to handle errors for event tracking
};

const TrackSessionContext = createContext<TrackSessionInfo | null>(null);

export const TrackSessionProvider = TrackSessionContext.Provider;

export const useTrackSession = () => useContext(TrackSessionContext);

export const useTrackPageView = (session: TrackSessionInfo | null) => {
  const lastPathViewed = useRef<string>("");

  useEffect(() => {
    if (session) {
      const location = getLocation();
      lastPathViewed.current = location.raw.path;
      trackPageView(session).catch(noop); // no need to handle errors for event tracking

      return subscribeToLocation(location => {
        // if activate project is displayed, we always track page view because only query param changes
        const isActivateProjectDisplayed = isNotNullish(location.search.activate);

        const path = location.raw.path;
        if (path !== lastPathViewed.current || isActivateProjectDisplayed) {
          trackPageView(session).catch(noop); // no need to handle errors for event tracking
          lastPathViewed.current = path;
        }
      });
    }
  }, [session]);
};

type UseTrackSearchParams = {
  category: string;
  filterKeys: string[]; // filters without values to avoid sending sensitive data as user name, IBAN, etc.
  totalCount: number;
  loaded: boolean;
};

export const useTrackFilters = ({
  category,
  filterKeys,
  loaded,
  totalCount,
}: UseTrackSearchParams) => {
  const session = useTrackSession();
  const filtersToSend = filterKeys.join(", ");

  useEffect(() => {
    if (session && isNotEmpty(filtersToSend) && loaded) {
      trackSearch({
        session,
        category,
        filters: filtersToSend,
        count: totalCount,
      }).catch(noop); // no need to handle errors for event tracking
    }
  }, [category, filtersToSend, loaded, totalCount, session]);
};
