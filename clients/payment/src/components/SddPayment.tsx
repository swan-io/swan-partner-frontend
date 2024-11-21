import { Dict, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import {
  printIbanFormat,
  validateIban,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { FragmentOf, readFragment } from "gql.tada";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { graphql } from "../utils/gql";
import { locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1,
  },
});

export const SddPayment_MerchantPaymentLink = graphql(`
  fragment SddPayment_MerchantPaymentLink on MerchantPaymentLink {
    id
    customer {
      iban
      name
    }
    billingAddress {
      addressLine1
      city
      postalCode
    }
    merchantProfile {
      merchantName
    }
  }
`);

type Props = {
  data: FragmentOf<typeof SddPayment_MerchantPaymentLink>;
  nonEeaCountries: string[];
  onMandateReceive: (value: string) => void;
  large: boolean;
};

type FormState = {
  iban: string;
  country: CountryCCA3;
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
};

const fieldToPathMap = {
  iban: ["debtor", "iban"],
  name: ["debtor", "name"],
  country: ["address", "country"],
  addressLine1: ["address", "addressLine1"],
  city: ["address", "city"],
  postalCode: ["address", "postalCode"],
} as const;

const AddSepaDirectDebitPaymentMandateFromPaymentLink = graphql(`
  mutation AddSepaDirectDebitPaymentMandateFromPaymentLink(
    $input: AddSepaDirectDebitPaymentMandateFromPaymentLinkInput!
  ) {
    addSepaDirectDebitPaymentMandateFromPaymentLink(input: $input) {
      __typename
      ... on AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload {
        paymentMandate {
          mandateDocumentUrl
          id
        }
      }
      ... on ValidationRejection {
        fields {
          path
          message
        }
      }
    }
  }
`);

const InitiateMerchantSddPaymentCollectionFromPaymentLink = graphql(`
  mutation InitiateMerchantSddPaymentCollectionFromPaymentLink(
    $input: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput!
  ) {
    unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink(input: $input) {
      __typename
      ... on ForbiddenRejection {
        message
      }
      ... on InternalErrorRejection {
        message
      }
      ... on ValidationRejection {
        fields {
          code
          message
          path
        }
      }
    }
  }
`);

export const SddPayment = ({ data, nonEeaCountries, onMandateReceive, large }: Props) => {
  const paymentLink = readFragment(SddPayment_MerchantPaymentLink, data);
  const { Field, submitForm, setFieldError, focusField } = useForm<FormState>({
    iban: {
      initialValue: paymentLink?.customer?.iban ?? "",
      sanitize: value => value.trim().replace(/ /g, ""),
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
      validate: (value, { getFieldValue }) => {
        const country = getFieldValue("country");
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
        }
      },
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: paymentLink.billingAddress?.city ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldValue }) => {
        const country = getFieldValue("country");
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
        }
      },
    },
    postalCode: {
      initialValue: paymentLink.billingAddress?.postalCode ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldValue }) => {
        const country = getFieldValue("country");
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
        }
      },
    },
  });

  const [addSepaDirectDebitPaymentMandate, addSepaDirectDebitPaymentMandateData] = useMutation(
    AddSepaDirectDebitPaymentMandateFromPaymentLink,
  );

  const [initiateSddPaymentCollection, initiateSddPaymentCollectionData] = useMutation(
    InitiateMerchantSddPaymentCollectionFromPaymentLink,
  );

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isSome()) {
          const { name, addressLine1, city, country, postalCode, iban } = option.get();

          return addSepaDirectDebitPaymentMandate({
            input: {
              paymentLinkId: paymentLink.id,
              debtor: {
                iban,
                name,
                address: {
                  addressLine1,
                  country,
                  city,
                  postalCode,
                },
              },
              language: locale.language === "pt" ? "en" : locale.language,
            },
          })
            .mapOk(data => data.addSepaDirectDebitPaymentMandateFromPaymentLink)
            .mapOkToResult(filterRejectionsToResult)
            .mapOk(data => data.paymentMandate)
            .flatMapOk(paymentMandate =>
              initiateSddPaymentCollection({
                input: {
                  mandateId: paymentMandate.id,
                  paymentLinkId: paymentLink.id,
                },
              })
                .mapOk(
                  data => data.unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink,
                )
                .mapOkToResult(filterRejectionsToResult)
                .mapOk(() => paymentMandate.mandateDocumentUrl),
            )
            .tapOk(mandateUrl => {
              onMandateReceive(mandateUrl);
              Router.replace("PaymentSuccess", { paymentLinkId: paymentLink.id });
            })
            .tapError(error => {
              match(error)
                .with(
                  { __typename: "ValidationRejection", fields: P.nonNullable },
                  ({ fields }) => {
                    let fieldToFocus: keyof FormState | undefined;
                    fields.forEach(field => {
                      Dict.entries(fieldToPathMap).forEach(([fieldName, path]) => {
                        match(field.path)
                          .with(path, () => {
                            setFieldError(fieldName, t("form.invalidField"));
                            if (fieldToFocus == null) {
                              fieldToFocus = fieldName;
                            }
                          })
                          .otherwise(() => {});
                      });
                    });
                    if (fieldToFocus != null) {
                      focusField(fieldToFocus);
                    }
                  },
                )
                .otherwise(error =>
                  showToast({ variant: "error", error, title: translateError(error) }),
                );
            });
        }
      },
    });
  };

  const merchantName = paymentLink.merchantProfile.merchantName;

  return (
    <>
      <Field name="iban">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("paymentLink.iban")}
            render={() => (
              <LakeTextInput
                value={printIbanFormat(value)}
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
          />
        )}
      </Field>

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

      <Box direction={large ? "row" : "column"}>
        <Box style={styles.grow}>
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
        </Box>

        <Space width={24} />

        <Box style={styles.grow}>
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
              />
            )}
          </Field>
        </Box>
      </Box>

      <Space height={32} />

      <LakeButton
        color="partner"
        onPress={onPressSubmit}
        loading={
          addSepaDirectDebitPaymentMandateData.isLoading() ||
          initiateSddPaymentCollectionData.isLoading()
        }
      >
        {t("button.pay")}
      </LakeButton>

      <Space height={32} />

      <LakeText color={colors.gray[700]} align="center" variant="smallRegular">
        {t("paymentLink.termsAndConditions", { merchantName })}
      </LakeText>
    </>
  );
};
