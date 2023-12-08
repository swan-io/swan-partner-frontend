import { Dict } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { StyleSheet } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { validateIban } from "../../../banking/src/utils/iban";
import { SepaLogo } from "../components/SepaLogo";
import {
  AddSepaDirectDebitPaymentMandateFromPaymentLinkDocument,
  GetMerchantPaymentLinkQuery,
  InitiateSddPaymentCollectionDocument,
} from "../graphql/unauthenticated";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },
  half: {
    flexBasis: "0%",
    flexGrow: 1,
    flexShrink: 1,
  },
});

type FormState = {
  paymentMethod: "SepaDirectDebitCore";
  iban: string;
  country: CountryCCA3;
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  state: string;
};

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  setMandateUrl: (value: string) => void;
  nonEeaCountries: string[];
};

const fieldToPathMap = {
  paymentMethod: ["paymentMethod"],
  iban: ["debtor", "iban"],
  name: ["debtor", "name"],
  country: ["address", "country"],
  addressLine1: ["address", "addressLine1"],
  city: ["address", "city"],
  postalCode: ["address", "postalCode"],
  state: ["address", "state"],
} as const;

export const PaymentPage = ({ paymentLink, setMandateUrl, nonEeaCountries }: Props) => {
  const { desktop } = useResponsive();

  const { Field, submitForm, setFieldError, focusField } = useForm<FormState>({
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
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
        }
      },
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: paymentLink.billingAddress?.city ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldState }) => {
        const country = getFieldState("country").value;
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
        }
      },
    },
    postalCode: {
      initialValue: paymentLink.billingAddress?.postalCode ?? "",
      sanitize: value => value.trim(),
      validate: (value, { getFieldState }) => {
        const country = getFieldState("country").value;
        if (nonEeaCountries.includes(country)) {
          return validateRequired(value);
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

  const [initiateSddPaymentCollectionData, initiateSddPaymentCollection] = useUrqlMutation(
    InitiateSddPaymentCollectionDocument,
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
        const { name, addressLine1, city, country, state, postalCode, iban } = values;

        addSepaDirectDebitPaymentMandate({
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
                state,
              },
            },
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
            setMandateUrl(mandateUrl);
          })
          .tapError(error => {
            match(error)
              .with(
                {
                  __typename: "ValidationRejection",
                  fields: P.not(P.nullish),
                },
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
              .otherwise(error => showToast({ variant: "error", title: translateError(error) }));
          });
      }
    });
  };

  const merchantName = paymentLink.merchantProfile.merchantName;

  return (
    <>
      <LakeText variant="medium" align="center" color={colors.gray[700]}>
        {paymentLink.label}
      </LakeText>

      <Space height={12} />

      <LakeHeading variant="h1" level={2} align="center">
        {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
      </LakeHeading>

      <Space height={32} />

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
              style={desktop && styles.half}
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

        <Space width={24} />

        <Field name="state">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              label={t("paymentLink.state")}
              style={desktop && styles.half}
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

      <LakeButton
        color="current"
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
