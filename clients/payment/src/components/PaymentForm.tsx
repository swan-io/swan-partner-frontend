import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { backgroundColor, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { CSSProperties, useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { validateIban } from "../../../banking/src/utils/iban";
import {
  AddSepaDirectDebitPaymentMandateFromPaymentLinkDocument,
  GetMerchantPaymentLinkQuery,
} from "../graphql/unauthenticated";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { SepaLogo } from "./SepaLogo";

const IMAGE_STYLE: CSSProperties = {
  top: 0,
  left: 0,
  alignSelf: "center",
  maxWidth: "200px",
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: "auto",
    maxWidth: 960,
    width: "100%",
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
  },
  label: {
    flexBasis: "50%",
    flexShrink: 1,
    alignSelf: "stretch",
  },
  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  buttonItem: { width: "40%", paddingHorizontal: 0 },
  buttonItemDesktop: { width: "15%" },
  selectLanguage: {
    alignItems: "flex-end",
  },
});

type FormState = {
  paymentMethod: "SepaDirectDebitCore";
  iban: string;
  country: CountryCCA3;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  state: string;
};

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
};

const sepaNonEeaCountries = ["CHE", "VAT", "GBR", "MCO", "SMR", "AND"];

export const PaymentForm = ({ paymentLink }: Props) => {
  const { desktop } = useResponsive();

  const { Field, submitForm } = useForm<FormState>({
    paymentMethod: {
      initialValue: "SepaDirectDebitCore",
    },
    iban: {
      initialValue: paymentLink?.customer?.iban ?? "",
      sanitize: value => value.trim(),
      validate: combineValidators(validateRequired, validateIban),
    },
    country: {
      initialValue: "FRA",
      validate: validateRequired,
    },
    name: {
      initialValue: paymentLink.customer?.name ?? "",
      sanitize: value => value.trim(),
      validate: validateRequired,
    },
    addressLine1: {
      initialValue: paymentLink.billingAddress?.addressLine1 ?? "",
      validate: (value, { getFieldState }) => {
        const country = getFieldState("country").value;
        if (sepaNonEeaCountries.includes(country)) {
          return validateRequired(value);
        } else {
          return;
        }
      },
      sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: paymentLink.billingAddress?.addressLine2 ?? "",
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: paymentLink.billingAddress?.city ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldState }) => {
        const country = getFieldState("country").value;
        if (sepaNonEeaCountries.includes(country)) {
          return validateRequired(value);
        } else {
          return;
        }
      },
    },
    postalCode: {
      initialValue: paymentLink.billingAddress?.postalCode ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldState }) => {
        const country = getFieldState("country").value;
        if (sepaNonEeaCountries.includes(country)) {
          return validateRequired(value);
        } else {
          return;
        }
      },
    },
    state: {
      initialValue: paymentLink.billingAddress?.state ?? "",
      sanitize: value => value.trim(),
    },
  });

  const [addSepaDirectDebitPaymentMandateData, addSepaDirectDebitPaymentMandate] = useUrqlMutation(
    AddSepaDirectDebitPaymentMandateFromPaymentLinkDocument,
  );

  const onPressSubmit = () => {
    submitForm(values => {
      if (
        hasDefinedKeys(values, [
          "paymentMethod",
          "iban",
          "country",
          "name",
          "addressLine1",
          "city",
          "postalCode",
          "state",
        ])
      ) {
        const { name, addressLine1, addressLine2, city, country, state, postalCode, iban } = values;

        addSepaDirectDebitPaymentMandate({
          input: {
            debtor: {
              IBAN: iban,
              address: {
                addressLine1,
                addressLine2,
                country,
                city,
                postalCode,
                state,
              },
              name,
            },
            paymentLinkId: paymentLink.id,
          },
        })
          .mapOk(data => data.addSepaDirectDebitPaymentMandateFromPaymentLink)
          .mapOkToResult(data => (isNotNullish(data) ? Result.Ok(data) : Result.Error(undefined)))
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => {
            Router.replace("Success");
          })
          .tapError(error => {
            // Router.replace("Error");
            console.log(error);
          })
          .map(() => undefined);
      }
    });
  };

  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  const merchantName = paymentLink.merchantProfile.merchantName;

  return (
    <ScrollView
      style={{
        backgroundColor: backgroundColor.default,
      }}
      contentContainerStyle={styles.container}
    >
      <Box direction="row" alignItems="center" justifyContent="spaceBetween">
        <Box style={desktop ? styles.buttonItemDesktop : styles.buttonItem}>
          <LakeButton
            ariaLabel={t("common.cancel")}
            icon="dismiss-regular"
            mode="tertiary"
            grow={true}
            onPress={() => {
              window.location.replace(paymentLink.cancelRedirectUrl);
            }}
          >
            {t("common.cancel")}
          </LakeButton>
        </Box>

        <Box
          style={[desktop ? styles.buttonItemDesktop : styles.buttonItem, styles.selectLanguage]}
        >
          <LakeSelect
            value={locale.language}
            items={languageOptions}
            hideErrors={true}
            mode="borderless"
            onValueChange={locale => {
              setPreferredLanguage(locale);
            }}
            contentContainerStyle={styles.container}
          >
            <Box direction="row" alignItems="center" justifyContent="spaceBetween">
              <Box style={desktop ? styles.buttonItemDesktop : styles.buttonItem}>
                <LakeButton
                  ariaLabel={t("common.cancel")}
                  icon="dismiss-regular"
                  mode="tertiary"
                  grow={true}
                  onPress={() => {}}
                >
                  {t("common.cancel")}
                </LakeButton>
              </Box>

              <Box
                style={[
                  desktop ? styles.buttonItemDesktop : styles.buttonItem,
                  styles.selectLanguage,
                ]}
              >
                <LakeSelect
                  value={locale.language}
                  items={languageOptions}
                  hideErrors={true}
                  mode="borderless"
                  onValueChange={locale => {
                    setPreferredLanguage(locale);
                  }}
                />
              </Box>
            </Box>

      {isNotNullish(paymentLink.merchantProfile.merchantLogoUrl) ? (
        <img src={paymentLink.merchantProfile.merchantLogoUrl} style={IMAGE_STYLE} />
      ) : (
        <LakeHeading variant="h3" level={3}>
          {paymentLink.merchantProfile.merchantName}
        </LakeHeading>
      )}

            {/* Just for tests */}
            <SwanLogo
              color={colors.swan[500]}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                alignSelf: "center",
                width: "144px",
              }}
            />

      <LakeText variant="medium" align="center" color={colors.gray[700]}>
        {paymentLink?.label}
      </LakeText>

            <LakeText variant="medium" align="center" color={colors.gray[700]}>
              Merchant item
            </LakeText>

      <LakeHeading variant="h1" level={2} align="center">
        {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
      </LakeHeading>

            <LakeHeading variant="h1" level={2} align="center">
              {formatCurrency(Number(10), "EUR")}
            </LakeHeading>

      <Field name="paymentMethod">
        {({ value, onChange }) => (
          <LakeLabel
            style={desktop ? styles.segmentedControlDesktop : styles.segmentedControl}
            label={t("paymentLink.paymentMethod")}
            render={() => (
              <SegmentedControl
                mode="desktop"
                selected={value}
                items={[
                  {
                    id: "SepaDirectDebitCore",
                    name: "Direct Debit",
                    icon: <SepaLogo height={15} />,
                  },
                ]}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <Space height={24} />

      <Field name="iban">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("paymentLink.iban")}
            render={() => (
              <LakeTextInput
                value={value}
                valid={valid}
                error={error}
                onBlur={onBlur}
                onChangeText={onChange}
                ref={ref}
              />
            )}
          />
        )}
      </Field>

      <Field name="country">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("paymentLink.country")}
            render={id => (
              <CountryPicker
                id={id}
                countries={allCountries}
                value={value}
                onValueChange={onChange}
                error={error}
                ref={ref}
              />
            )}
          />
        )}
      </Field>

      <Field name="name">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("paymentLink.name")}
            render={() => (
              <LakeTextInput
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
                ref={ref}
              />
            )}
            style={styles.label}
          />
        )}
      </Field>

            <Field name="country">
              {({ value, error, onChange, ref }) => (
                <LakeLabel
                  label={t("paymentLink.country")}
                  render={id => (
                    <CountryPicker
                      id={id}
                      countries={allCountries}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                      ref={ref}
                    />
                  )}
                />
              )}
            </Field>

            <Box direction={desktop ? "row" : "column"}>
              <Field name="firstName">
                {({ value, valid, error, onChange, onBlur, ref }) => (
                  <LakeLabel
                    label={t("paymentLink.firstName")}
                    render={() => (
                      <LakeTextInput
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={ref}
                      />
                    )}
                    style={styles.label}
                  />
                )}
              </Field>

              <Space width={24} />

              <Field name="lastName">
                {({ value, valid, error, onChange, onBlur, ref }) => (
                  <LakeLabel
                    style={styles.label}
                    label={t("paymentLink.lastName")}
                    render={() => (
                      <LakeTextInput
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={ref}
                      />
                    )}
                  />
                )}
              </Field>
            </Box>

            <Field name="addressLine1">
              {({ value, valid, error, onChange, onBlur, ref }) => (
                <LakeLabel
                  label={t("paymentLink.addressLine1")}
                  render={() => (
                    <LakeTextInput
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      ref={ref}
                    />
                  )}
                />
              )}
            </Field>

            <Field name="addressLine2">
              {({ value, valid, error, onChange, onBlur, ref }) => (
                <LakeLabel
                  label={t("paymentLink.addressLine2")}
                  render={() => (
                    <LakeTextInput
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      ref={ref}
                    />
                  )}
                />
              )}
            </Field>

            <Field name="city">
              {({ value, valid, error, onChange, onBlur, ref }) => (
                <LakeLabel
                  label={t("paymentLink.city")}
                  render={() => (
                    <LakeTextInput
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      ref={ref}
                    />
                  )}
                />
              )}
            </Field>

            <Box direction={desktop ? "row" : "column"}>
              <Field name="postalCode">
                {({ value, valid, error, onChange, onBlur, ref }) => (
                  <LakeLabel
                    label={t("paymentLink.postalCode")}
                    render={() => (
                      <LakeTextInput
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={ref}
                      />
                    )}
                    style={styles.label}
                  />
                )}
              </Field>

              <Space width={24} />

              <Field name="state">
                {({ value, valid, error, onChange, onBlur, ref }) => (
                  <LakeLabel
                    style={styles.label}
                    label={t("paymentLink.state")}
                    render={() => (
                      <LakeTextInput
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={ref}
                      />
                    )}
                  />
                )}
              </Field>
            </Box>

            <Space height={32} />

            <LakeButton color="current" onPress={onPressSubmit}>
              <LakeText color={colors.gray[50]}> {t("button.pay")}</LakeText>
            </LakeButton>

            <Space height={32} />

            <LakeText color={colors.gray[700]} align="center" variant="smallRegular">
              {t("paymentLink.termsAndConditions", { merchantName })}
            </LakeText>

            <Space height={32} />

            <Box direction="row" alignItems="baseline">
              <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
              <Space width={4} />
              <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
            </Box>
          </ScrollView>
        ))
        .otherwise(() => (
          <ErrorView />
        ))}
    </>
  );
};
