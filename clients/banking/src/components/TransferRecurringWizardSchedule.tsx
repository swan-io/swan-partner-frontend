import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
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
import { pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import { DatePicker, isDateInRange } from "@swan-io/shared-business/src/components/DatePicker";
import { useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { Rifm } from "rifm";
import { StandingOrderPeriod } from "../graphql/partner";
import { isToday } from "../utils/date";
import { locale, rifmTimeProps, t } from "../utils/i18n";
import { validateTime, validateTodayOrAfter } from "../utils/validations";

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
  const { Field, FieldsListener, submitForm, resetField } = useForm({
    period: {
      initialValue: "Daily" as StandingOrderPeriod,
    },
    firstExecutionDate: {
      initialValue: dayjs.utc().format(locale.dateFormat),
      sanitize: trim,
      validate: value => {
        return validateTodayOrAfter(value);
      },
    },
    firstExecutionTime: {
      initialValue: "",
      validate: (value, { getFieldValue }) => {
        if (value === "") {
          return t("common.form.required");
        }

        const date = getFieldValue("firstExecutionDate");
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
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const withLastExecutionDate = getFieldValue("withLastExecutionDate");
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

        const firstExecution = getFieldValue("firstExecutionDate");
        const firstExecutionDate = dayjs.utc(firstExecution, locale.dateFormat);
        if (lastExecutionDate.isBefore(firstExecutionDate)) {
          return t("error.lastExecutionDateBeforeFirstExecutionDate");
        }
      },
    },
    lastExecutionTime: {
      initialValue: "",
      validate: (value, { getFieldValue }) => {
        const withLastExecutionDate = getFieldValue("withLastExecutionDate");
        if (!withLastExecutionDate) {
          return;
        }

        if (value === "") {
          return t("common.form.required");
        }

        const firstExecutionTime = dayjs(getFieldValue("firstExecutionTime"), "HH:mm");

        const isScheduleSameDay =
          getFieldValue("firstExecutionDate") === getFieldValue("lastExecutionDate");
        const minHours = isScheduleSameDay ? firstExecutionTime.hour() : 0;
        const minMinutes = isScheduleSameDay ? firstExecutionTime.minute() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(
          pick(values, ["period", "firstExecutionDate", "firstExecutionTime"]),
        );

        if (option.isSome()) {
          onSave({
            ...option.get(),
            lastExecutionDate: values.lastExecutionDate.toUndefined(),
            lastExecutionTime: values.lastExecutionTime.toUndefined(),
          });
        }
      },
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
                      onChange={value => {
                        onChange(value);
                        if (dayjs.utc(value, locale.dateFormat).isSame(dayjs(), "day")) {
                          resetField("firstExecutionTime");
                        }
                      }}
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
                      {({ value, onChange, onBlur, error, valid, ref }) => (
                        <Rifm value={value} onChange={onChange} {...rifmTimeProps}>
                          {({ value, onChange }) => (
                            <LakeTextInput
                              id={id}
                              ref={ref}
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
            {({ value, onChange, ref }) => (
              <Switch ref={ref} value={value} onValueChange={onChange} />
            )}
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
                            {({ value, onChange, onBlur, error, valid, ref }) => (
                              <Rifm value={value} onChange={onChange} {...rifmTimeProps}>
                                {({ value, onChange }) => (
                                  <LakeTextInput
                                    id={id}
                                    ref={ref}
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

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious} grow={small}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={onPressSubmit} loading={loading} grow={small}>
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </>
  );
};
