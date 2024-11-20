import { Option } from "@swan-io/boxed";
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
import { pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { combineValidators, useForm } from "@swan-io/use-form";
import { FragmentOf, readFragment } from "gql.tada";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { UpdateIndividualOnboardingMutation } from "../../mutations/UpdateIndividualOnboardingMutation";
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

export const IndividualEmailOnboardingInfoFragment = graphql(`
  fragment IndividualEmailOnboardingInfo on OnboardingInfo {
    accountCountry
    projectInfo {
      id
      name
      tcuDocumentUri(language: $language)
    }
    email
    tcuUrl
  }
`);

type Props = {
  onboardingId: string;
  onboardingInfoData: FragmentOf<typeof IndividualEmailOnboardingInfoFragment>;

  serverValidationErrors: {
    fieldName: "email";
    code: ServerInvalidFieldCode;
  }[];

  onPressPrevious: () => void;
  onSave: () => void;
};

export const OnboardingIndividualEmail = ({
  onboardingId,
  onboardingInfoData,
  serverValidationErrors,

  onPressPrevious,
  onSave,
}: Props) => {
  const onboardingInfo = readFragment(IndividualEmailOnboardingInfoFragment, onboardingInfoData);
  const [updateOnboarding, updateResult] = useMutation(UpdateIndividualOnboardingMutation);
  const isFirstMount = useFirstMountState();

  const hasToAcceptTcu = onboardingInfo.accountCountry === "DEU";

  const { Field, submitForm, setFieldError, FieldsListener } = useForm({
    email: {
      initialValue: onboardingInfo.email ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateEmail),
    },
    tcuAccepted: {
      initialValue: false,
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
        const option = Option.allFromDict(pick(values, ["email"]));

        if (option.isNone()) {
          return;
        }

        const currentValues = option.get();

        updateOnboarding({
          input: { onboardingId, email: currentValues.email, language: locale.language },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateIndividualOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(onSave)
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path =>
                  path[0] === "email" ? "email" : null,
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

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("individual.step.email.title")}</StepTitle>
              <Space height={small ? 8 : 12} />
              <LakeText>{t("individual.step.email.description")}</LakeText>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="email">
                  {({ value, error, valid, onChange, ref }) => (
                    <LakeLabel
                      label={t("individual.step.email.label")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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

              <Box alignItems="start">
                <Box direction="row" justifyContent="start">
                  {hasToAcceptTcu ? (
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
                  ) : null}

                  {hasToAcceptTcu ? null : (
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

                {hasToAcceptTcu ? (
                  <>
                    <Space height={4} />

                    <FieldsListener names={["tcuAccepted"]}>
                      {({ tcuAccepted }) => (
                        <LakeText color={colors.negative[500]}>{tcuAccepted.error ?? " "}</LakeText>
                      )}
                    </FieldsListener>
                  </>
                ) : null}
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
