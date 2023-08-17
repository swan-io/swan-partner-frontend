import { Box } from "@swan-io/lake/src/components/Box";
import { DatePicker, isDateInRange } from "@swan-io/lake/src/components/DatePicker";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { monthNames, weekDayNames } from "@swan-io/shared-business/src/utils/date";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { StandingOrderPeriod } from "../graphql/partner";
import { isToday } from "../utils/date";
import { locale, rifmTimeProps, t } from "../utils/i18n";
import { validateRequired, validateTime, validateTodayOrAfter } from "../utils/validations";

const periodItems: RadioGroupItem<StandingOrderPeriod>[] = [
  { value: "Daily", name: t("payments.new.standingOrder.details.daily") },
  { value: "Weekly", name: t("payments.new.standingOrder.details.weekly") },
  { value: "Monthly", name: t("payments.new.standingOrder.details.monthly") },
];

export type Schedule = {
  period: StandingOrderPeriod;
  firstExecutionDate: string;
  firstExecutionTime: string;
  lastExecutionDate?: string;
  lastExecutionTime?: string;
};

const styles = StyleSheet.create({
  field: {
    ...commonStyles.fill,
    flexBasis: "50%",
  },
});

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
    firstExecutionTime: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        if (value === "") {
          return t("common.form.required");
        }

        const date = getFieldState("firstExecutionDate").value;
        const isScheduleToday = isToday(date);
        const minHours = isScheduleToday ? new Date().getHours() : 0;
        const minMinutes = isScheduleToday ? new Date().getMinutes() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
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
    lastExecutionTime: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        const withLastExecutionDate = getFieldState("withLastExecutionDate").value;
        if (!withLastExecutionDate) {
          return;
        }

        if (value === "") {
          return t("common.form.required");
        }

        const firstExecutionTime = dayjs(getFieldState("firstExecutionTime").value, "HH:mm");

        const isScheduleSameDay =
          getFieldState("firstExecutionDate").value === getFieldState("lastExecutionDate").value;
        const minHours = isScheduleSameDay ? firstExecutionTime.hour() : 0;
        const minMinutes = isScheduleSameDay ? firstExecutionTime.minute() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
    },
  });

  const onPressSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["period", "firstExecutionDate", "firstExecutionTime"])) {
        onSave({
          period: values.period,
          firstExecutionDate: values.firstExecutionDate,
          firstExecutionTime: values.firstExecutionTime,
          lastExecutionDate: values.lastExecutionDate,
          lastExecutionTime: values.lastExecutionTime,
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

        <ResponsiveContainer breakpoint={800}>
          {({ large }) => (
            <Box direction={large ? "row" : "column"}>
              <View style={styles.field}>
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
              </View>

              <Space width={24} />

              <View style={styles.field}>
                <LakeLabel
                  label={t("recurringTransfer.new.firstExecutionTime.label")}
                  render={id => (
                    <Field name="firstExecutionTime">
                      {({ value, onChange, onBlur, error, valid }) => (
                        <Rifm value={value} onChange={onChange} {...rifmTimeProps}>
                          {({ value, onChange }) => (
                            <LakeTextInput
                              id={id}
                              readOnly={loading}
                              placeholder={locale.timePlaceholder.slice(0, -3)}
                              value={value}
                              error={error}
                              valid={valid}
                              onChange={onChange}
                              onBlur={onBlur}
                            />
                          )}
                        </Rifm>
                      )}
                    </Field>
                  )}
                />
              </View>
            </Box>
          )}
        </ResponsiveContainer>

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

        <FieldsListener
          names={["firstExecutionDate", "firstExecutionTime", "withLastExecutionDate"]}
        >
          {({ withLastExecutionDate, firstExecutionDate }) =>
            withLastExecutionDate.value ? (
              <ResponsiveContainer breakpoint={800}>
                {({ large }) => (
                  <Box direction={large ? "row" : "column"}>
                    <View style={styles.field}>
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
                              const datePickerDate = dayjs(
                                `${date.year}-${date.month + 1}-${date.day}`,
                              );
                              const startDate = dayjs(firstExecutionDate.value, locale.dateFormat);
                              return (
                                datePickerDate.isAfter(startDate) ||
                                datePickerDate.isSame(startDate)
                              );
                            }}
                          />
                        )}
                      </Field>
                    </View>

                    <Space width={24} />

                    <View style={styles.field}>
                      <LakeLabel
                        label={t("recurringTransfer.new.lastExecutionTime.label")}
                        render={id => (
                          <Field name="lastExecutionTime">
                            {({ value, onChange, onBlur, error, valid }) => (
                              <Rifm value={value} onChange={onChange} {...rifmTimeProps}>
                                {({ value, onChange }) => (
                                  <LakeTextInput
                                    id={id}
                                    readOnly={loading}
                                    placeholder={locale.timePlaceholder.slice(0, -3)}
                                    value={value}
                                    error={error}
                                    valid={valid}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                  />
                                )}
                              </Rifm>
                            )}
                          </Field>
                        )}
                      />
                    </View>
                  </Box>
                )}
              </ResponsiveContainer>
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
