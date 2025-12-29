import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { useForm } from "@swan-io/use-form";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type Props = {
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  nextStep: ChangeAdminRoute;
};

// TODO get from graphql schema once available
type AccountAdminChangeReason =
  | "CurrentAdministratorLeft"
  | "InternalReorganization"
  | "AppointedByGeneralAssembly"
  | "AppointedByBoardDecision"
  | "Other";

const isNewAdminItems: RadioGroupItem<boolean>[] = [
  {
    name: t("common.yes"),
    value: true,
  },
  {
    name: t("common.no"),
    value: false,
  },
];

const reasonItems: Item<AccountAdminChangeReason>[] = [
  {
    name: t("changeAdmin.step.context2.requestReason.currentAdministratorLeft"),
    value: "CurrentAdministratorLeft",
  },
  {
    name: t("changeAdmin.step.context2.requestReason.internalReorganization"),
    value: "InternalReorganization",
  },
  {
    name: t("changeAdmin.step.context2.requestReason.appointedByGeneralAssembly"),
    value: "AppointedByGeneralAssembly",
  },
  {
    name: t("changeAdmin.step.context2.requestReason.appointedByBoardDecision"),
    value: "AppointedByBoardDecision",
  },
  {
    name: t("changeAdmin.step.context2.requestReason.other"),
    value: "Other",
  },
];

export const ChangeAdminContext2 = ({ changeAdminRequestId, previousStep, nextStep }: Props) => {
  const { Field, submitForm } = useForm({
    isNewAdmin: {
      initialValue: true,
    },
    reason: {
      initialValue: "CurrentAdministratorLeft" as AccountAdminChangeReason,
    },
  });

  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onPressNext = () =>
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        option.match({
          Some: values => {
            console.log("Submit with", values);
            Router.push(nextStep, { requestId: changeAdminRequestId });
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
            <StepTitle isMobile={small}>{t("changeAdmin.step.context2.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.context2.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
              <LakeLabel
                type="form"
                label={t("changeAdmin.step.context2.areYouNewAdmin")}
                render={() => (
                  <Field name="isNewAdmin">
                    {({ value, onChange }) => (
                      <RadioGroup
                        direction="row"
                        items={isNewAdminItems}
                        value={value}
                        hideErrors={true}
                        onValueChange={onChange}
                      />
                    )}
                  </Field>
                )}
              />

              <Space height={12} />

              <LakeLabel
                type="form"
                label={t("changeAdmin.step.context2.requestReason")}
                render={id => (
                  <Field name="reason">
                    {({ value, onChange, ref }) => (
                      <LakeSelect
                        ref={ref}
                        id={id}
                        placeholder={t("changeAdmin.step.context2.requestReason.placeholder")}
                        items={reasonItems}
                        value={value}
                        hideErrors={true}
                        onValueChange={onChange}
                      />
                    )}
                  </Field>
                )}
              />
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} loading={false} />
    </OnboardingStepContent>
  );
};
