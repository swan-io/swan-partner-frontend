import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  DayEnum,
  SpendingLimitFragment,
  SpendingLimitInput,
  SpendingLimitPeriod,
} from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
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
  return match(value)
    .returnType<SpendingLimitInput>()
    .with({ mode: { type: "rolling" } }, ({ amount, mode }) => ({
      amount,
      period: mode.period,
      mode: mode.period === "Always" ? null : { rolling: { rollingValue: mode.rollingValue } },
    }))
    .with({ mode: { type: "calendarDayMode" } }, ({ amount, mode }) => ({
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
    .with({ mode: { type: "calendarWeekMode" } }, ({ amount, mode }) => ({
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
    .with({ mode: { type: "calendarMonthMode" } }, ({ amount, mode }) => ({
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
  value: SpendingLimitValue;
  maxValue?: number;
  disabled?: boolean;
  onChange: (value: SpendingLimitValue) => void;
};

export const SpendingLimitForm = ({
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
  disabled,
  value,
  onChange,
}: {
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

      <Box direction="row">
        {value.type !== "calendarDayMode" && (
          <>
            <LakeLabel
              style={styles.fill}
              label={t("cardSettings.spendingLimit.resetDay")}
              render={id => (
                <>
                  <LakeSelect
                    id={id}
                    hideErrors={true}
                    disabled={disabled}
                    value={""}
                    items={[]}
                    onValueChange={() => {}}
                  />
                  {value.type === "calendarMonthMode" && (
                    <>
                      <Space height={4} />
                      <LakeText>{t("cardSettings.spendingLimit.resetDay.monthlyInfo")}</LakeText>
                    </>
                  )}
                </>
              )}
            />

            <Space width={32} />
          </>
        )}

        <LakeLabel
          style={styles.fill}
          label={t("cardSettings.spendingLimit.resetTime")}
          render={id => (
            <>
              <LakeSelect
                id={id}
                hideErrors={true}
                disabled={disabled}
                value={""}
                items={[]}
                onValueChange={() => {}}
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
