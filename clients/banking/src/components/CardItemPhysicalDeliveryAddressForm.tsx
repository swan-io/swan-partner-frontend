import { Future, Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { identity } from "@swan-io/lake/src/utils/function";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { pick } from "@swan-io/lake/src/utils/object";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  CountryCCA3,
  allCountries,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle, useState } from "react";
import { P, match } from "ts-pattern";
import { CompleteAddressInput } from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { validateAddressLine, validateRequired } from "../utils/validations";

export type CardItemPhysicalDeliveryAddressFormRef = {
  submit: () => void;
};

export type Address = {
  addressLine1?: string | null | undefined;
  addressLine2?: string | null | undefined;
  city?: string | null | undefined;
  country?: string | null | undefined;
  postalCode?: string | null | undefined;
  state?: string | null | undefined;
};

type Props = {
  initialEditorState?: Address;
  onSubmit: (editorState: CompleteAddressInput) => Future<unknown>;
};

export const CardItemPhysicalDeliveryAddressForm = forwardRef<
  CardItemPhysicalDeliveryAddressFormRef,
  Props
>(({ initialEditorState, onSubmit }, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
    addressLine1: {
      initialValue: initialEditorState?.addressLine1 ?? "",
      validate: combineValidators(validateRequired, validateAddressLine),
    },
    addressLine2: {
      initialValue: initialEditorState?.addressLine2 ?? "",
    },
    postalCode: {
      initialValue: initialEditorState?.postalCode ?? "",
      validate: validateRequired,
    },
    city: {
      initialValue: initialEditorState?.city ?? "",
      validate: validateRequired,
    },
    country: {
      initialValue: match(initialEditorState?.country)
        .returnType<CountryCCA3>()
        .with(P.when(isCountryCCA3), identity)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
  });

  useImperativeHandle(ref, () => ({
    submit: () => {
      submitForm({
        onSuccess: values => {
          const option = Option.allFromDict(
            pick(values, ["addressLine1", "city", "country", "postalCode"]),
          );

          if (option.isSome()) {
            setIsLoading(true);
            onSubmit({
              ...option.get(),
              addressLine2: values.addressLine2
                .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
                .toUndefined(),
            }).tap(() => setIsLoading(false));
          }
        },
      });
    },
  }));

  return (
    <>
      <Field name="country">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.country")}
            render={id => (
              <CountryPicker
                readOnly={isLoading}
                id={id}
                ref={ref}
                error={error}
                value={value}
                placeholder={t("members.form.address.countryPlaceholder")}
                countries={allCountries}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <FieldsListener names={["country"]}>
        {({ country }) => {
          return (
            <Field name="addressLine1">
              {({ value, error, onChange }) => (
                <LakeLabel
                  label={t("card.physical.order.shippingAddress.addressLine1")}
                  render={id => (
                    <PlacekitAddressSearchInput
                      apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                      country={country.value}
                      value={value}
                      onValueChange={onChange}
                      onSuggestion={suggestion => {
                        setFieldValue("addressLine1", suggestion.completeAddress);
                        setFieldValue("city", suggestion.city);
                        setFieldValue("postalCode", suggestion.postalCode ?? "");
                      }}
                      language={locale.language}
                      placeholder={t("addressInput.placeholder")}
                      emptyResultText={t("common.noResults")}
                      error={error}
                      id={id}
                      disabled={isLoading}
                    />
                  )}
                />
              )}
            </Field>
          );
        }}
      </FieldsListener>

      <Field name="addressLine2">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.addressLine2")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="postalCode">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.postalCode")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="city">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.city")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>
    </>
  );
});
