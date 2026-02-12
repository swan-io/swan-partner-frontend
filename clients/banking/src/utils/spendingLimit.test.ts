import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMonthlySpendingDate } from "./spendingLimit";

describe("getMonthlySpendingDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return the spending date for the current month when it hasn't occurred yet", () => {
    // Set current date to January 10, 2024 at 10:00
    vi.setSystemTime(new Date(2024, 0, 10, 10, 0));

    // Spending day is 15th at 12:00
    const result = getMonthlySpendingDate(15, 12);

    // Should return January 15, 2024 at 12:00
    const expected = dayjs().startOf("month").add(14, "day").add(12, "hour").format("LLL");

    expect(result).toBe(expected);
  });

  it("should return next month's date when the spending date has already passed", () => {
    // Set current date to January 20, 2024 at 10:00
    vi.setSystemTime(new Date(2024, 0, 20, 10, 0));

    // Spending day is 15th at 12:00 (already passed)
    const result = getMonthlySpendingDate(15, 12);

    // Should return February 15, 2024 at 12:00
    const expected = dayjs()
      .startOf("month")
      .add(14, "day")
      .add(12, "hour")
      .add(1, "M")
      .format("LLL");

    expect(result).toBe(expected);
  });

  it("should return the last day of the month when spending day doesn't exist in current month", () => {
    // Set current date to February 10, 2024 at 10:00 (2024 is a leap year, so Feb has 29 days)
    vi.setSystemTime(new Date(2024, 1, 10, 10, 0));

    // Spending day is 31st (doesn't exist in February)
    const result = getMonthlySpendingDate(31, 12);

    // Should return the last day of February (29th) at the specified hour
    const daysInMonth = dayjs().daysInMonth();
    const expected = dayjs()
      .startOf("month")
      .set("day", daysInMonth - 1)
      .format("LLL");

    expect(result).toBe(expected);
  });

  it("should handle spending day on the 1st of the month", () => {
    // Set current date to January 5, 2024
    vi.setSystemTime(new Date(2024, 0, 5, 10, 0));

    // Spending day is 1st at 0:00 (already passed)
    const result = getMonthlySpendingDate(1, 0);

    // Should return February 1st
    const expected = dayjs()
      .startOf("month")
      .add(0, "day")
      .add(0, "hour")
      .add(1, "M")
      .format("LLL");

    expect(result).toBe(expected);
  });

  it("should handle spending date occurring later today", () => {
    // Set current date to January 15, 2024 at 10:00
    vi.setSystemTime(new Date(2024, 0, 15, 10, 0));

    // Spending day is 15th at 18:00 (later today)
    const result = getMonthlySpendingDate(15, 18);

    // Should return today at 18:00
    const expected = dayjs().startOf("month").add(14, "day").add(18, "hour").format("LLL");

    expect(result).toBe(expected);
  });

  it("should handle spending date that occurred earlier today", () => {
    // Set current date to January 15, 2024 at 18:00
    vi.setSystemTime(new Date(2024, 0, 15, 18, 0));

    // Spending day is 15th at 10:00 (earlier today)
    const result = getMonthlySpendingDate(15, 10);

    // Should return next month (February 15th)
    const expected = dayjs()
      .startOf("month")
      .add(14, "day")
      .add(10, "hour")
      .add(1, "M")
      .format("LLL");

    expect(result).toBe(expected);
  });

  it("should handle non-leap year February with day 30", () => {
    // Set current date to February 10, 2023 (not a leap year, so Feb has 28 days)
    vi.setSystemTime(new Date(2023, 1, 10, 10, 0));

    // Spending day is 30th (doesn't exist in February)
    const result = getMonthlySpendingDate(30, 12);

    // Should return the last day of February (28th)
    const daysInMonth = dayjs().daysInMonth();
    const expected = dayjs()
      .startOf("month")
      .set("day", daysInMonth - 1)
      .format("LLL");

    expect(result).toBe(expected);
  });

  it("should handle end of month edge case with day 31", () => {
    // Set current date to April 10, 2024 (April has 30 days)
    vi.setSystemTime(new Date(2024, 3, 10, 10, 0));

    // Spending day is 31st (doesn't exist in April)
    const result = getMonthlySpendingDate(31, 12);

    // Should return the last day of April (30th)
    const daysInMonth = dayjs().daysInMonth();
    const expected = dayjs()
      .startOf("month")
      .set("day", daysInMonth - 1)
      .format("LLL");

    expect(result).toBe(expected);
  });
});
