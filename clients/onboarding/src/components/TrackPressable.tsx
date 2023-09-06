import { cloneElement } from "react";
import { GestureResponderEvent } from "react-native";
import { trackButtonClick, useTrackSession } from "../utils/matomo";

type Props = {
  labelKey: string;
  children: React.ReactElement<{ onPress?: (event: GestureResponderEvent) => void }>;
};

export const TrackPressable = ({ labelKey, children }: Props) => {
  const session = useTrackSession();
  const { onPress } = children.props;

  return cloneElement(children, {
    onPress: onPress
      ? (event: GestureResponderEvent) => {
          if (session) {
            trackButtonClick(labelKey, session);
          }
          onPress(event);
        }
      : undefined,
  });
};
