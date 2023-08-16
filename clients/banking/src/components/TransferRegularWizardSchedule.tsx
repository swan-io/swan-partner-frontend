import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { DatePicker, isDateInRange } from "@swan-io/lake/src/components/DatePicker";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { monthNames, weekDayNames } from "@swan-io/shared-business/src/utils/date";
import dayjs from "dayjs";
import { electronicFormat } from "iban";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { combineValidators, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { P, match } from "ts-pattern";
import { GetIbanValidationDocument } from "../graphql/partner";
import { isToday } from "../utils/date";
import { locale, rifmTimeProps, t } from "../utils/i18n";
import {
  validateDateWithinNextYear,
  validateRequired,
  validateTime,
  validateTodayOrAfter,
} from "../utils/validations";
import { ErrorView } from "./ErrorView";
import { Beneficiary } from "./TransferWizardBeneficiary";

const styles = StyleSheet.create({
  field: {
    ...commonStyles.fill,
    flexBasis: "50%",
  },
});

const scheduleItems: RadioGroupItem<boolean>[] = [
  {
    name: t("transfer.new.schedule.today"),
    value: false,
  },
  {
    name: t("transfer.new.schedule.later"),
    value: true,
  },
];

export type Schedule =
  | { isScheduled: true; scheduledDate: string; scheduledTime: string }
  | { isScheduled: false; isInstant: boolean };

type Props = {
  onPressPrevious: () => void;
  onSave: (schedule: Schedule) => void;
  beneficiary: Beneficiary;
  loading: boolean;
};

const INSTANT_CREDIT_TRANSFER_AVAILABLE_PATTERN = {
  __typename: "ValidIban",
  reachability: { sepaCreditTransferInst: true },
} as const;

export const TransferRegularWizardSchedule = ({
  beneficiary,
  onPressPrevious,
  onSave,
  loading,
}: Props) => {
  const { data } = useUrqlQuery(
    {
      query: GetIbanValidationDocument,
      variables: {
        iban: electronicFormat(beneficiary.iban),
      },
    },
    [beneficiary.iban],
  );

  const { Field, FieldsListener, submitForm } = useForm({
    isScheduled: {
      initialValue: false,
    },
    scheduledDate: {
      initialValue: "",
      validate: combineValidators(
        validateRequired,
        validateTodayOrAfter,
        validateDateWithinNextYear,
      ),
    },
    scheduledTime: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        if (value === "") {
          return t("common.form.required");
        }

        const date = getFieldState("scheduledDate").value;
        const isScheduleToday = isToday(date);
        const minHours = isScheduleToday ? new Date().getHours() : 0;
        const minMinutes = isScheduleToday ? new Date().getMinutes() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
    },
    isInstant: {
      initialValue: false,
    },
  });

  const onPressSubmit = () => {
    submitForm(values => {
      match(values)
        .with(
          { isScheduled: true, scheduledDate: P.string, scheduledTime: P.string },
          ({ scheduledDate, scheduledTime }) => {
            onSave({ isScheduled: true, scheduledDate, scheduledTime });
          },
        )
        .with({ isInstant: P.boolean }, ({ isInstant }) => {
          onSave({ isScheduled: false, isInstant });
        })
        .otherwise(() => {
          onSave({ isScheduled: false, isInstant: false });
        });
    });
  };

  return (
    <>
      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
          <ActivityIndicator color={colors.gray[900]} />
        ))
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
          return (
            <>
              <Tile
                style={animations.fadeAndSlideInFromBottom.enter}
                footer={
                  <FieldsListener names={["isScheduled"]}>
                    {({ isScheduled }) =>
                      isScheduled.value
                        ? null
                        : match(data.ibanValidation)
                            .with(INSTANT_CREDIT_TRANSFER_AVAILABLE_PATTERN, () => null)
                            .otherwise(() => (
                              <LakeAlert
                                anchored={true}
                                variant="info"
                                title={t(
                                  "transfer.new.schedule.instantCreditTransfer.notAvailable",
                                )}
                              >
                                <LakeText>
                                  {t(
                                    "transfer.new.schedule.instantCreditTransfer.notAvailableDescription",
                                  )}
                                </LakeText>
                              </LakeAlert>
                            ))
                    }
                  </FieldsListener>
                }
              >
                <LakeLabel
                  label={t("transfer.new.schedule.label")}
                  type="radioGroup"
                  render={() => (
                    <Field name="isScheduled">
                      {({ value, onChange }) => (
                        <RadioGroup
                          disabled={loading}
                          direction="row"
                          items={scheduleItems}
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <Space height={12} />

                <ResponsiveContainer breakpoint={800}>
                  {({ large }) => (
                    <FieldsListener names={["isScheduled"]}>
                      {({ isScheduled }) =>
                        isScheduled.value ? (
                          <Box direction={large ? "row" : "column"}>
                            <View style={styles.field}>
                              <Field name="scheduledDate">
                                {({ value, onChange, error }) => (
                                  <DatePicker
                                    label={t("transfer.new.scheduleDate.label")}
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
                                label={t("transfer.new.scheduleTime.label")}
                                render={id => (
                                  <Field name="scheduledTime">
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
                        ) : (
                          match(data.ibanValidation)
                            .with(INSTANT_CREDIT_TRANSFER_AVAILABLE_PATTERN, () => (
                              <>
                                <Field name="isInstant">
                                  {({ value, onChange }) => (
                                    <LakeLabelledCheckbox
                                      disabled={loading}
                                      label={t("transfer.new.instantTransfer")}
                                      value={value}
                                      onValueChange={onChange}
                                    />
                                  )}
                                </Field>
                              </>
                            ))
                            .otherwise(() => null)
                        )
                      }
                    </FieldsListener>
                  )}
                </ResponsiveContainer>
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
        })
        .otherwise(() => (
          <ErrorView />
        ))}
    </>
  );
};
