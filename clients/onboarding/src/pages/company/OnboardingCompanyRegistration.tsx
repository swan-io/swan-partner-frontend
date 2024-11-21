import { Lazy } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
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
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  AddressDetail,
  PlacekitAddressSearchInput,
} from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  allCountries,
  companyFallbackCountry,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { combineValidators, useForm } from "@swan-io/use-form";
import { FragmentOf, readFragment } from "gql.tada";
import { useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { OnboardingCountryPicker } from "../../components/CountryPicker";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { UpdateCompanyOnboardingMutation } from "../../mutations/UpdateCompanyOnboardingMutation";
import { graphql } from "../../utils/gql";
import { formatNestedMessage, locale, t } from "../../utils/i18n";
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
const countryItems = Lazy(() => allCountries.filter(cca3 => cca3 !== "USA"));

const styles = StyleSheet.create({
  tcuCheckbox: {
    top: 3, // center checkbox with text
    flexDirection: "row",
    alignItems: "center",
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

export const OnboardingCompanyRegistration_OnboardingInfo = graphql(`
  fragment OnboardingCompanyRegistration_OnboardingInfo on OnboardingInfo {
    email
    projectInfo {
      id
      name
      tcuDocumentUri(language: $language)
    }
    accountCountry
    tcuUrl
  }
`);

export const OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo = graphql(`
  fragment OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo on OnboardingCompanyAccountHolderInfo {
    residencyAddress {
      addressLine1
      city
      postalCode
      country
    }
  }
`);

type Props = {
  onboardingInfoData: FragmentOf<typeof OnboardingCompanyRegistration_OnboardingInfo>;
  accountHolderInfoData: FragmentOf<
    typeof OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo
  >;

  onboardingId: string;

  serverValidationErrors: {
    fieldName: RegistrationFieldName;
    code: ServerInvalidFieldCode;
  }[];

  onPressPrevious: () => void;
  onSave: () => void;
};

export const OnboardingCompanyRegistration = ({
  onboardingInfoData,
  accountHolderInfoData,

  onboardingId,
  serverValidationErrors,

  onPressPrevious,
  onSave,
}: Props) => {
  const onboardingInfo = readFragment(
    OnboardingCompanyRegistration_OnboardingInfo,
    onboardingInfoData,
  );

  const accountHolderInfo = readFragment(
    OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo,
    accountHolderInfoData,
  );

  const [updateOnboarding, updateResult] = useMutation(UpdateCompanyOnboardingMutation);
  const isFirstMount = useFirstMountState();

  const haveToAcceptTcu =
    onboardingInfo.accountCountry === "DEU" || onboardingInfo.accountCountry === "ITA";

  const isAddressRequired = match(onboardingInfo.accountCountry)
    .with("DEU", "NLD", () => true)
    .otherwise(() => false);

  const { Field, submitForm, setFieldValue, setFieldError, FieldsListener } = useForm({
    email: {
      initialValue: onboardingInfo.email ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateEmail),
    },
    address: {
      initialValue: accountHolderInfo.residencyAddress?.addressLine1 ?? "",
      sanitize: trim,
      validate: isAddressRequired ? validateRequired : undefined,
    },
    city: {
      initialValue: accountHolderInfo.residencyAddress?.city ?? "",
      sanitize: trim,
      validate: isAddressRequired ? validateRequired : undefined,
    },
    postalCode: {
      initialValue: accountHolderInfo.residencyAddress?.postalCode ?? "",
      sanitize: trim,
      validate: isAddressRequired ? validateRequired : undefined,
    },
    country: {
      initialValue:
        accountHolderInfo.residencyAddress?.country ??
        onboardingInfo.accountCountry ??
        companyFallbackCountry,
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
  });

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        if (values.email.isNone()) {
          return;
        }

        const currentValues = {
          email: values.email.get(),
          address: values.address.toUndefined(),
          city: values.city.toUndefined(),
          postalCode: values.postalCode.toUndefined(),
          country: values.country.toUndefined(),
        };

        const { address, city, postalCode, country } = currentValues;

        updateOnboarding({
          input:
            isAddressRequired && country != undefined
              ? {
                  onboardingId,
                  email: currentValues.email,
                  language: locale.language,
                  legalRepresentativePersonalAddress: {
                    addressLine1: address ?? "",
                    city: city ?? "",
                    postalCode: postalCode ?? "",
                    country,
                  },
                }
              : {
                  onboardingId,
                  email: currentValues.email,
                  language: locale.language,
                },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateCompanyOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(onSave)
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, ({ fields }) => {
                const invalidFields = extractServerValidationErrors(fields, path =>
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
                  const message = getValidationErrorMessage(code, currentValues[fieldName]);
                  setFieldError(fieldName, message);
                });
              })
              .otherwise(noop);

            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  const onSuggestion = useCallback(
    (place: AddressDetail) => {
      setFieldValue("address", place.completeAddress);
      setFieldValue("city", place.city);
      if (place.postalCode != null) {
        setFieldValue("postalCode", place.postalCode);
      }
    },
    [setFieldValue],
  );

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.registration.title")}</StepTitle>
              <Space height={small ? 8 : 12} />
              <LakeText>{t("company.step.registration.description")}</LakeText>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="email">
                  {({ value, valid, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("company.step.registration.emailLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
                          countries={countryItems.get()}
                          holderType="company"
                          onlyIconHelp={small}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>

                    <Space height={12} />

                    <FieldsListener names={["country"]}>
                      {({ country }) => (
                        <>
                          <Field name="address">
                            {({ ref, value, onChange, error }) => (
                              <LakeLabel
                                label={t("company.step.registration.searchAddressLabel")}
                                optionalLabel={t(
                                  "company.step.registration.searchAddressLabelDetail",
                                )}
                                render={id => (
                                  <PlacekitAddressSearchInput
                                    inputRef={ref}
                                    apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                                    emptyResultText={t("common.noResult")}
                                    placeholder={t(
                                      "company.step.registration.searchAddressPlaceholder",
                                    )}
                                    language={locale.language}
                                    id={id}
                                    country={country.value}
                                    value={value}
                                    error={error}
                                    onValueChange={onChange}
                                    onSuggestion={onSuggestion}
                                  />
                                )}
                              />
                            )}
                          </Field>

                          <Space height={12} />

                          <Field name="city">
                            {({ ref, value, valid, error, onChange }) => (
                              <LakeLabel
                                label={t("company.step.registration.cityLabel")}
                                render={id => (
                                  <LakeTextInput
                                    ref={ref}
                                    id={id}
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
                            {({ ref, value, valid, error, onChange }) => (
                              <LakeLabel
                                label={t("company.step.registration.postalCodeLabel")}
                                render={id => (
                                  <LakeTextInput
                                    ref={ref}
                                    id={id}
                                    value={value}
                                    valid={valid}
                                    error={error}
                                    onChangeText={onChange}
                                  />
                                )}
                              />
                            )}
                          </Field>
                        </>
                      )}
                    </FieldsListener>
                  </Tile>

                  <Space height={small ? 24 : 32} />
                </>
              )}

              <Box alignItems="start">
                <Box>
                  {haveToAcceptTcu && (
                    <>
                      <Field name="tcuAccepted">
                        {({ value, error, onChange, ref }) => (
                          <Pressable
                            ref={ref}
                            role="checkbox"
                            aria-checked={value}
                            onPress={() => onChange(!value)}
                            style={styles.tcuCheckbox}
                          >
                            <LakeCheckbox value={value} isError={isNotNullish(error)} />
                            <Space width={8} />

                            <LakeText>
                              {formatNestedMessage("step.finalize.terms", {
                                firstLink: (
                                  <Link
                                    target="blank"
                                    to={onboardingInfo.tcuUrl}
                                    style={styles.link}
                                  >
                                    {t("emailPage.firstLink")}

                                    <Icon name="open-filled" size={16} style={styles.linkIcon} />
                                  </Link>
                                ),
                                secondLink: (
                                  <Link
                                    target="blank"
                                    to={onboardingInfo.projectInfo?.tcuDocumentUri ?? "#"}
                                    style={styles.link}
                                  >
                                    {t("emailPage.secondLink", {
                                      partner: onboardingInfo.projectInfo?.name ?? "",
                                    })}

                                    <Icon name="open-filled" size={16} style={styles.linkIcon} />
                                  </Link>
                                ),
                              })}
                            </LakeText>
                          </Pressable>
                        )}
                      </Field>

                      <Space width={12} />
                    </>
                  )}

                  {!haveToAcceptTcu && (
                    <LakeText>
                      {formatNestedMessage("emailPage.terms", {
                        firstLink: (
                          <Link target="blank" to={onboardingInfo.tcuUrl} style={styles.link}>
                            {t("emailPage.firstLink")}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                        secondLink: (
                          <Link
                            target="blank"
                            to={onboardingInfo.projectInfo?.tcuDocumentUri ?? "#"}
                            style={styles.link}
                          >
                            {t("emailPage.secondLink", {
                              partner: onboardingInfo.projectInfo?.name ?? "",
                            })}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                      })}
                    </LakeText>
                  )}
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

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading()}
        />
      </OnboardingStepContent>
    </>
  );
};
