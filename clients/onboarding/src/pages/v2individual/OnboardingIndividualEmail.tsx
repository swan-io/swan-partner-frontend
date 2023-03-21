import { Result } from "@swan-io/boxed";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Link } from "@swan-io/lake/src/components/Link";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { AccountCountry, UpdateIndividualOnboardingDocument } from "../../graphql/unauthenticated";
import { formatNestedMessage, locale, t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import {
  extractServerValidationErrors,
  getValidationErrorMessage,
  ServerInvalidFieldCode,
  validateEmail,
  validateRequired,
} from "../../utils/validation";

const styles = StyleSheet.create({
  link: {
    color: colors.partner[500],
    textDecorationLine: "underline",
  },
  linkIcon: {
    marginLeft: 4,
    display: "inline-block",
    textAlignVertical: "center",
  },
});

type Props = {
  initialEmail: string;
  projectName: string;
  accountCountry: AccountCountry;
  onboardingId: string;
  serverValidationErrors: {
    fieldName: "email";
    code: ServerInvalidFieldCode;
  }[];
  tcuDocumentUri?: string;
  tcuUrl: string;
};

export const OnboardingIndividualEmail = ({
  initialEmail,
  projectName,
  onboardingId,
  serverValidationErrors,
  tcuDocumentUri,
  tcuUrl,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateIndividualOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const { Field, submitForm, setFieldError } = useForm({
    email: {
      initialValue: initialEmail,
      validate: combineValidators(validateRequired, validateEmail),
      sanitize: value => value.trim(),
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
    Router.push("OnboardingRoot", { onboardingId });
  };

  const onPressNext = () => {
    submitForm(values => {
      if (!hasDefinedKeys(values, ["email"])) {
        return;
      }

      updateOnboarding({
        input: { onboardingId, email: values.email, language: locale.language },
        language: locale.language,
      })
        .mapResult(({ unauthenticatedUpdateIndividualOnboarding }) =>
          match(unauthenticatedUpdateIndividualOnboarding)
            .with(
              { __typename: "UnauthenticatedUpdateIndividualOnboardingSuccessPayload" },
              value => Result.Ok(value),
            )
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          Router.push("OnboardingLocation", { onboardingId });
        })
        .tapError(error => {
          match(error)
            .with({ __typename: "ValidationRejection" }, error => {
              const invalidFields = extractServerValidationErrors(error, path =>
                path[0] === "email" ? "email" : null,
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
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("individual.step.email.title")}</StepTitle>
              <Space height={small ? 8 : 12} />
              <LakeText>{t("individual.step.introduction.description")}</LakeText>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="email">
                  {({ value, error, valid, onChange }) => (
                    <LakeLabel
                      label={t("individual.step.email.label")}
                      render={id => (
                        <LakeTextInput
                          nativeID={id}
                          autoFocus={true}
                          placeholder="example@gmail.com"
                          value={value}
                          valid={valid}
                          onChangeText={onChange}
                          error={error}
                        />
                      )}
                    />
                  )}
                </Field>
              </Tile>

              <Space height={small ? 24 : 32} />

              <LakeText align="center">
                {formatNestedMessage("emailPage.terms", {
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
                })}
              </LakeText>
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
