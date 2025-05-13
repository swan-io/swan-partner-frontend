import { ReactElement, Ref } from "react";
import { GestureResponderEvent } from "react-native";
import { TrackComponent } from "./TrackComponent";

type Props = {
  ref?: Ref<unknown>;
  action: string;
  children: ReactElement<{
    ref?: unknown;
    onPress?: (event: GestureResponderEvent) => void;
  }>;
};

export const TrackPressable = ({ ref, children, action }: Props) => (
  <TrackComponent ref={ref} action={action} hook="onPress">
    {children}
  </TrackComponent>
);
