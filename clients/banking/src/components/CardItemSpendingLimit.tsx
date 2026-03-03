import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { match, P } from "ts-pattern";
import { DayEnum, SpendingLimitFragment, SpendingLimitInput } from "../graphql/partner";
import { t } from "../utils/i18n";

const PERIODS = [
  { name: t("cardSettings.spendingLimit.daily"), value: "Daily" as const },
  { name: t("cardSettings.spendingLimit.weekly"), value: "Weekly" as const },
  { name: t("cardSettings.spendingLimit.monthly"), value: "Monthly" as const },
  { name: t("cardSettings.spendingLimit.always"), value: "Always" as const },
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
        period: SpendingLimitFragment["period"];
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
      mode: {
        rolling: {
          rollingValue: mode.rollingValue,
        },
      },
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
      <View>
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
      </View>

      <Space height={16} />

      <LakeLabel
        label={t("cardSettings.spendingLimit.period")}
        render={id => (
          <LakeSelect
            id={id}
            items={PERIODS}
            value={"Always"}
            disabled={disabled}
            onValueChange={_period =>
              onChange({
                ...value,
                // period,
              })
            }
          />
        )}
      />
    </>
  );
};
