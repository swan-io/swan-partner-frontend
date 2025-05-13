import { ReactElement, Ref, cloneElement } from "react";
import { sendMatomoEvent, useTrackingCategory } from "../utils/matomo";

type Props = {
  ref?: Ref<unknown>;
  action: string;
  hook: string;
  children: ReactElement<{
    ref?: unknown;
    [key: string]: unknown;
  }>;
};

export const TrackComponent = ({ ref, action, hook, children }: Props) => {
  const { props } = children;
  const prop = props[hook];
  const category = useTrackingCategory();

  return cloneElement(children, {
    ref,

    ...(typeof prop === "function" && {
      [hook]: (...args: unknown[]) => {
        sendMatomoEvent({ type: "Action", category, name: action });
        (prop as (...args: unknown[]) => void)(...args);
      },
    }),
  });
};
