import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isEmpty } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import {
  allCountries,
  CountryCCA3,
  getCountryByCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateNullableRequired } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet, View } from "react-native";
import { Except } from "type-fest";
import { InputPhoneNumber } from "../../components/InputPhoneNumber";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountAdminChangeInfoFragment,
  UpdateAccountAdminChangeDocument,
} from "../../graphql/unauthenticated";
import { t } from "../../utils/i18n";
import { prefixPhoneNumber } from "../../utils/phone";
import { ChangeAdminRoute, Router } from "../../utils/routes";
import { validateEmail, validateName, validateRequired } from "../../utils/validation";

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
  },
});

type Props = {
  initialValues: Except<NonNullable<AccountAdminChangeInfoFragment["admin"]>, "__typename"> & {
    isNewAdminLegalRepresentative: boolean | null | undefined;
  };
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  nextStep: ChangeAdminRoute;
};

const isNewAdminItems: RadioGroupItem<boolean>[] = [
  {
    name: t("common.yes"),
    value: true,
  },
  {
    name: t("changeAdmin.step.newAdminInfo.isLegalRepresentative.no"),
    value: false,
  },
];

export const ChangeAdminNewAdmin = ({
  initialValues,
  changeAdminRequestId,
  previousStep,
  nextStep,
}: Props) => {
  const [updateChangeAdmin, changeAdminUpdate] = useMutation(UpdateAccountAdminChangeDocument);

  const { Field, submitForm } = useForm({
    isLegalRepresentative: {
      initialValue: initialValues.isNewAdminLegalRepresentative ?? true,
    },
    firstName: {
      initialValue: initialValues.firstName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    lastName: {
      initialValue: initialValues.lastName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    email: {
      initialValue: initialValues.email ?? "",
      validate: combineValidators(validateRequired, validateEmail),
    },
    phoneNumber: {
      initialValue: {
        country: getCountryByCCA3("FRA"),
        nationalNumber: initialValues.phoneNumber ?? "",
      },
      sanitize: ({ country, nationalNumber }) => ({
        country,
        nationalNumber: nationalNumber.trim(),
      }),
      validate: ({ country, nationalNumber }) => {
        if (nationalNumber.trim() === "") {
          return t("error.requiredField");
        }
        const phoneNumber = prefixPhoneNumber(country, nationalNumber);

        if (!phoneNumber.valid) {
          return t("error.invalidPhoneNumber");
        }
      },
    },
    birthDate: {
      initialValue: initialValues.birthDate ?? undefined,
      validate: validateNullableRequired,
    },
    birthCountryCode: {
      initialValue: isCountryCCA3(initialValues.birthCountry)
        ? initialValues.birthCountry
        : ("" as CountryCCA3 | ""),
      validate: validateRequired,
    },
  });

  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onPressNext = () =>
    submitForm({
      onSuccess: ({ phoneNumber, ...values }) => {
        const option = Option.allFromDict({
          ...values,
          phoneNumber: phoneNumber.flatMap<string>(({ country, nationalNumber }) => {
            const phoneNumber = prefixPhoneNumber(country, nationalNumber);
            return phoneNumber.valid ? Option.Some(phoneNumber.e164) : Option.None();
          }),
        });

        option.match({
          Some: values => {
            updateChangeAdmin({
              input: {
                id: changeAdminRequestId,
                admin: {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  phoneNumber: values.phoneNumber,
                  birthDate: values.birthDate,
                  birthCountry: values.birthCountryCode as CountryCCA3,
                },
              },
            })
              .mapOk(data => data.updateAccountAdminChange)
              .mapOkToResult(filterRejectionsToResult)
              .tapError(error =>
                showToast({ variant: "error", title: translateError(error), error }),
              )
              .tapOk(() => {
                Router.push(nextStep, { requestId: changeAdminRequestId });
              });
          },
          None: noop,
        });
      },
    });

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.newAdminInfo.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.newAdminInfo.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
              <LakeLabel
                type="form"
                label={t("changeAdmin.step.newAdminInfo.isLegalRepresentative")}
                render={() => (
                  <Field name="isLegalRepresentative">
                    {({ value, onChange }) => (
                      <View style={{ width: "100%" }}>
                        <RadioGroup
                          direction={small ? "column" : "row"}
                          items={isNewAdminItems}
                          value={value}
                          hideErrors={true}
                          onValueChange={onChange}
                        />
                      </View>
                    )}
                  </Field>
                )}
              />

              <Space height={12} />

              <Box direction={small ? "column" : "row"}>
                <LakeLabel
                  type="form"
                  label={t("changeAdmin.step.requesterInfo.firstName")}
                  style={styles.inputContainer}
                  render={id => (
                    <Field name="firstName">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <Space width={40} height={12} />

                <LakeLabel
                  type="form"
                  label={t("changeAdmin.step.requesterInfo.lastName")}
                  style={styles.inputContainer}
                  render={id => (
                    <Field name="lastName">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                        />
                      )}
                    </Field>
                  )}
                />
              </Box>

              <Space height={12} />

              <Box direction={small ? "column" : "row"}>
                <LakeLabel
                  type="form"
                  label={t("changeAdmin.step.requesterInfo.email")}
                  style={styles.inputContainer}
                  render={id => (
                    <Field name="email">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          inputMode="email"
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <Space width={40} height={12} />

                <Field name="phoneNumber">
                  {({ value, onBlur, onChange, valid, error, ref }) => (
                    <View style={styles.inputContainer}>
                      <InputPhoneNumber
                        label={t("changeAdmin.step.requesterInfo.phoneNumber")}
                        ref={ref}
                        error={error}
                        value={value}
                        valid={valid}
                        onBlur={onBlur}
                        onValueChange={onChange}
                      />
                    </View>
                  )}
                </Field>
              </Box>

              <Space height={12} />

              <Box direction={small ? "column" : "row"}>
                <Field name="birthDate">
                  {({ value, onChange, error }) => (
                    <BirthdatePicker
                      style={styles.inputContainer}
                      label={t("changeAdmin.step.newAdminInfo.birthDate")}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                    />
                  )}
                </Field>

                <Space width={40} height={12} />

                <LakeLabel
                  label={t("changeAdmin.step.newAdminInfo.birthCountry")}
                  style={styles.inputContainer}
                  render={id => (
                    <Field name="birthCountryCode">
                      {({ value, onChange, error }) => (
                        <CountryPicker
                          id={id}
                          error={error}
                          value={isEmpty(value) ? undefined : value}
                          countries={allCountries}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />
              </Box>
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={changeAdminUpdate.isLoading()}
      />
    </OnboardingStepContent>
  );
};
