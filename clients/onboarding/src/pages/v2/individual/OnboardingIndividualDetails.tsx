import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  IndividualOnboardingFragment,
  UpdatePublicIndividualAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";
import { Router } from "../../../utils/routes";
import {
  extractServerValidationErrors,
  getValidationErrorMessage,
  validateEmail,
  validateName,
  validateRequired,
} from "../../../utils/validation";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>; // todo IndividualOnboardingFragment
};

const styles = StyleSheet.create({
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  inputContainer: {
    flex: 1,
  },
});

export const OnboardingIndividualDetails = ({ onboarding }: Props) => {
  const [updateIndividualOnboarding, updateResult] = useMutation(
    UpdatePublicIndividualAccountHolderOnboardingDocument,
  );
  const onboardingId = onboarding.id;

  const { accountAdmin } = onboarding;
  const { Field, setFieldError, submitForm } = useForm({
    email: {
      initialValue: accountAdmin?.email ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateEmail),
    },
    firstName: {
      initialValue: accountAdmin?.firstName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    lastName: {
      initialValue: accountAdmin?.lastName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    // birthDate: {
    //   initialValue: accountAdmin?.birthInfo?.birthDate ?? undefined,
    //   validate: validateNullableRequired,
    // },
  });

  const onPressPrevious = () => {
    Router.push("Root", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();

        updateIndividualOnboarding({
          input: {
            onboardingId,
            accountAdmin: {
              ...currentValues,
            },
          },
        })
          .mapOk(data => data.updatePublicIndividualAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Address", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path => {
                  return match(path)
                    .with(["accountAdmin", "email"], () => "email" as const)
                    .with(["accountAdmin", "firstName"], () => "firstName" as const)
                    .with(["accountAdmin", "lastName"], () => "lastName" as const)
                    .otherwise(() => null);
                });
                invalidFields.forEach(({ fieldName, code }) => {
                  const message = getValidationErrorMessage(code, currentValues[fieldName]);
                  setFieldError(fieldName, message);
                });
              })
              .otherwise(noop);

            // @todo showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  return (
    <ResponsiveContainer breakpoint={breakpoints.tiny}>
      {({ large, small }) => (
        <>
          <Tile>
            <StepTitle isMobile={small}>{t("individual.step.details.title")}</StepTitle>

            <Box style={[styles.grid, large && styles.gridDesktop]}>
              <LakeLabel
                type="form"
                label={t("individual.step.email.label")}
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
                        placeholder="Swan"
                      />
                    )}
                  </Field>
                )}
              />
              <LakeLabel
                type="form"
                label={t("individual.step.email.label")}
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
                        placeholder="Black"
                      />
                    )}
                  </Field>
                )}
              />
              <LakeLabel
                type="form"
                label={t("individual.step.email.label")}
                style={styles.inputContainer}
                render={id => (
                  <Field name="email">
                    {({ value, onBlur, onChange, error, ref }) => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        error={error}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Swan"
                      />
                    )}
                  </Field>
                )}
              />
            </Box>
          </Tile>
          <OnboardingFooter
            onNext={onPressNext}
            onPrevious={onPressPrevious}
            loading={updateResult.isLoading()}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
