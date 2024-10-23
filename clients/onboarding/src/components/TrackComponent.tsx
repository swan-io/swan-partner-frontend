import { ReactElement, cloneElement, forwardRef } from "react";
import { sendMatomoEvent, useTrackingCategory } from "../utils/matomo";

type Props = {
  action: string;
  hook: string;
  children: ReactElement<{
    ref?: unknown;
    [key: string]: unknown;
  }>;
};

export const TrackComponent = forwardRef<unknown, Props>(
  ({ action, hook, children }, forwardedRef) => {
    const { props } = children;
    const prop = props[hook];
    const category = useTrackingCategory();

    return cloneElement(children, {
      ref: forwardedRef,

      ...(typeof prop === "function" && {
        [hook]: (...args: unknown[]) => {
          sendMatomoEvent({ type: "Action", category, name: action });
          (prop as (...args: unknown[]) => void)(...args);
        },
      }),
    });
  },
);
