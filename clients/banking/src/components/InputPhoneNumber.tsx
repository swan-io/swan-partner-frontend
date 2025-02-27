import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Popover } from "@swan-io/lake/src/components/Popover";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import { Country } from "@swan-io/shared-business/src/constants/countries";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { t } from "../utils/i18n";
import { parsePhoneNumber } from "../utils/phone";
import { CountryList } from "./CountryList";

const styles = StyleSheet.create({
  idd: {
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[100],
    borderTopLeftRadius: radii[4],
    borderBottomLeftRadius: radii[4],
    borderWidth: 1,
    borderRightWidth: 0,
    flexDirection: "row",
    justifyContent: "center",
    paddingLeft: spacings[16],
    paddingRight: spacings[12],
    transitionDuration: "150ms",
    transitionProperty: "background-color",
  },
  iddPressed: { backgroundColor: colors.gray[100] },
  input: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  errorContainer: { paddingTop: spacings[4] },
  erroredField: { borderColor: colors.negative[500] },
});

export type InputPhoneNumberRef = { focus: () => void; blur: () => void };

type Props = {
  label: string;
  autofocus?: boolean;
  error: string | undefined;
  valid: boolean;
  value: string;
  onSubmitEditing?: () => void;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  help?: string;
};

export const InputPhoneNumber = forwardRef<InputPhoneNumberRef, Props>(
  (
    {
      label,
      autofocus = false,
      error = "",
      value,
      onSubmitEditing,
      onValueChange,
      valid,
      onBlur,
      help,
    },
    forwardedRef,
  ) => {
    const referenceRef = useRef<View>(null);
    const inputRef = useRef<TextInput>(null);

    const [visible, { open, close }] = useDisclosure(false);

    const [{ country, nationalNumber }, setInputState] = useState(() => {
      const { country, nationalNumber } = parsePhoneNumber(value);
      return { country, nationalNumber };
    });

    const handleOnChangeText = (text: string) => {
      const clean = text.replace(/[^ +0-9-()]/g, "");

      if (text === clean) {
        setInputState(() => ({ country, nationalNumber: clean }));
        if (clean !== "") {
          onValueChange(`+${country.idd}${clean}`);
        } else {
          onValueChange("");
        }
      }
    };

    const handleCountryPhoneChange = (country: Country) => {
      setInputState(prevState =>
        prevState.country.uid === country.uid
          ? prevState
          : { country, nationalNumber: prevState.nationalNumber },
      );

      onValueChange(`+${country.idd}${nationalNumber}`);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies(country):
    useEffect(() => {
      if (autofocus && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 250);
      }
    }, [autofocus, country]);

    useImperativeHandle(
      forwardedRef,
      () => ({ focus: () => inputRef.current?.focus(), blur: () => inputRef.current?.blur() }),
      [],
    );

    return (
      <LakeLabel
        label={label}
        render={() => (
          <View>
            <Popover
              referenceRef={referenceRef}
              visible={visible}
              matchReferenceWidth={true}
              onDismiss={close}
            >
              <CountryList
                country={country}
                onChange={value => {
                  handleCountryPhoneChange(value);
                  close();
                }}
              />
            </Popover>
            <Box ref={referenceRef} direction="row">
              <Pressable
                role="button"
                disabled={visible}
                onPress={open}
                aria-label={t("phoneForm.country")}
                style={({ pressed }) => [
                  styles.idd,
                  !visible && pressed && styles.iddPressed,
                  isNotNullishOrEmpty(error) && styles.erroredField,
                ]}
              >
                <Flag code={country.cca2} width={16} />
                <Space width={8} />

                <LakeText
                  color={colors.gray[600]}
                  numberOfLines={1}
                  userSelect="none"
                  variant="smallSemibold"
                >
                  +{country.idd}
                </LakeText>

                <Space width={8} />
                <Icon name="chevron-down-filled" color={colors.gray[600]} size={16} />
              </Pressable>

              <LakeTextInput
                valid={valid}
                ref={inputRef}
                autoComplete="tel"
                inputMode="tel"
                rows={1}
                hideErrors={true}
                value={nationalNumber}
                onChangeText={handleOnChangeText}
                onSubmitEditing={onSubmitEditing}
                error={error}
                style={styles.input}
                onBlur={onBlur}
                help={t("membershipDetail.edit.phoneNumber.requiredForPermissions")}
              />
            </Box>

            <Box direction="row" style={styles.errorContainer}>
              {isNotNullishOrEmpty(error) ? (
                <LakeText variant="smallRegular" color={colors.negative[500]}>
                  {error}
                </LakeText>
              ) : (
                <LakeText variant="smallRegular" color={colors.gray[500]}>
                  {help ?? " "}
                </LakeText>
              )}
            </Box>
          </View>
        )}
      />
    );
  },
);
