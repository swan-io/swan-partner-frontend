import { Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeSlider } from "@swan-io/lake/src/components/LakeSlider";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  breakpoints,
  colors,
  negativeSpacings,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
  SpendingLimitInput,
  SpendingLimitPeriodInput,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { CardFormat } from "./CardWizardFormat";

const styles = StyleSheet.create({
  root: {
    display: "block",
  },
  container: {
    ...commonStyles.fill,
  },
  booleanTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: negativeSpacings[8],
    alignItems: "stretch",
  },
  booleanTilesMobile: {
    flexDirection: "column",
    marginHorizontal: negativeSpacings[8],
    alignItems: "stretch",
  },
  booleanTile: {
    flexBasis: "50%",
    padding: spacings[8],
  },
  text: {
    flexDirection: "row",
  },
  booleanTileText: {
    width: 1,
    flexGrow: 1,
  },
  tileContents: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
  },
  contents: {
    ...commonStyles.fill,
  },
  sliderContainer: {
    zIndex: 1,
  },
  sliderContainerLarge: {
    zIndex: 1,
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
  sliderInput: {
    marginTop: negativeSpacings[40],
  },
  input: {
    maxWidth: 120,
    zIndex: 1,
    position: "relative",
  },
});

type DirtyCardSettings = {
  cardName?: string;
  spendingLimit: {
    amount: {
      value?: string;
      currency: string;
    };
    period: SpendingLimitPeriodInput;
  };
  eCommerce: boolean;
  withdrawal: boolean;
  international: boolean;
  nonMainCurrencyTransactions: boolean;
};

export type CardSettings = {
  cardName?: string;
  spendingLimit: SpendingLimitInput;
  eCommerce: boolean;
  withdrawal: boolean;
  international: boolean;
  nonMainCurrencyTransactions: boolean;
};

type OptionalCardSettings = {
  initialSettings?: string;
  cardName?: string;
  spendingLimit?: SpendingLimitInput;
  eCommerce?: boolean;
  withdrawal?: boolean;
  international?: boolean;
  nonMainCurrencyTransactions?: boolean;
};

type Props = {
  cardProduct: CardProduct;
  cardFormat: CardFormat;
  initialSettings?: OptionalCardSettings;
  onSubmit: (cardSettings: CardSettings) => void;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
};

type ValidationError = "InvalidAmount";

const validate = (input: DirtyCardSettings): Result<CardSettings, ValidationError[]> => {
  const errors: ValidationError[] = [];
  if (isNullish(input.spendingLimit.amount.value)) {
    errors.push("InvalidAmount" as const);
  }
  return errors.length > 0 ? Result.Error(errors) : Result.Ok(input as CardSettings);
};

export type CardWizardSettingsRef = { submit: () => void };

type CardProduct = CardProductFragment;

type CardWizardSettingsBooleanTileProps = {
  title: string;
  description: string;
  icon: IconName;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  desktop: boolean;
  disabled?: boolean;
};

const CardWizardSettingsBooleanTile = ({
  title,
  description,
  icon,
  checked,
  onChange,
  desktop,
  disabled = false,
}: CardWizardSettingsBooleanTileProps) => {
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      onPress={() => onChange(!checked)}
      style={styles.container}
      disabled={disabled}
    >
      {({ hovered }) => (
        <Tile flexGrow={1} hovered={hovered} selected={checked} paddingVertical={12}>
          <View style={styles.tileContents}>
            <Icon name={icon} color={colors.current[500]} size={24} />
            <Space width={24} />

            <View style={styles.contents}>
              <View style={styles.text}>
                <LakeHeading
                  level={3}
                  variant="h5"
                  userSelect="none"
                  style={styles.booleanTileText}
                >
                  {title}
                </LakeHeading>
              </View>

              {desktop && (
                <View style={styles.text}>
                  <LakeText variant="smallRegular" userSelect="none" style={styles.booleanTileText}>
                    {description}
                  </LakeText>
                </View>
              )}
            </View>

            <Space width={24} />
            <Switch disabled={disabled} value={checked} onValueChange={onChange} />
          </View>
        </Tile>
      )}
    </Pressable>
  );
};

const PERIODS = [
  { name: t("cardSettings.spendingLimit.daily"), value: "Daily" as const },
  { name: t("cardSettings.spendingLimit.weekly"), value: "Weekly" as const },
  { name: t("cardSettings.spendingLimit.monthly"), value: "Monthly" as const },
  { name: t("cardSettings.spendingLimit.always"), value: "Always" as const },
];

export const CardWizardSettings = forwardRef<CardWizardSettingsRef, Props>(
  (
    { accountHolder, cardFormat, initialSettings, cardProduct, onSubmit, maxSpendingLimit }: Props,
    ref,
  ) => {
    const { canUpdateCard } = usePermissions();
    const spendingLimitMaxValue = match({
      accountHolderType: accountHolder?.info.__typename,
      maxSpendingLimit,
    })
      .with({ maxSpendingLimit: P.nonNullable }, ({ maxSpendingLimit }) =>
        Number(maxSpendingLimit.amount.value),
      )
      .with({ accountHolderType: "AccountHolderIndividualInfo" }, () =>
        Number(cardProduct.individualSpendingLimit.amount.value),
      )
      .otherwise(() => Number(cardProduct.companySpendingLimit.amount.value));

    const currency = match(accountHolder?.info.__typename)
      .with(
        "AccountHolderIndividualInfo",
        () => cardProduct.individualSpendingLimit.amount.currency,
      )
      .otherwise(() => cardProduct.companySpendingLimit.amount.currency);

    const [currentSettings, setCurrentSettings] = useState<DirtyCardSettings>(() => ({
      cardName: initialSettings?.cardName,
      spendingLimit: initialSettings?.spendingLimit ?? {
        amount: {
          value: cardFormat === "SingleUseVirtual" ? undefined : String(spendingLimitMaxValue),
          currency,
        },
        period: cardFormat === "SingleUseVirtual" ? "Always" : "Monthly",
      },
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
          validate(currentSettings).match({
            Ok: cardSettings => {
              setValidation(null);
              onSubmit(cardSettings);
            },
            Error: errors => setValidation(errors),
          });
        },
      }),
      [currentSettings, onSubmit],
    );

    const [dirtyValue, setDirtyValue] = useState(
      isNullish(currentSettings.spendingLimit.amount.value)
        ? undefined
        : String(currentSettings.spendingLimit.amount.value),
    );

    useEffect(() => {
      setDirtyValue(
        isNullish(currentSettings.spendingLimit.amount.value)
          ? undefined
          : String(currentSettings.spendingLimit.amount.value),
      );
    }, [currentSettings.spendingLimit.amount.value]);

    useEffect(() => {
      if (validation != null) {
        validate(currentSettings).match({
          Ok: () => setValidation(null),
          Error: errors => setValidation(errors),
        });
      }
    }, [validation, currentSettings]);

    const sanitizeInput = useCallback(() => {
      if (isNullish(dirtyValue)) {
        return;
      }
      const cleanValue = Math.max(
        Math.min(Number(dirtyValue), spendingLimitMaxValue ?? Infinity),
        0,
      );
      const value = isNaN(cleanValue) ? 0 : cleanValue;
      setDirtyValue(String(value));
      setCurrentSettings({
        ...currentSettings,
        spendingLimit: {
          ...currentSettings.spendingLimit,
          amount: { ...currentSettings.spendingLimit.amount, value: String(value) },
        },
      });
    }, [spendingLimitMaxValue, dirtyValue, currentSettings]);

    return (
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
        {({ large }) => (
          <>
            <Tile>
              <LakeLabel
                label={t("cardSettings.name")}
                optionalLabel={t("form.optional")}
                render={id => (
                  <LakeTextInput
                    id={id}
                    disabled={!canUpdateCard}
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
                )}
              />
            </Tile>

            <Space height={24} />

            {spendingLimitMaxValue != null ? (
              <>
                {cardFormat !== "SingleUseVirtual" ? (
                  <Tile title={large ? t("card.settings.spendingLimit") : undefined}>
                    <View style={large ? styles.sliderContainerLarge : styles.sliderContainer}>
                      <LakeLabel
                        label={t("card.settings.spendingLimit")}
                        render={id => (
                          <ResponsiveContainer
                            breakpoint={breakpoints.tiny}
                            style={styles.container}
                          >
                            {({ large }) =>
                              large ? (
                                <>
                                  <Box
                                    direction="row"
                                    justifyContent="end"
                                    style={styles.sliderInput}
                                  >
                                    <View>
                                      <LakeTextInput
                                        style={styles.input}
                                        unit={"€"}
                                        value={dirtyValue}
                                        onChangeText={setDirtyValue}
                                        onBlur={sanitizeInput}
                                        inputMode="decimal"
                                        disabled={!canUpdateCard}
                                      />
                                    </View>
                                  </Box>

                                  <LakeSlider
                                    value={Number(currentSettings.spendingLimit.amount.value)}
                                    min={0}
                                    max={spendingLimitMaxValue}
                                    step={1}
                                    disabled={!canUpdateCard}
                                    onChange={value =>
                                      setCurrentSettings(settings => ({
                                        ...settings,
                                        spendingLimit: {
                                          ...settings.spendingLimit,
                                          amount: {
                                            ...settings.spendingLimit.amount,
                                            value: String(value),
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </>
                              ) : (
                                <LakeTextInput
                                  id={id}
                                  unit={"€"}
                                  value={dirtyValue}
                                  onChangeText={setDirtyValue}
                                  onBlur={sanitizeInput}
                                  inputMode="decimal"
                                  disabled={!canUpdateCard}
                                />
                              )
                            }
                          </ResponsiveContainer>
                        )}
                      />
                    </View>

                    <Space height={16} />

                    <LakeLabel
                      label={t("cardSettings.spendingLimit.period")}
                      render={id => (
                        <LakeSelect
                          id={id}
                          items={PERIODS}
                          value={currentSettings.spendingLimit.period}
                          disabled={!canUpdateCard}
                          onValueChange={period =>
                            setCurrentSettings({
                              ...currentSettings,
                              spendingLimit: {
                                ...currentSettings.spendingLimit,
                                period,
                              },
                            })
                          }
                        />
                      )}
                    />
                  </Tile>
                ) : (
                  <Tile>
                    <LakeLabel
                      label={t("cardSettings.amount")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          unit="€"
                          value={dirtyValue ?? ""}
                          onChangeText={setDirtyValue}
                          onBlur={sanitizeInput}
                          inputMode="decimal"
                          disabled={!canUpdateCard}
                          error={
                            (validation?.includes("InvalidAmount") ?? false)
                              ? t("common.form.invalidAmount")
                              : undefined
                          }
                        />
                      )}
                    />
                  </Tile>
                )}

                <Space height={12} />
              </>
            ) : null}

            {cardFormat !== "SingleUseVirtual" ? (
              <View style={large ? styles.booleanTiles : styles.booleanTilesMobile}>
                <View style={styles.booleanTile}>
                  <CardWizardSettingsBooleanTile
                    title={t("card.settings.eCommerce")}
                    description={t("card.settings.eCommerce.description")}
                    icon="cart-regular"
                    checked={currentSettings.eCommerce}
                    onChange={eCommerce =>
                      setCurrentSettings(settings => ({ ...settings, eCommerce }))
                    }
                    disabled={!canUpdateCard}
                    desktop={large}
                  />
                </View>

                <View style={styles.booleanTile}>
                  <CardWizardSettingsBooleanTile
                    title={t("card.settings.withdrawal")}
                    description={t("card.settings.withdrawal.description")}
                    icon="money-regular"
                    checked={currentSettings.withdrawal}
                    onChange={withdrawal =>
                      setCurrentSettings(settings => ({ ...settings, withdrawal }))
                    }
                    disabled={!canUpdateCard}
                    desktop={large}
                  />
                </View>

                <View style={styles.booleanTile}>
                  <CardWizardSettingsBooleanTile
                    title={t("card.settings.nonMainCurrencyTransactions")}
                    description={t("card.settings.nonMainCurrencyTransactions.description")}
                    icon="lake-currencies"
                    checked={currentSettings.nonMainCurrencyTransactions}
                    onChange={nonMainCurrencyTransactions =>
                      setCurrentSettings(settings => ({ ...settings, nonMainCurrencyTransactions }))
                    }
                    disabled={!canUpdateCard}
                    desktop={large}
                  />
                </View>

                <View style={styles.booleanTile}>
                  <CardWizardSettingsBooleanTile
                    title={t("card.settings.international")}
                    description={t("card.settings.international.description")}
                    icon="earth-regular"
                    checked={currentSettings.international}
                    onChange={international =>
                      setCurrentSettings(settings => ({ ...settings, international }))
                    }
                    disabled={!canUpdateCard}
                    desktop={large}
                  />
                </View>
              </View>
            ) : (
              <ChoicePicker
                large={true}
                items={["Always" as const, "Monthly" as const]}
                value={currentSettings.spendingLimit.period}
                onChange={period =>
                  setCurrentSettings({
                    ...currentSettings,
                    spendingLimit: {
                      ...currentSettings.spendingLimit,
                      period,
                    },
                  })
                }
                disabled={!canUpdateCard}
                renderItem={period => {
                  return (
                    <View style={styles.item}>
                      <Box alignItems="center">
                        <Icon
                          color={
                            currentSettings.spendingLimit.period == period
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
          </>
        )}
      </ResponsiveContainer>
    );
  },
);
