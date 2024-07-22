import { ReactElement, forwardRef } from "react";
import { GestureResponderEvent } from "react-native";
import { TrackComponent } from "./TrackComponent";

type Props = {
  action: string;
  children: ReactElement<{
    ref?: unknown;
    onPress?: (event: GestureResponderEvent) => void;
  }>;
};

export const TrackPressable = forwardRef<unknown, Props>(({ children, action }, forwardedRef) => (
  <TrackComponent ref={forwardedRef} action={action} hook="onPress">
    {children}
  </TrackComponent>
));
