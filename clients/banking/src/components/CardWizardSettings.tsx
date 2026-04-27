import { Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { Ref, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  deriveSpendingLimitContext,
  getSpendingLimitAmountError,
  sanitizeAmountString,
} from "../utils/spendingLimit";
import { SpendingLimitValue } from "./CardItemSpendingLimit";
import { CardFormat } from "./CardWizardFormat";

const styles = StyleSheet.create({
  root: {
    display: "block",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[16],
  },
  settingText: {
    flex: 1,
    marginHorizontal: spacings[16],
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

type DirtyCardSettings = {
  cardName?: string;
  spendingLimit?: SpendingLimitValue;
  eCommerce: boolean;
  withdrawal: boolean;
  international: boolean;
  nonMainCurrencyTransactions: boolean;
};

export type CardSettings = {
  cardName?: string;
  spendingLimit: SpendingLimitValue;
  eCommerce: boolean;
  withdrawal: boolean;
  international: boolean;
  nonMainCurrencyTransactions: boolean;
};

type OptionalCardSettings = {
  cardName?: string;
  spendingLimit?: SpendingLimitValue;
  eCommerce?: boolean;
  withdrawal?: boolean;
  international?: boolean;
  nonMainCurrencyTransactions?: boolean;
};

export type CardWizardSettingsRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardSettingsRef>;
  cardProduct: CardProduct;
  cardFormat: CardFormat;
  initialSettings?: OptionalCardSettings;
  onSubmit: (cardSettings: CardSettings) => void;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
  disabled?: boolean;
};

type ValidationError = "InvalidAmount" | "ExceedsMaxAmount";

const validate = (
  input: DirtyCardSettings,
  maxValue: number,
): Result<CardSettings, ValidationError[]> => {
  const { spendingLimit, ...rest } = input;
  const numericValue = Number(spendingLimit?.amount.value);
  if (spendingLimit == null || !(numericValue > 0)) {
    return Result.Error(["InvalidAmount"]);
  }
  if (numericValue > maxValue) {
    return Result.Error(["ExceedsMaxAmount"]);
  }
  return Result.Ok({ ...rest, spendingLimit });
};

type CardProduct = CardProductFragment;

export const CardWizardSettings = ({
  ref,
  accountHolder,
  cardFormat,
  initialSettings,
  cardProduct,
  onSubmit,
  maxSpendingLimit,
  disabled = false,
}: Props) => {
  const { maxValue: spendingLimitMaxValue, currency } = deriveSpendingLimitContext(
    cardProduct,
    accountHolder,
    maxSpendingLimit,
  );

  const [currentSettings, setCurrentSettings] = useState<DirtyCardSettings>(() => ({
    cardName: initialSettings?.cardName,
    spendingLimit:
      initialSettings?.spendingLimit ??
      (cardFormat === "SingleUseVirtual"
        ? {
            amount: { value: "", currency },
            mode: { type: "rolling", rollingValue: 1, period: "Always" },
          }
        : undefined),
    eCommerce: initialSettings?.eCommerce ?? true,
    withdrawal: initialSettings?.withdrawal ?? true,
    international: initialSettings?.international ?? true,
    nonMainCurrencyTransactions: initialSettings?.nonMainCurrencyTransactions ?? true,
  }));

  const [validation, setValidation] = useState<ValidationError[] | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        validate(currentSettings, spendingLimitMaxValue).match({
          Ok: cardSettings => {
            setValidation(null);
            onSubmit(cardSettings);
          },
          Error: errors => setValidation(errors),
        });
      },
    }),
    [currentSettings, spendingLimitMaxValue, onSubmit],
  );

  const [dirtyValue, setDirtyValue] = useState(
    isNullish(currentSettings.spendingLimit?.amount.value)
      ? undefined
      : String(currentSettings.spendingLimit?.amount.value),
  );

  useEffect(() => {
    setDirtyValue(
      isNullish(currentSettings.spendingLimit?.amount.value)
        ? undefined
        : String(currentSettings.spendingLimit?.amount.value),
    );
  }, [currentSettings.spendingLimit?.amount.value]);

  useEffect(() => {
    if (validation != null) {
      validate(currentSettings, spendingLimitMaxValue).match({
        Ok: () => setValidation(null),
        Error: errors => setValidation(errors),
      });
    }
  }, [validation, currentSettings, spendingLimitMaxValue]);

  const sanitizeInput = useCallback(() => {
    if (isNullish(dirtyValue) || currentSettings.spendingLimit == null) {
      return;
    }
    const sanitized = sanitizeAmountString(dirtyValue);
    setDirtyValue(sanitized);
    setCurrentSettings({
      ...currentSettings,
      spendingLimit: {
        ...currentSettings.spendingLimit,
        amount: { ...currentSettings.spendingLimit.amount, value: sanitized },
      },
    });
  }, [dirtyValue, currentSettings]);

  const cardSettingItems = [
    {
      key: "eCommerce",
      title: t("card.settings.eCommerce"),
      description: t("card.settings.eCommerce.description"),
      icon: "cart-regular",
      checked: currentSettings.eCommerce,
      onChange: (eCommerce: boolean) =>
        setCurrentSettings(settings => ({ ...settings, eCommerce })),
    },
    {
      key: "withdrawal",
      title: t("card.settings.withdrawal"),
      description: t("card.settings.withdrawal.description"),
      icon: "money-regular",
      checked: currentSettings.withdrawal,
      onChange: (withdrawal: boolean) =>
        setCurrentSettings(settings => ({ ...settings, withdrawal })),
    },
    {
      key: "international",
      title: t("card.settings.international"),
      description: t("card.settings.international.description"),
      icon: "earth-regular",
      checked: currentSettings.international,
      onChange: (international: boolean) =>
        setCurrentSettings(settings => ({ ...settings, international })),
    },
    {
      key: "nonMainCurrencyTransactions",
      title: t("card.settings.nonMainCurrencyTransactions"),
      description: t("card.settings.nonMainCurrencyTransactions.description"),
      icon: "lake-currencies",
      checked: currentSettings.nonMainCurrencyTransactions,
      onChange: (nonMainCurrencyTransactions: boolean) =>
        setCurrentSettings(settings => ({ ...settings, nonMainCurrencyTransactions })),
    },
  ] as const;

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
      {() => (
        <>
          {cardFormat === "SingleUseVirtual" && spendingLimitMaxValue != null ? (
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
                      error={getSpendingLimitAmountError(
                        validation,
                        spendingLimitMaxValue,
                        currency,
                      )}
                    />
                  )}
                />
              </Tile>

              <Space height={24} />
            </>
          ) : null}

          {cardFormat !== "SingleUseVirtual" ? (
            <Tile title={t("card.settings.title")}>
              {cardSettingItems.map((item, index, arr) => (
                <View key={item.key}>
                  <View style={styles.settingRow}>
                    <Icon name={item.icon} color={colors.current[500]} size={24} />

                    <View style={styles.settingText}>
                      <LakeHeading level={3} variant="h5">
                        {item.title}
                      </LakeHeading>

                      <LakeText variant="smallRegular" color={colors.gray[500]}>
                        {item.description}
                      </LakeText>
                    </View>

                    <Switch
                      disabled={disabled}
                      value={item.checked}
                      onValueChange={item.onChange}
                    />
                  </View>

                  {index < arr.length - 1 && <Separator />}
                </View>
              ))}
            </Tile>
          ) : (
            <ChoicePicker
              tileColor="current"
              large={true}
              items={["Always" as const, "Monthly" as const]}
              value={
                currentSettings.spendingLimit?.mode.type === "rolling"
                  ? currentSettings.spendingLimit.mode.period
                  : undefined
              }
              onChange={period =>
                setCurrentSettings(settings => ({
                  ...settings,
                  spendingLimit: {
                    amount: settings.spendingLimit?.amount ?? {
                      value: dirtyValue ?? "",
                      currency,
                    },
                    mode: { type: "rolling", rollingValue: 1, period },
                  },
                }))
              }
              disabled={disabled}
              renderItem={period => {
                return (
                  <View style={styles.item}>
                    <Box alignItems="center">
                      <Icon
                        color={
                          currentSettings.spendingLimit?.mode.type === "rolling" &&
                          currentSettings.spendingLimit.mode.period === period
                            ? colors.swan[300]
                            : colors.swan[200]
                        }
                        size={148}
                        name={period === "Always" ? "lake-card-one-off" : "lake-card-recurring"}
                      />

                      <Space height={24} />

                      <LakeHeading userSelect="none" level={3} variant="h3">
                        {period === "Always"
                          ? t("cards.periodicity.oneOff")
                          : t("cards.periodicity.recurring")}
                      </LakeHeading>

                      <Space height={12} />

                      <View style={styles.descriptionContainer}>
                        <LakeText
                          userSelect="none"
                          variant="smallRegular"
                          align="center"
                          style={styles.description}
                        >
                          {period === "Always"
                            ? t("cards.periodicity.oneOff.description")
                            : t("cards.periodicity.recurring.description")}
                        </LakeText>
                      </View>
                    </Box>

                    <Space height={12} />
                  </View>
                );
              }}
            />
          )}

          <Space height={24} />

          <Tile>
            <LakeLabel
              style={{ paddingTop: 0 }}
              label={t("cardSettings.name")}
              extra={() => (
                <LakeText color={colors.gray[500]} style={{ fontStyle: "italic" }}>
                  {` (${t("form.optional")})`}
                </LakeText>
              )}
              render={id => (
                <>
                  <LakeTextInput
                    id={id}
                    hideErrors={true}
                    disabled={disabled}
                    value={currentSettings.cardName ?? ""}
                    onChangeText={cardName =>
                      setCurrentSettings(settings => ({
                        ...settings,
                        cardName,
                      }))
                    }
                    onBlur={() =>
                      setCurrentSettings(settings => ({
                        ...settings,
                        cardName: settings?.cardName?.trim() ?? "",
                      }))
                    }
                  />
                  <Space height={4} />
                  <LakeText>{t("cardSettings.name.description")}</LakeText>
                </>
              )}
            />
          </Tile>
        </>
      )}
    </ResponsiveContainer>
  );
};
