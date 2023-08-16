import { Box } from "@swan-io/lake/src/components/Box";
import { DatePicker, isDateInRange } from "@swan-io/lake/src/components/DatePicker";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { monthNames, weekDayNames } from "@swan-io/shared-business/src/utils/date";
import dayjs from "dayjs";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { StandingOrderPeriod } from "../graphql/partner";
import { encodeDate } from "../utils/date";
import { locale, t } from "../utils/i18n";
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
          firstExecutionDate: encodeDate(values.firstExecutionDate),
          lastExecutionDate: isNotNullishOrEmpty(values.lastExecutionDate)
            ? encodeDate(values.lastExecutionDate)
            : undefined,
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

        <Field name="firstExecutionDate">
          {({ value, onChange, error }) => (
            <DatePicker
              label={t("recurringTransfer.new.firstExecutionDate.label")}
              value={value}
              error={error}
              format={locale.dateFormat}
              firstWeekDay={locale.firstWeekday}
              monthNames={monthNames}
              weekDayNames={weekDayNames}
              onChange={onChange}
              isSelectable={isDateInRange(
                dayjs.utc().toDate(),
                dayjs.utc().add(1, "year").toDate(),
              )}
            />
          )}
        </Field>

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

        <FieldsListener names={["firstExecutionDate", "withLastExecutionDate"]}>
          {({ withLastExecutionDate, firstExecutionDate }) =>
            withLastExecutionDate.value ? (
              <Field name="lastExecutionDate">
                {({ value, onChange, error }) => (
                  <DatePicker
                    label={t("recurringTransfer.new.lastExecutionDate.label")}
                    value={value}
                    error={error}
                    format={locale.dateFormat}
                    firstWeekDay={locale.firstWeekday}
                    monthNames={monthNames}
                    weekDayNames={weekDayNames}
                    onChange={onChange}
                    isSelectable={date => {
                      const datePickerDate = dayjs(`${date.year}-${date.month + 1}-${date.day}`);
                      const startDate = dayjs(firstExecutionDate.value, locale.dateFormat);
                      return datePickerDate.isAfter(startDate) || datePickerDate.isSame(startDate);
                    }}
                  />
                )}
              </Field>
            ) : null
          }
        </FieldsListener>
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
