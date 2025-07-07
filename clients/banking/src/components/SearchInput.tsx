import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import {
  animations,
  backgroundColor,
  colors,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { t } from "../utils/i18n";

const MAX_WIDTH = 320;

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
  transitionView: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
  },
  input: {
    transition: "300ms ease-in-out border-color",
    justifyContent: "flex-end",
  },
  collapsed: {
    borderRadius: radii[6],
    boxShadow: `0 0 20px 20px ${backgroundColor.default}`,
    width: MAX_WIDTH,
  },
  focus: {
    outlineStyle: "none",
    borderColor: colors.current.primary,
  },
  clearButton: {
    padding: spacings[8],
    borderRadius: radii[4],
  },
});

type Props = {
  collapsed?: boolean;
  debounceDuration?: number;
  initialValue: string;
  onChangeText: (text: string) => void;
  renderEnd?: () => ReactNode;
};

export const SearchInput = ({
  collapsed = false,
  debounceDuration = 500,
  initialValue,
  onChangeText,
  renderEnd,
}: Props) => {
  const [hasFocus, setFocused] = useBoolean(false);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);
  const timeoutRef = useRef<number>(null);

  const onChange = useDebounce((value: string) => {
    onChangeText(value);
    setCurrentValue(value.trim());
  }, debounceDuration);

  const handleOnClear = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
    }

    if (inputRef.current != null) {
      inputRef.current.clear();
      inputRef.current.focus();

      onChangeText("");
      setCurrentValue("");
    }
  }, [onChangeText]);

  const handleOnFocus = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
    }

    setFocused.on();
  }, [setFocused]);

  const handleOnBlur = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      setFocused.off();
    }, 300);
  }, [setFocused]);

  const input = (
    <LakeTextInput
      ref={inputRef}
      autoFocus={hasFocus}
      defaultValue={initialValue}
      hideErrors={true}
      icon="search-filled"
      inputMode="search"
      onBlur={handleOnBlur}
      onChangeText={onChange}
      onFocus={handleOnFocus}
      placeholder={t("common.search")}
      style={[styles.input, collapsed && styles.collapsed, hasFocus && styles.focus]}
      renderEnd={() => (
        <>
          {isNotNullishOrEmpty(currentValue) && (
            <Pressable role="button" style={styles.clearButton} onPress={handleOnClear}>
              <Icon name="dismiss-filled" size={12} color={colors.gray[500]} />
            </Pressable>
          )}

          {renderEnd?.()}
        </>
      )}
    />
  );

  if (!collapsed) {
    return <View style={styles.container}>{input}</View>;
  }

  return (
    <View>
      <LakeButton
        mode="secondary"
        size="small"
        ariaLabel={t("common.search")}
        icon="search-filled"
        pill={currentValue !== ""}
        onPress={setFocused.on}
      />

      <TransitionView style={styles.transitionView} {...animations.fadeAndSlideInFromRight}>
        {hasFocus ? input : null}
      </TransitionView>
    </View>
  );
};
