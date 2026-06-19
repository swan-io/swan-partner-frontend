import { describe, expect, it } from "vitest";
import { SpendingLimitFragment } from "../graphql/partner";
import {
  SingleUseSpendingLimitValue,
  deriveSingleUseSpendingLimitValue,
  singleUseToSpendingLimitValue,
  spendingLimitValueToSingleUse,
} from "./singleUseSpendingLimit";

const fragment = (
  period: SpendingLimitFragment["period"],
  value: string,
): SpendingLimitFragment => ({
  __typename: "SpendingLimit",
  period,
  type: "AccountHolder",
  mode: period === "Always" ? null : { __typename: "SpendingLimitRollingMode", rollingValue: 1 },
  amount: { __typename: "Amount", currency: "EUR", value },
});

describe("deriveSingleUseSpendingLimitValue", () => {
  it("returns undefined when there is no spending limit", () => {
    expect(deriveSingleUseSpendingLimitValue([])).toBeUndefined();
  });

  it("reads amount and a one-off (Always) period", () => {
    expect(deriveSingleUseSpendingLimitValue([fragment("Always", "100")])).toEqual({
      amount: { value: "100", currency: "EUR" },
      period: "Always",
    });
  });

  it("reads a recurring (Monthly) period", () => {
    expect(deriveSingleUseSpendingLimitValue([fragment("Monthly", "250")])).toEqual({
      amount: { value: "250", currency: "EUR" },
      period: "Monthly",
    });
  });

  it("falls back to Always for any non-Monthly period", () => {
    expect(deriveSingleUseSpendingLimitValue([fragment("Daily", "50")])?.period).toBe("Always");
  });
});

describe("singleUseToSpendingLimitValue", () => {
  it("maps a one-off limit to a rolling/Always SpendingLimitValue", () => {
    expect(
      singleUseToSpendingLimitValue({
        amount: { value: "100", currency: "EUR" },
        period: "Always",
      }),
    ).toEqual({
      amount: { value: "100", currency: "EUR" },
      mode: { type: "rolling", rollingValue: 1, period: "Always" },
    });
  });

  it("maps a recurring limit to a rolling/Monthly SpendingLimitValue", () => {
    expect(
      singleUseToSpendingLimitValue({
        amount: { value: "100", currency: "EUR" },
        period: "Monthly",
      }),
    ).toEqual({
      amount: { value: "100", currency: "EUR" },
      mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
    });
  });
});

describe("spendingLimitValueToSingleUse", () => {
  it("reads the period from a rolling SpendingLimitValue", () => {
    expect(
      spendingLimitValueToSingleUse({
        amount: { value: "100", currency: "EUR" },
        mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
      }),
    ).toEqual({ amount: { value: "100", currency: "EUR" }, period: "Monthly" });
  });

  it("falls back to Always for a non-Monthly rolling period", () => {
    expect(
      spendingLimitValueToSingleUse({
        amount: { value: "100", currency: "EUR" },
        mode: { type: "rolling", rollingValue: 1, period: "Daily" },
      }).period,
    ).toBe("Always");
  });

  it("falls back to Always for a calendar mode", () => {
    expect(
      spendingLimitValueToSingleUse({
        amount: { value: "100", currency: "EUR" },
        mode: { type: "calendarMonthMode", startDay: 1, startHour: 0 },
      }).period,
    ).toBe("Always");
  });
});

describe("single-use ⇄ shared round-trip", () => {
  it("single-use → shared → single-use is identity", () => {
    const values: SingleUseSpendingLimitValue[] = [
      { amount: { value: "100", currency: "EUR" }, period: "Always" },
      { amount: { value: "250", currency: "EUR" }, period: "Monthly" },
    ];
    for (const value of values) {
      expect(spendingLimitValueToSingleUse(singleUseToSpendingLimitValue(value))).toEqual(value);
    }
  });
});
