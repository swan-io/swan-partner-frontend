import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, radii } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { useForm } from "@swan-io/use-form";
import { Pressable, StyleSheet } from "react-native";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { noop } from "@swan-io/lake/src/utils/function";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { match } from "ts-pattern";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import { badUserInputErrorPattern } from "../../../utils/validation";

export type ActivityFieldName =
  | "businessActivityDescription"
  | "monthlyPaymentVolume"
  | "headcount"
  | "websites"
  | "forecastYearlyIncome";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
};

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gap: "16px 32px",
  },
  addOwnerButton: {
    padding: 18,
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radii[8],
    borderStyle: "dashed",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  additionalDescription: { fontStyle: "italic" },
});

export const OnboardingCompanyOwnership = ({ onboarding }: Props) => {
  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const onboardingId = onboarding.id;
  // const { company } = onboarding;

  const { submitForm } = useForm({});

  const onPressPrevious = () => {
    Router.push("Organisation", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              ...currentValues,
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Finalize", { onboardingId }))
          .tapError(error => {
            match(error)
              .with(badUserInputErrorPattern, () => {
                // const invalidFields = extractServerValidationFields(fields, path => {
                //   return match(path).otherwise(() => null);
                // });
                // invalidFields.forEach(({ fieldName, code }) => {
                //   const message = getValidationErrorMessage(code, currentValues[fieldName]);
                //   setFieldError(fieldName, message);
                // });
              })
              .otherwise(noop);

            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ small }) => (
          <>
            <Tile>
              <StepTitle isMobile={small}>{t("company.step.owners.title")}</StepTitle>
              <Space height={12} />
              <LakeText>{t("company.step.owners.description")}</LakeText>
              <Space height={24} />

              <LakeText style={styles.additionalDescription}>
                {t("company.step.owners.additionalDescription")}
              </LakeText>

              <Space height={24} />

              <Pressable
                role="button"
                style={styles.addOwnerButton}
                onPress={() => console.log("open modal")}
              >
                <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                <Space height={8} />
                <LakeText>{t("company.step.owners.addTitle")}</LakeText>
              </Pressable>
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
