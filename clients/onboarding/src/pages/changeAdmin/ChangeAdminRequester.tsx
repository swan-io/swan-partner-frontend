import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { getCountryByCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet, View } from "react-native";
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
  initialValues: AccountAdminChangeInfoFragment["requester"];
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  nextStep: ChangeAdminRoute;
};

export const ChangeAdminRequester = ({
  initialValues,
  changeAdminRequestId,
  previousStep,
  nextStep,
}: Props) => {
  const [updateChangeAdmin, changeAdminUpdate] = useMutation(UpdateAccountAdminChangeDocument);

  const { Field, submitForm } = useForm({
    firstName: {
      initialValue: initialValues?.firstName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    lastName: {
      initialValue: initialValues?.lastName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    email: {
      initialValue: initialValues?.email ?? "",
      validate: combineValidators(validateRequired, validateEmail),
    },
    phoneNumber: {
      initialValue: {
        country: getCountryByCCA3("FRA"),
        nationalNumber: initialValues?.phoneNumber ?? "",
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
                requester: {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  phoneNumber: values.phoneNumber,
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
            <StepTitle isMobile={small}>{t("changeAdmin.step.requesterInfo.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.requesterInfo.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
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
