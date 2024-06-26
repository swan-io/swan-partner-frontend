import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
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
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { DatePicker, isDateInRange } from "@swan-io/shared-business/src/components/DatePicker";
import { combineValidators, useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { electronicFormat } from "iban";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Rifm } from "rifm";
import { P, match } from "ts-pattern";
import { GetIbanValidationDocument } from "../graphql/partner";
import { isToday } from "../utils/date";
import { locale, rifmTimeProps, t } from "../utils/i18n";
import {
  validateDateWithinNextYear,
  validateTime,
  validateTodayOrAfter,
} from "../utils/validations";
import { Beneficiary } from "./BeneficiaryWizard";

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
  beneficiary?: Beneficiary;
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
  const [isScheduled, setIsScheduled] = useBoolean(false);
  const [isInstant, setIsInstant] = useBoolean(true);
  const [data, { query }] = useDeferredQuery(GetIbanValidationDocument);

  useEffect(() => {
    if (beneficiary != null) {
      query({ iban: electronicFormat(beneficiary.iban) });
    }
  }, [beneficiary, query]);

  const { Field, submitForm } = useForm({
    scheduledDate: {
      initialValue: "",
      validate: combineValidators(validateTodayOrAfter, validateDateWithinNextYear),
    },
    scheduledTime: {
      initialValue: "",
      validate: (value, { getFieldValue }) => {
        if (value === "") {
          return t("common.form.required");
        }

        const date = getFieldValue("scheduledDate");
        const isScheduleToday = isToday(date);
        const minHours = isScheduleToday ? new Date().getHours() : 0;
        const minMinutes = isScheduleToday ? new Date().getMinutes() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        match({
          isScheduled,
          isInstant,
          option: Option.allFromDict(values),
        })
          .with(
            { isScheduled: true, option: Option.P.Some(P.select()) },
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
      },
    });
  };

  return (
    <>
      <Tile
        style={animations.fadeAndSlideInFromBottom.enter}
        footer={match(data)
          .with(AsyncData.P.NotAsked, () => null)
          .with(AsyncData.P.Loading, () => <ActivityIndicator color={colors.gray[900]} />)
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), data =>
            isScheduled
              ? null
              : match(data.ibanValidation)
                  .with(INSTANT_CREDIT_TRANSFER_AVAILABLE_PATTERN, () => null)
                  .otherwise(() => (
                    <LakeAlert
                      anchored={true}
                      variant="info"
                      title={t("transfer.new.schedule.instantCreditTransfer.notAvailable")}
                    >
                      <LakeText>
                        {t("transfer.new.schedule.instantCreditTransfer.notAvailableDescription")}
                      </LakeText>
                    </LakeAlert>
                  )),
          )
          .otherwise(() => null)}
      >
        <LakeLabel
          label={t("transfer.new.schedule.label")}
          type="radioGroup"
          render={() => (
            <RadioGroup
              disabled={loading}
              direction="row"
              items={scheduleItems}
              value={isScheduled}
              onValueChange={setIsScheduled.toggle}
            />
          )}
        />

        <ResponsiveContainer breakpoint={800}>
          {({ large }) =>
            isScheduled ? (
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
            ) : (
              match(data)
                .with(
                  AsyncData.P.NotAsked,
                  AsyncData.P.Done(
                    Result.P.Ok({ ibanValidation: INSTANT_CREDIT_TRANSFER_AVAILABLE_PATTERN }),
                  ),
                  () => (
                    <>
                      <LakeLabelledCheckbox
                        disabled={loading}
                        label={t("transfer.new.instantTransfer")}
                        value={isInstant}
                        onValueChange={setIsInstant.toggle}
                      />

                      {!isInstant && (
                        <>
                          <Space height={4} />
                          <LakeText>{t("transfer.new.regularTransferDescription")}</LakeText>
                        </>
                      )}
                    </>
                  ),
                )
                .otherwise(() => null)
            )
          }
        </ResponsiveContainer>
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
