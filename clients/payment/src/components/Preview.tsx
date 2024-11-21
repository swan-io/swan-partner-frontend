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
import { isNotNullish, isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { allCountries } from "@swan-io/shared-business/src/constants/countries";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { languages, locale, t } from "../utils/i18n";
import { GetRouteParams } from "../utils/routes";
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
});

type Props = {
  params: GetRouteParams<"Preview">;
};

export const Preview = ({
  params: {
    cancelUrl,
    accentColor,
    logo,
    merchantName,
    label,
    amount,
    currency = "EUR",
    card,
    sepaDirectDebit,
  },
}: Props) => {
  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  const hasNoPaymentMethods = sepaDirectDebit == null && card == null;

  const paymentMethods = [
    ...(sepaDirectDebit != null
      ? [
          {
            id: "1",
            name: "Direct Debit",
            icon: <SepaLogo height={15} />,
          },
        ]
      : []),
    ...(card != null
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
    <WithPartnerAccentColor color={accentColor ?? invariantColors.defaultAccentColor}>
      <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
        {({ large }) => (
          <View style={styles.base}>
            <ScrollView contentContainerStyle={styles.content}>
              <>
                <Box direction="row" alignItems="center">
                  {isNotNullishOrEmpty(cancelUrl) ? (
                    <LakeButton
                      ariaLabel={t("common.cancel")}
                      icon="dismiss-regular"
                      mode="tertiary"
                      onPress={() => {}}
                    >
                      {large ? t("common.cancel") : null}
                    </LakeButton>
                  ) : null}

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

              <LakeText variant="medium" align="center" color={colors.gray[700]}>
                {label}
              </LakeText>

              <Space height={12} />

              <LakeHeading variant="h1" level={2} align="center">
                {amount != null ? formatCurrency(Number(amount), currency) : `${"-"} ${currency}`}
              </LakeHeading>

              <Space height={32} />

              {!hasNoPaymentMethods && (
                <>
                  {isNotNullish(selectedPaymentMethod) && (
                    <LakeLabel
                      style={
                        large && (card == null || sepaDirectDebit == null)
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
                            setSelectedPaymentMethod(
                              paymentMethods.find(method => method.id === id),
                            );
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
                          <Box grow={1}>
                            <LakeLabel
                              label={t("paymentLink.card.expiryDate")}
                              render={() => <LakeTextInput value={""} />}
                            />
                          </Box>

                          <Space width={24} />

                          <Box grow={1}>
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
                          <Box grow={1}>
                            <LakeLabel
                              label={t("paymentLink.city")}
                              render={() => <LakeTextInput value={""} />}
                            />
                          </Box>

                          <Space width={24} />

                          <Box grow={1}>
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
                </>
              )}
            </ScrollView>
          </View>
        )}
      </ResponsiveContainer>
    </WithPartnerAccentColor>
  );
};
