import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
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
import { match, P } from "ts-pattern";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  AccountCountry,
  AccountHolderType,
  EmploymentStatus,
  GetVerificationRenewalQuery,
  IndividualRenewalInfoFragment,
  MonthlyIncome,
  UpdateIndividualVerificationRenewalDocument,
} from "../../graphql/partner";
import { locale, t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getRenewalSteps, RenewalStep, renewalSteps } from "../../utils/verificationRenewal";
import { getNextStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { VerificationRenewalStepContent } from "./VerificationRenewalStepContent";

type Form = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: CountryCCA3;
  monthlyIncome: MonthlyIncome;
  employmentStatus: EmploymentStatus;
};

type Props = {
  verificationRenewalId: string;
  info: IndividualRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
  accountHolderType: AccountHolderType;
  verificationRenewal: GetVerificationRenewalQuery["verificationRenewal"];
  accountCountry: AccountCountry;
};

const translateMonthlyIncome = (monthlyIncome: MonthlyIncome | undefined) =>
  match(monthlyIncome)
    .with("Between1500And3000", () => t("verificationRenewal.monthlyIncome.Between1500And3000"))
    .with("Between3000And4500", () => t("verificationRenewal.monthlyIncome.Between3000And4500"))
    .with("Between500And1500", () => t("verificationRenewal.monthlyIncome.Between500And1500"))
    .with("LessThan500", () => t("verificationRenewal.monthlyIncome.LessThan500"))
    .with("MoreThan4500", () => t("verificationRenewal.monthlyIncome.MoreThan4500"))
    .with(P.nullish, () => "")
    .exhaustive();

const monthlyIncomeItems = deriveUnion<MonthlyIncome>({
  Between1500And3000: true,
  Between3000And4500: true,
  Between500And1500: true,
  LessThan500: true,
  MoreThan4500: true,
}).array.map(value => ({ name: translateMonthlyIncome(value), value }));

const translateEmploymentStatus = (employmentStatus: EmploymentStatus | undefined) =>
  match(employmentStatus)
    .with("Craftsman", () => t("verificationRenewal.monthlyIncome.Craftsman"))
    .with("Employee", () => t("verificationRenewal.monthlyIncome.Employee"))
    .with("Entrepreneur", () => t("verificationRenewal.monthlyIncome.Entrepreneur"))
    .with("Farmer", () => t("verificationRenewal.monthlyIncome.Farmer"))
    .with("Manager", () => t("verificationRenewal.monthlyIncome.Manager"))
    .with("Practitioner", () => t("verificationRenewal.monthlyIncome.Practitioner"))
    .with("Retiree", () => t("verificationRenewal.monthlyIncome.Retiree"))
    .with("ShopOwner", () => t("verificationRenewal.monthlyIncome.ShopOwner"))
    .with("Student", () => t("verificationRenewal.monthlyIncome.Student"))
    .with("Unemployed", () => t("verificationRenewal.monthlyIncome.Unemployed"))
    .with(P.nullish, () => "")
    .exhaustive();

const employmentStatusItems = deriveUnion<EmploymentStatus>({
  Craftsman: true,
  Employee: true,
  Entrepreneur: true,
  Farmer: true,
  Manager: true,
  Practitioner: true,
  Retiree: true,
  ShopOwner: true,
  Student: true,
  Unemployed: true,
}).array.map(value => ({ name: translateEmploymentStatus(value), value }));

export const VerificationRenewalPersonalInfo = ({
  verificationRenewalId,
  info,
  previousStep,
  accountHolderType,
  verificationRenewal,
  accountCountry,
}: Props) => {
  const [updateIndividualVerificationRenewal, updatingIndividualVerificationRenewal] = useMutation(
    UpdateIndividualVerificationRenewalDocument,
  );

  const { Field, setFieldValue, submitForm, FieldsListener } = useForm<Form>({
    firstName: {
      initialValue: info.accountAdmin.firstName,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    lastName: {
      initialValue: info.accountAdmin.lastName,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine1: {
      initialValue: info.accountAdmin.residencyAddress.addressLine1 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: info.accountAdmin.residencyAddress.addressLine2 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: info.accountAdmin.residencyAddress.postalCode ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: info.accountAdmin.residencyAddress.city ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    country: {
      initialValue: isCountryCCA3(info.accountAdmin.residencyAddress.country)
        ? info.accountAdmin.residencyAddress.country
        : accountCountry,
    },
    monthlyIncome: {
      initialValue: info.accountAdmin.monthlyIncome ?? "",
      validate: validateRequired,
    },
    employmentStatus: {
      initialValue: info.accountAdmin.employmentStatus,
      validate: validateRequired,
    },
  });

  const [editModalOpen, setEditModalOpen] = useState(false);

  const steps = getRenewalSteps(verificationRenewal, accountHolderType);

  const nextStep = useMemo(
    () => getNextStep(renewalSteps.personalInformation, steps) ?? renewalSteps.finalize,
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
            firstName,
            lastName,
            addressLine1,
            addressLine2,
            city,
            monthlyIncome,
            employmentStatus,
            postalCode,
          } = option.value;

          return match(info)
            .with({ __typename: "IndividualVerificationRenewalInfo" }, () =>
              updateIndividualVerificationRenewal({
                input: {
                  verificationRenewalId: verificationRenewalId,
                  accountAdmin: {
                    firstName,
                    lastName,
                    employmentStatus,
                    residencyAddress: {
                      addressLine1,
                      addressLine2,
                      postalCode,
                      city,
                      country,
                    },
                    monthlyIncome,
                  },
                },
              })
                .mapOk(data => data.updateIndividualVerificationRenewal)
                .mapOkToResult(data => Option.fromNullable(data).toResult(data))
                .mapOkToResult(filterRejectionsToResult)
                .tapOk(() => setEditModalOpen(false))
                .tapError(error => {
                  showToast({ variant: "error", error, title: translateError(error) });
                }),
            )
            .exhaustive();
        }
      },
    });
  };

  return (
    <VerificationRenewalStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small, large }) => (
          <>
            <Box direction="row" justifyContent="spaceBetween">
              <Box grow={1} justifyContent="center">
                <StepTitle isMobile={small}>
                  {t("verificationRenewal.personalInformation.title")}
                </StepTitle>
              </Box>
              <LakeButton
                size={large ? "large" : "small"}
                mode="tertiary"
                onPress={() => setEditModalOpen(true)}
                icon="edit-regular"
              >
                {t("common.edit")}
              </LakeButton>
            </Box>
            <Space height={large ? 24 : 12} />

            <Tile>
              <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.firstName")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>{info.accountAdmin.firstName}</LakeText>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>

                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.lastName")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>{info.accountAdmin.lastName}</LakeText>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>
              </Grid>

              <Box>
                <LakeLabel
                  label={t("verificationRenewal.addressLine1")}
                  type="view"
                  render={() => (
                    <LakeText color={colors.gray[900]}>
                      {info.accountAdmin.residencyAddress.addressLine1}
                    </LakeText>
                  )}
                />
                <Separator horizontal={false} space={8} />
              </Box>

              <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.addressLine2")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>
                        {info.accountAdmin.residencyAddress.addressLine2}
                      </LakeText>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>
                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.postalCode")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>
                        {info.accountAdmin.residencyAddress.postalCode}
                      </LakeText>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>
                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.city")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>
                        {info.accountAdmin.residencyAddress.city}
                      </LakeText>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>
                <Box>
                  <LakeLabel
                    type="view"
                    label={t("verificationRenewal.country")}
                    render={() => (
                      <Box direction="row">
                        <Box grow={1}>
                          <LakeText color={colors.gray[900]}>
                            {getCountryName(
                              info.accountAdmin.residencyAddress.country as CountryCCA3,
                            )}
                          </LakeText>
                        </Box>
                      </Box>
                    )}
                  />
                  <Separator horizontal={false} space={8} />
                </Box>

                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.personalInformation.monthlyIncome")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>
                        {translateMonthlyIncome(info.accountAdmin.monthlyIncome)}
                      </LakeText>
                    )}
                  />
                  {small && <Separator horizontal={false} space={8} />}
                </Box>

                <Box>
                  <LakeLabel
                    label={t("verificationRenewal.personalInformation.employmentStatus")}
                    type="view"
                    render={() => (
                      <LakeText color={colors.gray[900]}>
                        {info.accountAdmin.employmentStatus}
                      </LakeText>
                    )}
                  />
                </Box>
              </Grid>
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
              loading={updatingIndividualVerificationRenewal.isLoading()}
            />

            <LakeModal
              maxWidth={850}
              visible={editModalOpen}
              icon="edit-regular"
              color="partner"
              title={t("verificationRenewal.editModal.title")}
            >
              <Space height={16} />

              <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
                <LakeLabel
                  type="view"
                  label={t("verificationRenewal.firstName")}
                  render={() => (
                    <Field name="firstName">
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
                  label={t("verificationRenewal.lastName")}
                  render={() => (
                    <Field name="lastName">
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
                    <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
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

                    <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
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

              <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
                <LakeLabel
                  type="view"
                  label={t("verificationRenewal.personalInformation.monthlyIncome")}
                  render={() => (
                    <Field name="monthlyIncome">
                      {({ value, onChange }) => (
                        <LakeSelect
                          value={value}
                          items={monthlyIncomeItems}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  type="view"
                  label={t("verificationRenewal.personalInformation.employmentStatus")}
                  render={() => (
                    <Field name="employmentStatus">
                      {({ value, onChange }) => (
                        <LakeSelect
                          value={value}
                          items={employmentStatusItems}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />
              </Grid>

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton grow={true} mode="secondary" onPress={() => setEditModalOpen(false)}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton
                  color="partner"
                  mode="primary"
                  grow={true}
                  onPress={onPressSubmit}
                  loading={updatingIndividualVerificationRenewal.isLoading()}
                >
                  {t("common.validate")}
                </LakeButton>
              </LakeButtonGroup>
            </LakeModal>
          </>
        )}
      </ResponsiveContainer>
    </VerificationRenewalStepContent>
  );
};
