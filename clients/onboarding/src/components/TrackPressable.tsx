import { cloneElement } from "react";
import { GestureResponderEvent } from "react-native";
import { sendMatomoEvent, useTrackingCategory } from "../utils/matomo";

type Props = {
  children: React.ReactElement<{ onPress?: (event: GestureResponderEvent) => void }>;
  action: string;
};

export const TrackPressable = ({ children, action }: Props) => {
  const category = useTrackingCategory();
  const { onPress } = children.props;

  return cloneElement(children, {
    onPress: (event: GestureResponderEvent) => {
      sendMatomoEvent({ type: "Action", category, name: action });
      onPress?.(event);
    },
  });
};
