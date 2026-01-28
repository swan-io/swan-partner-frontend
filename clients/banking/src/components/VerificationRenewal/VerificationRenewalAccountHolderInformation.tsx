import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import {
  AddressDetail,
  PlacekitAddressSearchInput,
} from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  companyCountries,
  CountryCCA3,
  getCountryName,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  AccountCountry,
  AccountHolderType,
  CompanyRenewalInfoFragment,
  GetVerificationRenewalQuery,
  MonthlyPaymentVolume,
  UpdateCompanyVerificationRenewalDocument,
} from "../../graphql/partner";
import { locale, t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getRenewalSteps, RenewalStep, renewalSteps } from "../../utils/verificationRenewal";
import { getNextStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";

const styles = StyleSheet.create({
  field: { width: "100%" },
  tileContainer: {
    flex: 1,
  },
  unknownValue: {
    fontStyle: "italic",
  },
  grid: {
    flexShrink: 1,
    flexGrow: 1,
  },
  countryField: {
    height: spacings[40],
    width: "100%",
  },
});

const UNKNOWN_VALUE = <LakeText style={styles.unknownValue}>{t("common.unknown")}</LakeText>;

const translateMonthlyPaymentVolume = (monthlyPaymentVolume: MonthlyPaymentVolume) =>
  match(monthlyPaymentVolume)
    .with("Between10000And50000", () =>
      t("verificationRenewal.monthlyPaymentVolume.Between10000And50000"),
    )
    .with("Between50000And100000", () =>
      t("verificationRenewal.monthlyPaymentVolume.Between50000And100000"),
    )
    .with("LessThan10000", () => t("verificationRenewal.monthlyPaymentVolume.LessThan10000"))
    .with("MoreThan100000", () => t("verificationRenewal.monthlyPaymentVolume.MoreThan100000"))
    .exhaustive();

const monthlyPaymentVolumeItems = deriveUnion<MonthlyPaymentVolume>({
  Between10000And50000: true,
  Between50000And100000: true,
  LessThan10000: true,
  MoreThan100000: true,
}).array.map(value => ({ name: translateMonthlyPaymentVolume(value), value }));

type Form = {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: CountryCCA3;
  activityDescription: string;
  monthlyPaymentVolume: MonthlyPaymentVolume;
};

type Props = {
  accountHolderType: AccountHolderType;
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
  verificationRenewal: GetVerificationRenewalQuery["verificationRenewal"];
  accountCountry: AccountCountry;
};

export const VerificationRenewalAccountHolderInformation = ({
  accountHolderType,
  verificationRenewalId,
  verificationRenewal,
  info,
  previousStep,
  accountCountry,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const { Field, submitForm, FieldsListener, setFieldValue } = useForm<Form>({
    companyName: {
      initialValue: info.company.name,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine1: {
      initialValue: info.company.residencyAddress.addressLine1 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: info.company.residencyAddress.addressLine2 ?? "",
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: info.company.residencyAddress.postalCode ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: info.company.residencyAddress.city ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    country: {
      initialValue: isCountryCCA3(info.company.residencyAddress.country)
        ? info.company.residencyAddress.country
        : accountCountry,
    },
    activityDescription: {
      initialValue: info.company.businessActivityDescription,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    monthlyPaymentVolume: {
      initialValue: info.company.monthlyPaymentVolume,
      validate: validateRequired,
    },
  });

  const [editModalOpen, setEditModalOpen] = useState(false);

  const steps = getRenewalSteps(verificationRenewal, accountHolderType);

  const nextStep = useMemo(
    () => getNextStep(renewalSteps.accountHolderInformation, steps) ?? renewalSteps.finalize,
    [steps],
  );

  const onSuggestion = useCallback(
    (place: AddressDetail) => {
      setFieldValue("addressLine1", place.completeAddress);
      setFieldValue("city", place.city);
      if (place.postalCode != null) {
        setFieldValue("postalCode", place.postalCode);
      }
    },
    [setFieldValue],
  );

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isSome()) {
          const {
            country,
            activityDescription,
            addressLine1,
            addressLine2,
            city,
            companyName,
            monthlyPaymentVolume,
            postalCode,
          } = option.value;

          updateCompanyVerificationRenewal({
            input: {
              verificationRenewalId: verificationRenewalId,
              company: {
                name: companyName,
                businessActivityDescription: activityDescription,
                monthlyPaymentVolume,
                residencyAddress: {
                  addressLine1,
                  addressLine2,
                  city,
                  postalCode,
                  country,
                },
              },
            },
          })
            .mapOk(data => data.updateCompanyVerificationRenewal)
            .mapOkToResult(data => Option.fromNullable(data).toResult(data))
            .mapOkToResult(filterRejectionsToResult)
            .tapOk(() => setEditModalOpen(false))
            .tapError(error => {
              showToast({ variant: "error", error, title: translateError(error) });
            });
        }
      },
    });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <Box direction="row" justifyContent="spaceBetween">
              <Box grow={1}>
                <StepTitle isMobile={small}>
                  {t("verificationRenewal.accountHolderInformation.title")}
                </StepTitle>
              </Box>
              <LakeButton
                mode="tertiary"
                onPress={() => setEditModalOpen(true)}
                icon="edit-regular"
              >
                {t("common.edit")}
              </LakeButton>
            </Box>
            <Space height={24} />

            <Tile>
              <Box direction="column" alignItems="stretch">
                <View style={styles.tileContainer}>
                  <ReadOnlyFieldList>
                    <LakeLabel
                      label={t("verificationRenewal.companyName")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>{info.company.name}</LakeText>
                      )}
                    />
                    <LakeLabel
                      label={t("verificationRenewal.addressLine1")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>
                          {info.company.residencyAddress.addressLine1}
                        </LakeText>
                      )}
                    />

                    <Grid numColumns={2} horizontalSpace={40} style={styles.grid}>
                      <LakeLabel
                        label={t("verificationRenewal.addressLine2")}
                        type="view"
                        render={() =>
                          isNotNullishOrEmpty(info.company.residencyAddress.addressLine2) ? (
                            <LakeText color={colors.gray[900]}>
                              {info.company.residencyAddress.addressLine2}
                            </LakeText>
                          ) : (
                            UNKNOWN_VALUE
                          )
                        }
                      />

                      <LakeLabel
                        label={t("verificationRenewal.postalCode")}
                        type="view"
                        render={() => (
                          <LakeText color={colors.gray[900]}>
                            {info.company.residencyAddress.postalCode}
                          </LakeText>
                        )}
                      />
                    </Grid>

                    <Grid horizontalSpace={40} style={styles.grid} numColumns={2}>
                      <LakeLabel
                        label={t("verificationRenewal.city")}
                        type="view"
                        render={() => (
                          <LakeText color={colors.gray[900]}>
                            {info.company.residencyAddress.city}
                          </LakeText>
                        )}
                      />

                      <LakeLabel
                        type="view"
                        label={t("verificationRenewal.country")}
                        style={styles.field}
                        render={() => (
                          <Box direction="row">
                            <Box grow={1}>
                              <LakeText color={colors.gray[900]} style={styles.countryField}>
                                {getCountryName(
                                  info.company.residencyAddress.country as CountryCCA3,
                                )}
                              </LakeText>
                            </Box>
                          </Box>
                        )}
                      />
                    </Grid>

                    <LakeLabel
                      label={t("verificationRenewal.activityDescription")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>
                          {info.company.businessActivityDescription}
                        </LakeText>
                      )}
                    />

                    <LakeLabel
                      label={t("verificationRenewal.monthlyPaymentVolume")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>
                          {translateMonthlyPaymentVolume(info.company.monthlyPaymentVolume)}
                        </LakeText>
                      )}
                    />
                  </ReadOnlyFieldList>
                </View>
              </Box>
            </Tile>

            <VerificationRenewalFooter
              onPrevious={
                previousStep !== undefined
                  ? () =>
                      Router.push(previousStep?.id, {
                        verificationRenewalId: verificationRenewalId,
                      })
                  : undefined
              }
              onNext={() =>
                Router.push(nextStep.id, {
                  verificationRenewalId: verificationRenewalId,
                })
              }
              loading={updatingCompanyVerificationRenewal.isLoading()}
            />

            <LakeModal
              maxWidth={850}
              visible={editModalOpen}
              icon="edit-regular"
              color="partner"
              title={t("verificationRenewal.editModal.title")}
            >
              <Space height={16} />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.companyName")}
                render={() => (
                  <Field name="companyName">
                    {({ value, error, onChange, onBlur }) => (
                      <LakeTextInput
                        value={value}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.country")}
                render={() => (
                  <Field name="country">
                    {({ value, onChange }) => (
                      <CountryPicker
                        countries={companyCountries}
                        value={value}
                        onValueChange={onChange}
                      />
                    )}
                  </Field>
                )}
              />

              <FieldsListener names={["country"]}>
                {({ country }) => (
                  <>
                    <Grid horizontalSpace={40} style={styles.grid} numColumns={2}>
                      <LakeLabel
                        type="view"
                        label={t("verificationRenewal.addressLine1")}
                        render={id => (
                          <Field name="addressLine1">
                            {({ ref, value, onChange, error }) => (
                              <PlacekitAddressSearchInput
                                inputRef={ref}
                                apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                                emptyResultText={t("common.noResults")}
                                placeholder={t(
                                  "verificationRenewal.ownership.residencyAddressPlaceholder",
                                )}
                                language={locale.language}
                                id={id}
                                country={country.value ?? accountCountry}
                                value={value}
                                error={error}
                                onValueChange={onChange}
                                onSuggestion={onSuggestion}
                              />
                            )}
                          </Field>
                        )}
                      />

                      <LakeLabel
                        type="view"
                        label={t("verificationRenewal.addressLine2")}
                        render={() => (
                          <Field name="addressLine2">
                            {({ value, error, onChange, onBlur }) => (
                              <LakeTextInput
                                value={value}
                                error={error}
                                onChangeText={onChange}
                                onBlur={onBlur}
                              />
                            )}
                          </Field>
                        )}
                      />
                    </Grid>

                    <Grid horizontalSpace={40} style={styles.grid} numColumns={2}>
                      <LakeLabel
                        type="view"
                        label={t("verificationRenewal.postalCode")}
                        render={id => (
                          <Field name="postalCode">
                            {({ ref, value, valid, error, onChange }) => (
                              <LakeTextInput
                                ref={ref}
                                id={id}
                                value={value}
                                valid={valid}
                                error={error}
                                onChangeText={onChange}
                              />
                            )}
                          </Field>
                        )}
                      />

                      <LakeLabel
                        type="view"
                        label={t("verificationRenewal.city")}
                        render={id => (
                          <Field name="city">
                            {({ ref, value, valid, error, onChange }) => (
                              <LakeTextInput
                                ref={ref}
                                id={id}
                                value={value}
                                valid={valid}
                                error={error}
                                onChangeText={onChange}
                              />
                            )}
                          </Field>
                        )}
                      />
                    </Grid>
                  </>
                )}
              </FieldsListener>

              <LakeLabel
                type="view"
                label={t("verificationRenewal.activityDescription")}
                render={() => (
                  <Field name="activityDescription">
                    {({ value, error, onChange, onBlur }) => (
                      <LakeTextInput
                        multiline={true}
                        numberOfLines={4}
                        value={value}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.monthlyPaymentVolume")}
                render={() => (
                  <Field name="monthlyPaymentVolume">
                    {({ value, onChange }) => (
                      <LakeSelect
                        value={value}
                        items={monthlyPaymentVolumeItems}
                        onValueChange={onChange}
                      />
                    )}
                  </Field>
                )}
              />
              <LakeButtonGroup paddingBottom={0}>
                <LakeButton grow={true} mode="secondary" onPress={() => setEditModalOpen(false)}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton
                  color="partner"
                  mode="primary"
                  grow={true}
                  onPress={onPressSubmit}
                  loading={updatingCompanyVerificationRenewal.isLoading()}
                >
                  {t("common.validate")}
                </LakeButton>
              </LakeButtonGroup>
            </LakeModal>
          </>
        )}
      </ResponsiveContainer>
    </OnboardingStepContent>
  );
};
