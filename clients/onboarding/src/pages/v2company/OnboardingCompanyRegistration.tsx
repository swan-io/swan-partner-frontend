import { Lazy, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Link } from "@swan-io/lake/src/components/Link";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { AddressFormPart } from "@swan-io/shared-business/src/components/AddressFormPart";
import { CountryCCA3, allCountriesItems } from "@swan-io/shared-business/src/constants/countries";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { OnboardingCountryPicker } from "../../components/CountryPicker";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountCountry,
  UnauthenticatedUpdateCompanyOnboardingInput,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { formatNestedMessage, locale, t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import {
  ServerInvalidFieldCode,
  extractServerValidationErrors,
  getValidationErrorMessage,
  validateEmail,
  validateRequired,
} from "../../utils/validation";

// exclude USA from country list because we can't open account for American citizens
// https://support.swan.io/hc/en-150/articles/5767279299741
const countryItems = Lazy(() => allCountriesItems.filter(item => item.cca3 !== "USA"));

const styles = StyleSheet.create({
  tcu: {
    marginHorizontal: "auto",
  },
  tcuCheckbox: {
    top: 3, // center checkbox with text
  },
  link: {
    color: colors.partner[500],
    textDecorationLine: "underline",
  },
  linkIcon: {
    marginLeft: 4,
    display: "inline-block",
    verticalAlign: "middle",
  },
});

export type RegistrationFieldName = "email" | "address" | "city" | "postalCode" | "country";

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  initialEmail: string;
  initialAddressLine1: string;
  initialCity: string;
  initialPostalCode: string;
  initialCountry: CountryCCA3;
  projectName: string;
  accountCountry: AccountCountry;
  serverValidationErrors: {
    fieldName: RegistrationFieldName;
    code: ServerInvalidFieldCode;
  }[];
  tcuDocumentUri?: string;
  tcuUrl: string;
};

export const OnboardingCompanyRegistration = ({
  previousStep,
  nextStep,
  onboardingId,
  initialEmail,
  initialAddressLine1,
  initialCity,
  initialPostalCode,
  initialCountry,
  projectName,
  accountCountry,
  serverValidationErrors,
  tcuDocumentUri,
  tcuUrl,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const haveToAcceptTcu = accountCountry === "DEU";
  const isAddressRequired = accountCountry === "DEU";

  const { Field, submitForm, setFieldValue, setFieldError, FieldsListener, listenFields } = useForm(
    {
      email: {
        initialValue: initialEmail,
        validate: combineValidators(validateRequired, validateEmail),
        sanitize: value => value.trim(),
      },
      address: {
        initialValue: initialAddressLine1,
        validate: isAddressRequired ? validateRequired : undefined,
        sanitize: value => value.trim(),
      },
      city: {
        initialValue: initialCity,
        validate: isAddressRequired ? validateRequired : undefined,
        sanitize: value => value.trim(),
      },
      postalCode: {
        initialValue: initialPostalCode,
        validate: isAddressRequired ? validateRequired : undefined,
        sanitize: value => value.trim(),
      },
      country: {
        initialValue: initialCountry,
        validate: isAddressRequired ? validateRequired : undefined,
      },
      tcuAccepted: {
        initialValue: !haveToAcceptTcu, // initialize as accepted if not required
        validate: value => {
          if (value === false) {
            return t("step.finalize.termsError");
          }
        },
      },
    },
  );

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const onPressNext = () => {
    submitForm(values => {
      if (!hasDefinedKeys(values, ["email"])) {
        return;
      }

      const { email, address, city, postalCode, country } = values;

      const updateInput: UnauthenticatedUpdateCompanyOnboardingInput = isAddressRequired
        ? {
            onboardingId,
            email,
            language: locale.language,
            legalRepresentativePersonalAddress: {
              addressLine1: address ?? "",
              city: city ?? "",
              postalCode: postalCode ?? "",
              country: country ?? "",
            },
          }
        : {
            onboardingId,
            email,
            language: locale.language,
          };

      updateOnboarding({
        input: updateInput,
        language: locale.language,
      })
        .mapOkToResult(({ unauthenticatedUpdateCompanyOnboarding }) =>
          match(unauthenticatedUpdateCompanyOnboarding)
            .with({ __typename: "UnauthenticatedUpdateCompanyOnboardingSuccessPayload" }, value =>
              Result.Ok(value),
            )
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          Router.push(nextStep, { onboardingId });
        })
        .tapError(error => {
          match(error)
            .with({ __typename: "ValidationRejection" }, error => {
              const invalidFields = extractServerValidationErrors(error, path =>
                match(path)
                  .with(["email"] as const, ([fieldName]) => fieldName)
                  .with(
                    ["legalRepresentativePersonalAddress", "addressLine1"],
                    () => "address" as const,
                  )
                  .with(
                    ["legalRepresentativePersonalAddress", "city"] as const,
                    ([, fieldName]) => fieldName,
                  )
                  .with(
                    ["legalRepresentativePersonalAddress", "postalCode"] as const,
                    ([, fieldName]) => fieldName,
                  )
                  .otherwise(() => null),
              );
              invalidFields.forEach(({ fieldName, code }) => {
                const message = getValidationErrorMessage(code, values[fieldName]);
                setFieldError(fieldName, message);
              });
            })
            .otherwise(noop);

          const errorMessage = getUpdateOnboardingError(error);
          showToast({
            variant: "error",
            title: errorMessage.title,
            description: errorMessage.description,
          });
        });
    });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small, large }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.registration.title")}</StepTitle>
              <Space height={small ? 8 : 12} />
              <LakeText>{t("company.step.registration.description")}</LakeText>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="email">
                  {({ value, valid, onChange, error }) => (
                    <LakeLabel
                      label={t("company.step.registration.emailLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          placeholder="example@gmail.com"
                          value={value}
                          onChangeText={onChange}
                          valid={valid}
                          error={error}
                        />
                      )}
                    />
                  )}
                </Field>
              </Tile>

              <Space height={small ? 24 : 32} />

              {isAddressRequired && (
                <>
                  <StepTitle isMobile={small}>
                    {t("company.step.registration.locationTitle")}
                  </StepTitle>

                  <Space height={small ? 24 : 32} />

                  <Tile>
                    <Field name="country">
                      {({ value, onChange }) => (
                        <OnboardingCountryPicker
                          label={t("company.step.registration.countryLabel")}
                          value={value}
                          items={countryItems.get()}
                          holderType="company"
                          onlyIconHelp={small}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>

                    <Space height={12} />

                    <FieldsListener names={["country"]}>
                      {({ country }) => (
                        <AddressFormPart
                          initialAddress={initialAddressLine1}
                          initialCity={initialCity}
                          initialPostalCode={initialPostalCode}
                          country={country.value}
                          label={t("company.step.registration.searchAddressLabel")}
                          optionalLabel={t("company.step.registration.searchAddressLabelDetail")}
                          placeholder={t("company.step.registration.searchAddressPlaceholder")}
                          Field={Field}
                          setFieldValue={setFieldValue}
                          listenFields={listenFields}
                          isLarge={large}
                          apiKey={__env.CLIENT_GOOGLE_MAPS_API_KEY}
                        />
                      )}
                    </FieldsListener>
                  </Tile>

                  <Space height={small ? 24 : 32} />
                </>
              )}

              <Box alignItems="start" style={styles.tcu}>
                <Box direction="row">
                  {haveToAcceptTcu && (
                    <>
                      <Field name="tcuAccepted">
                        {({ value, error, onChange }) => (
                          <Pressable
                            aria-checked={value}
                            onPress={() => onChange(!value)}
                            style={styles.tcuCheckbox}
                          >
                            <LakeCheckbox value={value} isError={isNotNullish(error)} />
                          </Pressable>
                        )}
                      </Field>

                      <Space width={12} />
                    </>
                  )}

                  <LakeText>
                    {formatNestedMessage(
                      haveToAcceptTcu ? "step.finalize.terms" : "emailPage.terms",
                      {
                        firstLink: (
                          <Link target="blank" to={tcuUrl} style={styles.link}>
                            {t("emailPage.firstLink")}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                        secondLink: (
                          <Link target="blank" to={tcuDocumentUri ?? "#"} style={styles.link}>
                            {t("emailPage.secondLink", { partner: projectName })}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                      },
                    )}
                  </LakeText>
                </Box>

                {haveToAcceptTcu && (
                  <>
                    <Space height={4} />

                    <FieldsListener names={["tcuAccepted"]}>
                      {({ tcuAccepted }) => (
                        <LakeText color={colors.negative[500]}>{tcuAccepted.error ?? " "}</LakeText>
                      )}
                    </FieldsListener>
                  </>
                )}
              </Box>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={updateResult.isLoading()}
      />
    </>
  );
};
