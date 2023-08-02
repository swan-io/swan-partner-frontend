import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { StandingOrderPeriod } from "../graphql/partner";
import { locale, rifmDateProps, t } from "../utils/i18n";
import { validateRequired, validateTodayOrAfter } from "../utils/validations";

const periodItems: RadioGroupItem<StandingOrderPeriod>[] = [
  { value: "Daily", name: t("payments.new.standingOrder.details.daily") },
  { value: "Weekly", name: t("payments.new.standingOrder.details.weekly") },
  { value: "Monthly", name: t("payments.new.standingOrder.details.monthly") },
];

export type Schedule = {
  period: StandingOrderPeriod;
  firstExecutionDate: string;
  lastExecutionDate?: string;
};

type Props = {
  onPressPrevious: () => void;
  onSave: (schedule: Schedule) => void;
  loading: boolean;
};

export const TransferRecurringWizardSchedule = ({ onPressPrevious, onSave, loading }: Props) => {
  const { Field, FieldsListener, submitForm } = useForm({
    period: {
      initialValue: "Daily" as StandingOrderPeriod,
    },
    firstExecutionDate: {
      initialValue: dayjs.utc().format(locale.dateFormat),
      validate: combineValidators(validateRequired, validateTodayOrAfter),
      sanitize: value => value?.trim(),
    },
    withLastExecutionDate: {
      initialValue: false,
    },
    lastExecutionDate: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        const withLastExecutionDate = getFieldState("withLastExecutionDate").value;
        if (!withLastExecutionDate) {
          return;
        }

        if (value === "") {
          return t("common.form.required");
        }

        const lastExecutionDate = dayjs.utc(value, locale.dateFormat);
        if (!lastExecutionDate.isValid()) {
          return t("common.form.invalidDate");
        }

        const firstExecution = getFieldState("firstExecutionDate").value;
        const firstExecutionDate = dayjs.utc(firstExecution, locale.dateFormat);
        if (lastExecutionDate.isBefore(firstExecutionDate)) {
          return t("error.lastExecutionDateBeforeFirstExecutionDate");
        }
      },
      sanitize: value => value?.trim(),
    },
  });

  const onPressSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["period", "firstExecutionDate"])) {
        onSave({
          period: values.period,
          firstExecutionDate: values.firstExecutionDate,
          lastExecutionDate: nullishOrEmptyToUndefined(values.lastExecutionDate),
        });
      }
    });
  };

  return (
    <>
      <Tile>
        <LakeLabel
          label={t("recurringTransfer.new.frequency.label")}
          type="radioGroup"
          render={() => (
            <Field name="period">
              {({ value, onChange }) => (
                <RadioGroup
                  items={periodItems}
                  value={value}
                  direction="row"
                  onValueChange={onChange}
                />
              )}
            </Field>
          )}
        />

        <Space height={24} />

        <LakeLabel
          label={t("recurringTransfer.new.firstExecutionDate.label")}
          render={id => (
            <Field name="firstExecutionDate">
              {({ value, onChange, onBlur, error, valid }) => (
                <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                  {({ value, onChange }) => (
                    <LakeTextInput
                      id={id}
                      placeholder={locale.datePlaceholder}
                      value={value}
                      error={error}
                      valid={value !== "" && valid}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                </Rifm>
              )}
            </Field>
          )}
        />

        <Space width={24} height={4} />

        <Box direction="row" alignItems="center">
          <Field name="withLastExecutionDate">
            {({ value, onChange }) => <Switch value={value} onValueChange={onChange} />}
          </Field>

          <Space width={12} />

          <LakeText color={colors.gray[700]} variant="smallMedium">
            {t("recurringTransfer.new.setEndDate")}
          </LakeText>
        </Box>

        <Space width={24} height={24} />

        <LakeLabel
          label={t("recurringTransfer.new.lastExecutionDate.label")}
          render={id => (
            <FieldsListener names={["withLastExecutionDate"]}>
              {({ withLastExecutionDate }) => (
                <Field name="lastExecutionDate">
                  {({ value, onChange, onBlur, error, valid }) => (
                    <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                      {({ value, onChange }) => (
                        <LakeTextInput
                          id={id}
                          placeholder={locale.datePlaceholder}
                          value={withLastExecutionDate.value ? value : undefined}
                          error={withLastExecutionDate.value ? error : undefined}
                          disabled={!withLastExecutionDate.value}
                          valid={withLastExecutionDate.value && value !== "" && valid}
                          onChange={onChange}
                          onBlur={onBlur}
                        />
                      )}
                    </Rifm>
                  )}
                </Field>
              )}
            </FieldsListener>
          )}
        />
      </Tile>

      <Space height={32} />

      <LakeButtonGroup>
        <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
          {t("common.previous")}
        </LakeButton>

        <LakeButton color="current" onPress={onPressSubmit} loading={loading}>
          {t("common.continue")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};
