import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import {
  DayEnum,
  SpendingLimitFragment,
  SpendingLimitInput,
  SpendingLimitPeriod,
} from "../graphql/partner";
import { formatCurrency, locale, t, translateDay } from "../utils/i18n";
import { getMonthlySpendingDate } from "../utils/spendingLimit";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  spendingLimitText: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
});

const ROLLING_PERIODS = [
  { name: t("cardSettings.spendingLimit.rolling.day"), value: "Daily" as const },
  { name: t("cardSettings.spendingLimit.rolling.week"), value: "Weekly" as const },
  { name: t("cardSettings.spendingLimit.rolling.month"), value: "Monthly" as const },
  { name: t("cardSettings.spendingLimit.rolling.always"), value: "Always" as const },
];

const CALENDAR_PERIODS = [
  { name: t("cardSettings.spendingLimit.calendar.daily"), value: "Daily" as const },
  { name: t("cardSettings.spendingLimit.calendar.weekly"), value: "Weekly" as const },
  { name: t("cardSettings.spendingLimit.calendar.monthly"), value: "Monthly" as const },
];

const LIMIT_TYPES = [
  { name: t("cardSettings.spendingLimit.rolling"), value: "rolling" as const },
  { name: t("cardSettings.spendingLimit.calendar"), value: "calendar" as const },
];

const WEEK_DAYS = [
  { name: t("common.form.weekDay.monday"), value: "Monday" as const },
  { name: t("common.form.weekDay.tuesday"), value: "Tuesday" as const },
  { name: t("common.form.weekDay.wednesday"), value: "Wednesday" as const },
  { name: t("common.form.weekDay.thursday"), value: "Thursday" as const },
  { name: t("common.form.weekDay.friday"), value: "Friday" as const },
  { name: t("common.form.weekDay.saturday"), value: "Saturday" as const },
  { name: t("common.form.weekDay.sunday"), value: "Sunday" as const },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1).map(day => ({
  name: t("common.form.monthDay", { count: day }),
  value: day,
}));

const STARTING_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i).map(hour => ({
  name: `${hour.toString().padStart(2, "0")}:00`,
  value: hour,
}));

export type SpendingLimitValue = {
  amount: {
    value: string;
    currency: string;
  };
  mode:
    | {
        type: "rolling";
        rollingValue: number;
        period: SpendingLimitPeriod;
      }
    | {
        type: "calendarDayMode";
        startHour: number;
      }
    | {
        type: "calendarWeekMode";
        startDay: DayEnum;
        startHour: number;
      }
    | {
        type: "calendarMonthMode";
        startDay: number;
        startHour: number;
      };
};

type SpendingLimitRollingMode = Extract<SpendingLimitValue["mode"], { type: "rolling" }>;
type SpendingLimitCalendarMode = Exclude<SpendingLimitValue["mode"], { type: "rolling" }>;

export const deriveSpendingLimitValue = (
  spendingLimits: SpendingLimitFragment[],
): SpendingLimitValue | undefined => {
  const spendingLimit = spendingLimits[0];
  if (spendingLimit == null) {
    return undefined;
  }

  const { amount, period } = spendingLimit;

  return match(spendingLimit.mode)
    .returnType<SpendingLimitValue>()
    .with({ __typename: "SpendingLimitCalendarDayMode" }, mode => ({
      amount,
      mode: {
        type: "calendarDayMode",
        startHour: mode.startHour,
      },
    }))
    .with({ __typename: "SpendingLimitCalendarWeekMode" }, mode => ({
      amount,
      mode: {
        type: "calendarWeekMode",
        startDay: mode.startWeekDay,
        startHour: mode.startHour,
      },
    }))
    .with({ __typename: "SpendingLimitCalendarMonthMode" }, mode => ({
      amount,
      mode: {
        type: "calendarMonthMode",
        startDay: mode.startMonthDay,
        startHour: mode.startHour,
      },
    }))
    .with({ __typename: "SpendingLimitRollingMode" }, mode => ({
      amount,
      mode: {
        type: "rolling",
        rollingValue: mode.rollingValue,
        period: period,
      },
    }))
    .with(P.nullish, () => ({
      amount,
      mode: {
        type: "rolling",
        rollingValue: 1,
        period,
      },
    }))
    .exhaustive();
};

export const deriveSpendingLimitInput = (value: SpendingLimitValue): SpendingLimitInput => {
  const amount = {
    value: value.amount.value,
    currency: value.amount.currency,
  };
  return match(value)
    .returnType<SpendingLimitInput>()
    .with({ mode: { type: "rolling" } }, ({ mode }) => ({
      amount,
      period: mode.period,
      mode: mode.period === "Always" ? null : { rolling: { rollingValue: mode.rollingValue } },
    }))
    .with({ mode: { type: "calendarDayMode" } }, ({ mode }) => ({
      amount,
      period: "Daily",
      mode: {
        calendar: {
          daily: {
            startHour: mode.startHour,
          },
        },
      },
    }))
    .with({ mode: { type: "calendarWeekMode" } }, ({ mode }) => ({
      amount,
      period: "Weekly",
      mode: {
        calendar: {
          weekly: {
            startDay: mode.startDay,
            startHour: mode.startHour,
          },
        },
      },
    }))
    .with({ mode: { type: "calendarMonthMode" } }, ({ mode }) => ({
      amount,
      period: "Monthly",
      mode: {
        calendar: {
          monthly: {
            startDay: mode.startDay,
            startHour: mode.startHour,
          },
        },
      },
    }))
    .exhaustive();
};

type SpendingLimitFormProps = {
  large: boolean;
  value: SpendingLimitValue;
  maxValue?: number;
  disabled?: boolean;
  onChange: (value: SpendingLimitValue) => void;
};

export const SpendingLimitForm = ({
  large,
  value,
  maxValue,
  disabled,
  onChange,
}: SpendingLimitFormProps) => {
  const [dirtyValue, setDirtyValue] = useState(
    isNullish(value.amount.value) ? undefined : String(value.amount.value),
  );

  useEffect(() => {
    setDirtyValue(isNullish(value.amount.value) ? undefined : String(value.amount.value));
  }, [value.amount.value]);

  const sanitizeInput = useCallback(() => {
    if (isNullish(dirtyValue)) {
      return;
    }
    const sanitizedDirtyValue = dirtyValue.replace(",", ".");

    const cleanValue = Math.max(
      Math.min(Number(sanitizedDirtyValue), maxValue ?? Number.POSITIVE_INFINITY),
      0,
    );
    const parsedValue = Number.isNaN(cleanValue) ? 0 : cleanValue;

    setDirtyValue(String(parsedValue));
    onChange({
      ...value,
      amount: { ...value.amount, value: String(parsedValue) },
    });
  }, [maxValue, dirtyValue, value, onChange]);

  return (
    <>
      <LakeLabel
        label={t("card.settings.spendingLimit")}
        render={id => (
          <LakeTextInput
            id={id}
            unit={"€"}
            value={dirtyValue}
            onChangeText={setDirtyValue}
            onBlur={sanitizeInput}
            inputMode="decimal"
            disabled={disabled}
          />
        )}
      />

      <Space height={16} />

      <LakeLabel
        label={t("cardSettings.spendingLimit.limitType")}
        render={() => (
          <RadioGroup
            disabled={disabled}
            hideErrors={true}
            color="current"
            value={value.mode.type === "rolling" ? ("rolling" as const) : ("calendar" as const)}
            onValueChange={mode => {
              match(mode)
                .with("rolling", () => {
                  onChange({
                    amount: value.amount,
                    mode: {
                      type: "rolling",
                      rollingValue: value.mode.type === "rolling" ? value.mode.rollingValue : 1,
                      period: "Daily",
                    },
                  });
                })
                .with("calendar", () => {
                  onChange({
                    amount: value.amount,
                    mode: {
                      type: "calendarDayMode",
                      startHour: 0,
                    },
                  });
                })
                .exhaustive();
            }}
            items={LIMIT_TYPES}
          />
        )}
      />

      <Space height={16} />

      {value.mode.type === "rolling" ? (
        <SpendingLimitRollingForm
          disabled={disabled === true}
          value={value.mode}
          onChange={mode => onChange({ ...value, mode })}
        />
      ) : (
        <SpendingLimitCalendarForm
          large={large}
          disabled={disabled === true}
          value={value.mode}
          onChange={mode => onChange({ ...value, mode })}
        />
      )}
    </>
  );
};

const SpendingLimitRollingForm = ({
  disabled,
  value,
  onChange,
}: {
  disabled: boolean;
  value: SpendingLimitRollingMode;
  onChange: (value: SpendingLimitRollingMode) => void;
}) => {
  const rollingValueOptions = useMemo(() => {
    return match(value.period)
      .with("Daily", () =>
        new Array(30)
          .fill(null)
          .map((_, i) => i + 1)
          .map(day => ({ name: t("common.form.nbDays", { count: day }), value: day })),
      )
      .with("Weekly", () =>
        new Array(4)
          .fill(null)
          .map((_, i) => i + 1)
          .map(week => ({ name: t("common.form.nbWeeks", { count: week }), value: week })),
      )
      .with("Monthly", () => [])
      .with("Always", () => [])
      .exhaustive();
  }, [value.period]);

  const periodInfo = match(value.period)
    .with("Monthly", () => t("cardSettings.spendingLimit.rolling.month.info"))
    .with("Always", () => t("cardSettings.spendingLimit.always.always.info"))
    .otherwise(() => null);

  return (
    <>
      <LakeLabel
        label={t("cardSettings.spendingLimit.period")}
        render={id => (
          <>
            <LakeSelect
              id={id}
              hideErrors={true}
              items={ROLLING_PERIODS}
              value={value.period}
              disabled={disabled}
              onValueChange={period =>
                onChange({
                  ...value,
                  rollingValue: 1,
                  period,
                })
              }
            />
            {periodInfo != null && (
              <>
                <Space height={4} />
                <LakeText>{periodInfo}</LakeText>
              </>
            )}
          </>
        )}
      />

      {(value.period === "Daily" || value.period === "Weekly") && (
        <>
          <Space height={16} />

          <LakeLabel
            label={t("cardSettings.spendingLimit.resetEvery")}
            render={id => (
              <LakeSelect
                id={id}
                hideErrors={true}
                items={rollingValueOptions}
                value={value.rollingValue}
                disabled={disabled}
                onValueChange={rollingValue => onChange({ ...value, rollingValue })}
              />
            )}
          />
          <Space height={4} />
          <LakeText>
            {t("cardSettings.spendingLimit.resetEvery.info", {
              frequency: match(value.period)
                .with("Daily", () => t("common.form.nbDays", { count: value.rollingValue }))
                .with("Weekly", () => t("common.form.nbWeeks", { count: value.rollingValue }))
                .exhaustive(),
            })}
          </LakeText>
        </>
      )}
    </>
  );
};

const SpendingLimitCalendarForm = ({
  large,
  disabled,
  value,
  onChange,
}: {
  large: boolean;
  disabled: boolean;
  value: SpendingLimitCalendarMode;
  onChange: (value: SpendingLimitCalendarMode) => void;
}) => {
  return (
    <>
      <LakeLabel
        label={t("cardSettings.spendingLimit.resetFrequency")}
        render={id => (
          <>
            <LakeSelect
              id={id}
              hideErrors={true}
              items={CALENDAR_PERIODS}
              value={match(value.type)
                .returnType<"Daily" | "Weekly" | "Monthly">()
                .with("calendarDayMode", () => "Daily")
                .with("calendarWeekMode", () => "Weekly")
                .with("calendarMonthMode", () => "Monthly")
                .exhaustive()}
              disabled={disabled}
              onValueChange={period =>
                match(period)
                  .with("Daily", () => onChange({ type: "calendarDayMode", startHour: 0 }))
                  .with("Weekly", () =>
                    onChange({ type: "calendarWeekMode", startDay: "Monday", startHour: 0 }),
                  )
                  .with("Monthly", () =>
                    onChange({ type: "calendarMonthMode", startDay: 1, startHour: 0 }),
                  )
                  .exhaustive()
              }
            />
          </>
        )}
      />

      <Space height={16} />

      <Box direction={large ? "row" : "column"} alignItems="start">
        {value.type !== "calendarDayMode" && (
          <>
            <LakeLabel
              style={large ? styles.fill : styles.fullWidth}
              label={t("cardSettings.spendingLimit.resetDay")}
              render={id =>
                match(value)
                  .with({ type: "calendarWeekMode" }, value => (
                    <LakeSelect
                      id={id}
                      hideErrors={true}
                      disabled={disabled}
                      value={value.startDay}
                      items={WEEK_DAYS}
                      onValueChange={startDay => onChange({ ...value, startDay })}
                    />
                  ))
                  .with({ type: "calendarMonthMode" }, value => (
                    <>
                      <LakeSelect
                        id={id}
                        hideErrors={true}
                        disabled={disabled}
                        value={value.startDay}
                        items={MONTH_DAYS}
                        onValueChange={startDay => onChange({ ...value, startDay })}
                      />
                      <Space height={4} />
                      <LakeText>{t("cardSettings.spendingLimit.resetDay.monthlyInfo")}</LakeText>
                    </>
                  ))
                  .exhaustive()
              }
            />

            <Space width={32} height={16} />
          </>
        )}

        <LakeLabel
          style={large ? styles.fill : styles.fullWidth}
          label={t("cardSettings.spendingLimit.resetTime")}
          render={id => (
            <>
              <LakeSelect
                id={id}
                hideErrors={true}
                disabled={disabled}
                value={value.startHour}
                items={STARTING_HOUR_OPTIONS}
                onValueChange={startHour => onChange({ ...value, startHour })}
              />
              <Space height={4} />
              <LakeText>{t("cardSettings.spendingLimit.resetTimeZone")}</LakeText>
            </>
          )}
        />
      </Box>
    </>
  );
};

type RemainingSpendingLimitProps = {
  spending: { amount: { value: string; currency: string } };
  spendingLimit: SpendingLimitFragment;
  hasBindingUserError: boolean;
};

export const RemainingSpendingLimit = ({
  spending,
  spendingLimit,
  hasBindingUserError,
}: RemainingSpendingLimitProps) => {
  const textColor = hasBindingUserError ? colors.gray[300] : colors.gray[800];

  const remainderToSpend = Math.max(
    0,
    Number(spendingLimit.amount.value) - Number(spending.amount.value),
  );

  const remainingTextColor = hasBindingUserError
    ? colors.gray[300]
    : remainderToSpend < 0
      ? colors.negative[500]
      : colors.gray[800];

  return (
    <View style={styles.spendingLimitText}>
      {match(spendingLimit.mode)
        .with({ __typename: "SpendingLimitCalendarDayMode" }, mode => (
          <LakeText color={textColor} variant="smallRegular">
            {t("card.spendingLimit.calendar.daily", {
              amount: formatCurrency(
                Number(spendingLimit.amount.value),
                spendingLimit.amount.currency,
              ),
              period: spendingLimit.period,
              hour: mode.startHour,
            })}
          </LakeText>
        ))
        .with({ __typename: "SpendingLimitCalendarMonthMode" }, mode => (
          <LakeText color={textColor} variant="smallRegular">
            {t("card.spendingLimit.calendar.monthly", {
              amount: formatCurrency(
                Number(spendingLimit.amount.value),
                spendingLimit.amount.currency,
              ),
              period: spendingLimit.period,
              day: getMonthlySpendingDate(mode.startMonthDay, mode.startHour),
            })}
          </LakeText>
        ))
        .with({ __typename: "SpendingLimitCalendarWeekMode" }, mode => (
          <LakeText color={textColor} variant="smallRegular">
            {t("card.spendingLimit.calendar.weekly", {
              amount: formatCurrency(
                Number(spendingLimit.amount.value),
                spendingLimit.amount.currency,
              ),
              period: spendingLimit.period,
              day: translateDay(mode.startWeekDay, locale.language),
              hour: mode.startHour,
            })}
          </LakeText>
        ))
        .otherwise(mode => {
          const rollingValue = mode?.rollingValue ?? 1;
          return (
            <LakeText color={textColor} variant="smallRegular">
              {match(spendingLimit.period)
                .with("Daily", () =>
                  t("card.spendingLimit.remaining.daily", { count: rollingValue }),
                )
                .with("Weekly", () =>
                  t("card.spendingLimit.remaining.weekly", { count: rollingValue }),
                )
                .with("Monthly", () =>
                  t("card.spendingLimit.remaining.monthly", { count: rollingValue }),
                )
                .with("Always", () =>
                  t("card.spendingLimit.remaining.always", { count: rollingValue }),
                )
                .exhaustive()}
            </LakeText>
          );
        })}

      <Fill minWidth={24} />

      <LakeText color={remainingTextColor} variant="smallSemibold">
        {formatCurrency(remainderToSpend, spending.amount.currency)}
      </LakeText>
    </View>
  );
};
