import { Dict } from "@swan-io/boxed";
import { Location, encodeSearch, getLocation, subscribeToLocation } from "@swan-io/chicane";
import { emptyToUndefined, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { atom } from "react-atomic-state";
import { Dimensions } from "react-native";
import { P, match } from "ts-pattern";
import { EnvType } from "../graphql/unauthenticated";
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

type Session = {
  projectEnv: EnvType | undefined;
  projectId: string;
};

const sessionAtom = atom<Session | undefined>(undefined);

export const sendMatomoEvent = (
  event:
    | { type: "PageView" }
    | { type: "Action"; category: string; name: string }
    | { type: "Search"; category: string; count: number; filters: string },
) => {
  const session = sessionAtom.get();

  if (isNullishOrEmpty(SITE_ID) || isNullishOrEmpty(session)) {
    return; // only track production or development testing events
  }

  const dimension2 = session.projectEnv; // defined in matomo dashboard as "environment"
  const route = Router.getRoute(finiteRouteNames);
  const windowSize = Dimensions.get("window");

  // https://developer.matomo.org/api-reference/tracking-api
  const params = {
    idsite: SITE_ID,
    rec: REC,
    apiv: API_VERSION,

    rand: Date.now().toString(), // random number to prevent caching
    res: `${windowSize.width}x${windowSize.height}`,

    action_name: event.type,

    url:
      window.location.origin +
      match(route)
        .with({ name: P.string }, ({ name }) => finitePaths[name])
        .otherwise(() => ""),

    ...(dimension2 && { dimension2 }),
    dimension3: session.projectId, // defined in matomo dashboard as "projectId"

    ...match(event)
      .with({ type: "Action" }, event => ({
        ca: "1",
        e_a: event.type,
        e_c: event.category,
      }))
      .otherwise(() => ({})),
  };

  navigator.sendBeacon(API_URL + encodeSearch(params));
};

export const useSessionTracking = ({
  loaded,
  projectEnv,
  projectId,
}: { loaded: boolean } & Session) => {
  const lastPath = useRef<string>("");

  const stableSession = useMemo(
    () => (loaded ? { projectEnv, projectId } : undefined),
    [loaded, projectEnv, projectId],
  );

  useEffect(() => {
    sessionAtom.set(stableSession);

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
      sessionAtom.reset();
    };
  }, [stableSession]);
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
