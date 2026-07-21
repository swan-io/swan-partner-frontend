import { describe, expect, it } from "vitest";
import { CreditLimitSettingsRequestFragment } from "../../graphql/partner";
import {
  getPendingCreditLimitAmount,
  getRefusedCreditLimitAmount,
  hasPendingCreditLimitRequest,
} from "../creditLimit";

type Status = CreditLimitSettingsRequestFragment["statusInfo"]["__typename"];

const makeRequest = ({
  id,
  updatedAt,
  status,
  value = "1000",
  currency = "EUR",
}: {
  id: string;
  updatedAt: string;
  status: Status;
  value?: string;
  currency?: string;
}): CreditLimitSettingsRequestFragment => ({
  __typename: "CreditLimitSettingsRequest",
  id,
  updatedAt,
  statusInfo: { __typename: status },
  amount: { __typename: "Amount", value, currency },
});

describe("getPendingCreditLimitAmount", () => {
  it("returns the amount of the most recent pending request", () => {
    const requests = [
      makeRequest({
        id: "1",
        updatedAt: "2024-01-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
        value: "1000",
      }),
      makeRequest({
        id: "2",
        updatedAt: "2024-03-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
        value: "3000",
        currency: "USD",
      }),
    ];
    expect(getPendingCreditLimitAmount(requests)).toEqual({ value: 3000, currency: "USD" });
  });

  it("ignores requests that are not pending", () => {
    const requests = [
      makeRequest({
        id: "1",
        updatedAt: "2024-05-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestRefusedStatusInfo",
        value: "5000",
      }),
      makeRequest({
        id: "2",
        updatedAt: "2024-01-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
        value: "1000",
      }),
    ];
    expect(getPendingCreditLimitAmount(requests)).toEqual({ value: 1000, currency: "EUR" });
  });

  it("returns a zero EUR amount when the list is empty or has no pending request", () => {
    expect(getPendingCreditLimitAmount([])).toEqual({ value: 0, currency: "EUR" });
    expect(
      getPendingCreditLimitAmount([
        makeRequest({
          id: "1",
          updatedAt: "2024-01-01T00:00:00.000Z",
          status: "CreditLimitSettingsRequestApprovedStatusInfo",
        }),
      ]),
    ).toEqual({ value: 0, currency: "EUR" });
  });
});

describe("getRefusedCreditLimitAmount", () => {
  it("returns the amount of the most recent refused request", () => {
    const requests = [
      makeRequest({
        id: "1",
        updatedAt: "2024-01-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestRefusedStatusInfo",
        value: "1000",
      }),
      makeRequest({
        id: "2",
        updatedAt: "2024-03-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestRefusedStatusInfo",
        value: "2000",
      }),
    ];
    expect(getRefusedCreditLimitAmount(requests)).toEqual({ value: 2000, currency: "EUR" });
  });

  it("returns a zero EUR amount when the list is empty or has no refused request", () => {
    expect(getRefusedCreditLimitAmount([])).toEqual({ value: 0, currency: "EUR" });
    expect(
      getRefusedCreditLimitAmount([
        makeRequest({
          id: "1",
          updatedAt: "2024-05-01T00:00:00.000Z",
          status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
          value: "9000",
        }),
      ]),
    ).toEqual({ value: 0, currency: "EUR" });
  });
});

describe("hasPendingCreditLimitRequest", () => {
  it("returns true when the most recent request is pending", () => {
    const requests = [
      makeRequest({
        id: "1",
        updatedAt: "2024-01-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestRefusedStatusInfo",
      }),
      makeRequest({
        id: "2",
        updatedAt: "2024-03-01T00:00:00.000Z",
        status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
      }),
    ];
    expect(hasPendingCreditLimitRequest(requests)).toBe(true);
  });

  it("returns false for an empty list or when the most recent request is not pending", () => {
    expect(hasPendingCreditLimitRequest([])).toBe(false);
    expect(
      hasPendingCreditLimitRequest([
        makeRequest({
          id: "1",
          updatedAt: "2024-01-01T00:00:00.000Z",
          status: "CreditLimitSettingsRequestPendingReviewStatusInfo",
        }),
        makeRequest({
          id: "2",
          updatedAt: "2024-03-01T00:00:00.000Z",
          status: "CreditLimitSettingsRequestApprovedStatusInfo",
        }),
      ]),
    ).toBe(false);
  });
});
