import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { CountryCCA3, individualCountries } from "@swan-io/shared-business/src/constants/countries";
import { useEffect } from "react";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { OnboardingCountryPicker } from "../../components/CountryPicker";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { UpdateIndividualOnboardingDocument } from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import {
  ServerInvalidFieldCode,
  extractServerValidationErrors,
  getValidationErrorMessage,
  validateRequired,
} from "../../utils/validation";

export type LocationFieldName = "country" | "city" | "address" | "postalCode";

type Props = {
  onboardingId: string;
  initialAddressLine1: string;
  initialCity: string;
  initialPostalCode: string;
  initialCountry: CountryCCA3;
  serverValidationErrors: {
    fieldName: LocationFieldName;
    code: ServerInvalidFieldCode;
  }[];
};

export const OnboardingIndividualLocation = ({
  onboardingId,
  initialAddressLine1,
  initialCity,
  initialPostalCode,
  initialCountry,
  serverValidationErrors,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateIndividualOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const { Field, FieldsListener, setFieldValue, setFieldError, submitForm } = useForm({
    address: {
      initialValue: initialAddressLine1,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: initialCity,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: initialPostalCode,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    country: {
      initialValue: initialCountry,
      validate: validateRequired,
    },
  });

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push("Email", { onboardingId });
  };

  const onPressNext = () => {
    // If we submit the form and the manual mode is disabled
    // we enable it to show the errors

    submitForm(values => {
      if (hasDefinedKeys(values, ["address", "city", "postalCode", "country"])) {
        const { address, city, postalCode, country } = values;

        updateOnboarding({
          input: {
            onboardingId,
            residencyAddress: {
              addressLine1: address,
              city,
              postalCode,
              country,
            },
            language: locale.language,
          },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateIndividualOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Details", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path => {
                  return match(path)
                    .with(["residencyAddress", "addressLine1"], () => "address" as const)
                    .with(["residencyAddress", "city"], () => "city" as const)
                    .with(["residencyAddress", "postalCode"], () => "postalCode" as const)
                    .otherwise(() => null);
                });
                invalidFields.forEach(({ fieldName, code }) => {
                  const message = getValidationErrorMessage(code, values[fieldName]);
                  setFieldError(fieldName, message);
                });
              })
              .otherwise(noop);

            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      }
    });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("individual.step.location.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="country">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("individual.step.location.countryLabel")}
                      value={value}
                      countries={individualCountries}
                      holderType="individual"
                      onlyIconHelp={small}
                      onValueChange={onChange}
                    />
                  )}
                </Field>

                <Space height={12} />

                <FieldsListener names={["country"]}>
                  {({ country }) => (
                    <Field name="address">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("individual.step.location.addressLabel")}
                          render={id => (
                            <PlacekitAddressSearchInput
                              id={id}
                              apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                              country={country.value}
                              value={value}
                              onValueChange={onChange}
                              onSuggestion={suggestion => {
                                setFieldValue("address", suggestion.completeAddress);
                                setFieldValue("city", suggestion.city);
                                setFieldValue("postalCode", suggestion.postalCode ?? "");
                              }}
                              language={locale.language}
                              placeholder={t("addressInput.placeholder")}
                              emptyResultText={t("common.noResult")}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>
                  )}
                </FieldsListener>

                <Space height={12} />

                <Field name="city">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("individual.step.location.cityLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Space height={12} />

                <Field name="postalCode">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("individual.step.location.postCodeLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>
              </Tile>
            </>
          )}
        </ResponsiveContainer>

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading()}
        />
      </OnboardingStepContent>
    </>
  );
};
