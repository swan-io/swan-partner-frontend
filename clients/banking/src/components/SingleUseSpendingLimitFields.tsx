import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";
import { SingleUseSpendingLimitValue } from "../utils/singleUseSpendingLimit";
import { sanitizeAmountString } from "../utils/spendingLimit";
import { CardNameField } from "./CardNameField";

const styles = StyleSheet.create({
  root: {
    display: "block",
  },
  item: {
    alignSelf: "stretch",
  },
  descriptionContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
  },
  description: {
    width: 1,
    flexGrow: 1,
  },
});

type Periodicity = "Always" | "Monthly";

type PeriodicityPickerProps = {
  value: Periodicity | undefined;
  onChange: (period: Periodicity) => void;
  disabled: boolean;
};

const PeriodicityPicker = ({ value, onChange, disabled }: PeriodicityPickerProps) => (
  <ChoicePicker
    tileColor="current"
    large={true}
    items={["Always" as const, "Monthly" as const]}
    value={value}
    onChange={onChange}
    disabled={disabled}
    renderItem={period => {
      const { icon, title, description } = match(period)
        .with("Always", () => ({
          icon: "lake-card-one-off" as const,
          title: t("cards.periodicity.oneOff"),
          description: t("cards.periodicity.oneOff.description"),
        }))
        .with("Monthly", () => ({
          icon: "lake-card-recurring" as const,
          title: t("cards.periodicity.recurring"),
          description: t("cards.periodicity.recurring.description"),
        }))
        .exhaustive();

      return (
        <View style={styles.item}>
          <Box alignItems="center">
            <Icon
              color={value === period ? colors.current[500] : colors.swan[200]}
              size={148}
              name={icon}
            />

            <Space height={24} />

            <LakeHeading userSelect="none" level={3} variant="h3">
              {title}
            </LakeHeading>

            <Space height={12} />

            <View style={styles.descriptionContainer}>
              <LakeText
                userSelect="none"
                variant="smallRegular"
                align="center"
                style={styles.description}
              >
                {description}
              </LakeText>
            </View>
          </Box>

          <Space height={12} />
        </View>
      );
    }}
  />
);

export type SingleUseSpendingLimitFieldsValue = {
  spendingLimit: SingleUseSpendingLimitValue;
  cardName?: string;
};

type Props = {
  value: SingleUseSpendingLimitFieldsValue;
  onChange: (value: SingleUseSpendingLimitFieldsValue) => void;
  error?: string;
  canEditPeriodicity?: boolean;
  disabled?: boolean;
};

export const SingleUseSpendingLimitFields = ({
  value,
  onChange,
  error,
  canEditPeriodicity = true,
  disabled = false,
}: Props) => {
  const { spendingLimit, cardName } = value;

  // dirtyValue is local input state; the canonical amount is committed to the parent on blur.
  const [dirtyValue, setDirtyValue] = useState(spendingLimit.amount.value);

  useEffect(() => {
    setDirtyValue(spendingLimit.amount.value);
  }, [spendingLimit.amount.value]);

  const sanitizeInput = useCallback(() => {
    if (isNullish(dirtyValue)) {
      return;
    }
    const sanitized = sanitizeAmountString(dirtyValue);
    setDirtyValue(sanitized);
    onChange({
      ...value,
      spendingLimit: {
        ...value.spendingLimit,
        amount: { ...value.spendingLimit.amount, value: sanitized },
      },
    });
  }, [dirtyValue, value, onChange]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
      {() => (
        <>
          <Tile>
            <LakeLabel
              label={t("cardSettings.amount")}
              render={id => (
                <LakeTextInput
                  id={id}
                  unit="EUR"
                  value={dirtyValue ?? ""}
                  onChangeText={setDirtyValue}
                  onBlur={sanitizeInput}
                  inputMode="decimal"
                  disabled={disabled}
                  error={error}
                />
              )}
            />
          </Tile>

          <Space height={24} />

          {canEditPeriodicity && (
            <>
              <PeriodicityPicker
                disabled={disabled}
                value={spendingLimit.period}
                onChange={period =>
                  onChange({ ...value, spendingLimit: { ...value.spendingLimit, period } })
                }
              />

              <Space height={24} />
            </>
          )}

          <CardNameField
            disabled={disabled}
            value={cardName}
            onChange={name => onChange({ ...value, cardName: name })}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
