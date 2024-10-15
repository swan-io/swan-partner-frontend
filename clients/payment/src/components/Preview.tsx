import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  breakpoints,
  colors,
  invariantColors,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { allCountries } from "@swan-io/shared-business/src/constants/countries";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { languages, locale, t } from "../utils/i18n";
import { SepaLogo } from "./SepaLogo";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  base: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  content: {
    marginHorizontal: "auto",
    maxWidth: 960,
    width: "100%",
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    minHeight: "100%",
  },
  centered: {
    marginHorizontal: "auto",
  },

  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },

  grow: {
    flexGrow: 1,
  },
});

type Props = {
  accentColor: string | undefined;
  amount: string | undefined;
  currency: string | undefined;
  label: string | undefined;
  logo: string | undefined;
  card: string | undefined;
  sepaDirectDebit: string | undefined;
  merchantName: string | undefined;
};

export const Preview = ({
  accentColor,
  logo,
  merchantName,
  label,
  amount,
  currency = "€",
  card,
  sepaDirectDebit,
}: Props) => {
  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  const hasNoPaymentMethods = sepaDirectDebit == null && card == null;

  const paymentMethods = [
    ...(sepaDirectDebit != null || hasNoPaymentMethods
      ? [
          {
            id: "1",
            name: "Direct Debit",
            icon: <SepaLogo height={15} />,
          },
        ]
      : []),
    ...(card != null || hasNoPaymentMethods
      ? [
          {
            id: "2",
            name: "Card",
            icon: <Icon name="payment-regular" size={24} />,
            activeIcon: <Icon name="payment-filled" size={24} />,
          },
        ]
      : []),
  ];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <View style={styles.base}>
          <ScrollView contentContainerStyle={styles.content}>
            <>
              <Box direction="row" alignItems="center">
                <LakeButton
                  ariaLabel={t("common.cancel")}
                  icon="dismiss-regular"
                  mode="tertiary"
                  onPress={() => {}}
                >
                  {large ? t("common.cancel") : null}
                </LakeButton>

                <Fill minWidth={16} />

                <View>
                  <LakeSelect
                    value={locale.language}
                    items={languageOptions}
                    hideErrors={true}
                    mode="borderless"
                    onValueChange={() => {}}
                  />
                </View>
              </Box>

              <Space height={24} />
            </>
            {isNotNullish(logo) ? (
              <AutoWidthImage
                height={40}
                maxWidth={180}
                resizeMode="contain"
                sourceUri={logo}
                style={styles.centered}
              />
            ) : (
              <LakeHeading variant="h3" level={3} align="center">
                {merchantName}
              </LakeHeading>
            )}

            <Space height={24} />

            <WithPartnerAccentColor color={accentColor ?? invariantColors.defaultAccentColor}>
              <LakeText variant="medium" align="center" color={colors.gray[700]}>
                {label}
              </LakeText>

              <Space height={12} />

              {amount != null ? (
                <LakeHeading variant="h1" level={2} align="center">
                  {formatCurrency(Number(amount), currency)}
                </LakeHeading>
              ) : (
                <LakeHeading variant="h1" level={2} align="center">
                  {`${"-"} ${currency}`}
                </LakeHeading>
              )}

              <Space height={32} />

              {isNotNullish(selectedPaymentMethod) && (
                <LakeLabel
                  style={
                    large && (isNotNullish(card) || isNotNullish(sepaDirectDebit))
                      ? styles.segmentedControlDesktop
                      : styles.segmentedControl
                  }
                  label={t("paymentLink.paymentMethod")}
                  render={() => (
                    <SegmentedControl
                      minItemWidth={250}
                      selected={selectedPaymentMethod.id}
                      items={paymentMethods}
                      onValueChange={id => {
                        setSelectedPaymentMethod(paymentMethods.find(method => method.id === id));
                      }}
                    />
                  )}
                />
              )}

              <Space height={24} />

              {match(selectedPaymentMethod)
                .with({ name: "Card" }, () => (
                  <>
                    <Box>
                      <LakeLabel
                        label={t("paymentLink.card.cardNumber")}
                        render={() => (
                          <Box direction="row" grow={1} shrink={1}>
                            <LakeTextInput value={""} />
                          </Box>
                        )}
                      />
                    </Box>

                    <Box direction={large ? "row" : "column"}>
                      <Box style={styles.grow}>
                        <LakeLabel
                          label={t("paymentLink.card.expiryDate")}
                          render={() => <LakeTextInput value={""} />}
                        />
                      </Box>

                      <Space width={24} />

                      <Box style={styles.grow}>
                        <LakeLabel
                          label={t("paymentLink.card.cvv")}
                          render={() => <LakeTextInput value={""} />}
                        />
                      </Box>
                    </Box>

                    <Space height={32} />

                    <LakeButton color="partner" onPress={() => {}}>
                      {t("button.pay")}
                    </LakeButton>
                  </>
                ))
                .with({ name: "Direct Debit" }, () => (
                  <>
                    <LakeLabel
                      label={t("paymentLink.iban")}
                      render={() => <LakeTextInput value={""} />}
                    />

                    <LakeLabel
                      label={t("paymentLink.country")}
                      render={id => (
                        <CountryPicker
                          id={id}
                          countries={allCountries}
                          value={"FRA"}
                          onValueChange={() => {}}
                        />
                      )}
                    />

                    <LakeLabel
                      label={t("paymentLink.name")}
                      render={() => <LakeTextInput value={""} />}
                    />

                    <LakeLabel
                      label={t("paymentLink.addressLine1")}
                      render={() => <LakeTextInput value={""} />}
                    />

                    <Box direction={large ? "row" : "column"}>
                      <Box style={styles.grow}>
                        <LakeLabel
                          label={t("paymentLink.city")}
                          render={() => <LakeTextInput value={""} />}
                        />
                      </Box>

                      <Space width={24} />

                      <Box style={styles.grow}>
                        <LakeLabel
                          label={t("paymentLink.postalCode")}
                          render={() => <LakeTextInput value={""} />}
                        />
                      </Box>
                    </Box>

                    <Space height={32} />

                    <LakeButton color="partner" onPress={() => {}}>
                      {t("button.pay")}
                    </LakeButton>

                    <Space height={32} />

                    {isNotNullish(merchantName) && (
                      <LakeText color={colors.gray[700]} align="center" variant="smallRegular">
                        {t("paymentLink.termsAndConditions", { merchantName })}
                      </LakeText>
                    )}
                  </>
                ))
                .otherwise(() => null)}
            </WithPartnerAccentColor>
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
