import { Dict } from "@swan-io/boxed";
import { Location, encodeSearch, getLocation, subscribeToLocation } from "@swan-io/chicane";
import { emptyToUndefined, isNullish, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { capitalize } from "@swan-io/lake/src/utils/string";
import { windowSize } from "@swan-io/lake/src/utils/windowSize";
import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { P, match } from "ts-pattern";
import { env } from "./env";
import { Router, routes } from "./routes";

const API_URL = "https://swan.matomo.cloud/matomo.php";

const API_VERSION = "1"; // according to matomo documentation, currently always set to 1
const REC = "1"; // according to matomo documentation, must be set to 1
const SITE_ID = __env.CLIENT_ONBOARDING_MATOMO_SITE_ID;

type Routes = typeof routes;

type Paths = {
  [K in keyof Routes]: Routes[K] extends `${infer Path extends string}?${string}`
    ? Path
    : Routes[K];
};

const finitePaths = Object.fromEntries(
  Dict.entries(routes)
    .map(([key, value]) => [key, value.split("?")[0] ?? ""] as const)
    .filter(([, value]) => !value.endsWith("/*")),
) as {
  [K in keyof Paths as Paths[K] extends `${string}/*` ? never : K]: Paths[K];
};

const finiteRouteNames = Dict.keys(finitePaths);

let sessionProjectId: string | undefined = undefined;

export const sendMatomoEvent = (
  event: { type: "PageView" } | { type: "Action"; category: string; name: string },
) => {
  if (isNullishOrEmpty(SITE_ID) || isNullishOrEmpty(sessionProjectId)) {
    return; // only track production or development testing events
  }

  const route = Router.getRoute(finiteRouteNames);
  const { width, height } = windowSize.get();

  // https://developer.matomo.org/api-reference/tracking-api
  const params = {
    idsite: SITE_ID,
    rec: REC,
    apiv: API_VERSION,

    rand: Date.now().toString(), // random number to prevent caching
    res: `${width}x${height}`,

    action_name: event.type,

    url:
      window.location.origin +
      match(route)
        .with({ name: P.string }, ({ name }) => finitePaths[name])
        .otherwise(() => ""),

    dimension2: capitalize(env.SWAN_ENVIRONMENT), // defined in matomo dashboard as "environment"
    dimension3: sessionProjectId, // defined in matomo dashboard as "projectId"

    ...match(event)
      .with({ type: "Action" }, event => ({
        ca: "1",
        e_c: event.category,
        e_a: event.type,
        e_n: event.name,
      }))
      .otherwise(() => ({})),
  };

  if ("sendBeacon" in navigator) {
    try {
      navigator.sendBeacon(API_URL + encodeSearch(params));
    } catch {}
  }
};

export const useSessionTracking = (projectId: string | undefined) => {
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (isNullish(projectId)) {
      return;
    }

    sessionProjectId = projectId;

    const onLocation = (location: Location) => {
      const nextPath = location.raw.path;

      if (lastPath.current !== nextPath) {
        lastPath.current = nextPath;
        sendMatomoEvent({ type: "PageView" });
      }
    };

    onLocation(getLocation()); // initial call
    const unsubscribe = subscribeToLocation(onLocation);

    return () => {
      unsubscribe();
      sessionProjectId = undefined;
    };
  }, [projectId]);
};

const TrackingCategoryContext = createContext<string>("");
export const useTrackingCategory = () => useContext(TrackingCategoryContext);

export const TrackingProvider = ({
  children,
  category,
}: {
  children: ReactNode;
  category: string;
}) => {
  const contextValue = useContext(TrackingCategoryContext);

  const merged = useMemo(
    () =>
      match({
        a: emptyToUndefined(contextValue.trim()),
        b: emptyToUndefined(category.trim()),
      })
        .with({ a: P.string, b: P.string }, ({ a, b }) => `${a} > ${b}`)
        .with({ a: P.string, b: P.nullish }, ({ a }) => a)
        .with({ a: P.nullish, b: P.string }, ({ b }) => b)
        .with({ a: P.nullish, b: P.nullish }, () => "Uncategorized")
        .exhaustive(),
    [contextValue, category],
  );

  return (
    <TrackingCategoryContext.Provider value={merged}>{children}</TrackingCategoryContext.Provider>
  );
};
