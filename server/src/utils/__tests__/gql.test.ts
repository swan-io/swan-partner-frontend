import { Option } from "@bloodyowl/boxed";
import { describe, expect, it } from "vitest";
import { getCalledMutations, getCreditTransfersAccountId } from "../gql";

describe("getCalledMutations", () => {
  it("returns the top-level field of a single mutation", () => {
    expect(getCalledMutations("mutation { updateAccount { id } }")).toEqual(["updateAccount"]);
  });

  it("returns every top-level field of a mutation", () => {
    expect(getCalledMutations("mutation { addCard { id } cancelCard { id } }")).toEqual([
      "addCard",
      "cancelCard",
    ]);
  });

  it("supports named mutation operations", () => {
    expect(getCalledMutations("mutation AddCard { addCard { id } }")).toEqual(["addCard"]);
  });

  it("combines fields across multiple mutation operations", () => {
    expect(getCalledMutations("mutation A { x { id } } mutation B { y { id } }")).toEqual([
      "x",
      "y",
    ]);
  });

  it("ignores query operations", () => {
    expect(getCalledMutations("query { account { id } }")).toEqual([]);
  });

  it("filters out __typename selections", () => {
    expect(getCalledMutations("mutation { __typename addCard { id } }")).toEqual(["addCard"]);
  });
});

describe("getCreditTransfersAccountId", () => {
  const query =
    "mutation InitiateSepaCreditTransfers($input: InitiateCreditTransfersInput!) { initiateCreditTransfers(input: $input) { __typename } }";

  it("returns the accountId passed through the input variable", () => {
    expect(getCreditTransfersAccountId(query, { input: { accountId: "account-id" } })).toEqual(
      Option.Some("account-id"),
    );
  });

  it("returns None when the account is targeted by account number", () => {
    expect(
      getCreditTransfersAccountId(query, {
        input: { accountId: "account-id", accountNumber: "12345" },
      }),
    ).toEqual(Option.Some("account-id"));
    expect(getCreditTransfersAccountId(query, { input: { accountNumber: "12345" } })).toEqual(
      Option.None(),
    );
  });

  it("returns None when variables are missing", () => {
    expect(getCreditTransfersAccountId(query, undefined)).toEqual(Option.None());
    expect(getCreditTransfersAccountId(query, { other: { accountId: "account-id" } })).toEqual(
      Option.None(),
    );
  });

  it("returns None when the input is inlined", () => {
    expect(
      getCreditTransfersAccountId(
        'mutation { initiateCreditTransfers(input: { accountId: "account-id" }) { __typename } }',
        {},
      ),
    ).toEqual(Option.None());
  });

  it("returns None when another mutation is called", () => {
    expect(
      getCreditTransfersAccountId(
        "mutation ($input: InitiateCreditTransfersInput!) { initiateCreditTransfers(input: $input) { __typename } scheduleStandingOrder(input: $input) { __typename } }",
        { input: { accountId: "account-id" } },
      ),
    ).toEqual(Option.None());
    expect(
      getCreditTransfersAccountId(
        "mutation ($input: InitiateCreditTransfersInput!) { initiateInternationalCreditTransfer(input: $input) { __typename } }",
        { input: { accountId: "account-id" } },
      ),
    ).toEqual(Option.None());
  });

  it("returns None when initiateCreditTransfers is called several times", () => {
    expect(
      getCreditTransfersAccountId(
        'mutation ($input: InitiateCreditTransfersInput!) { a: initiateCreditTransfers(input: $input) { __typename } b: initiateCreditTransfers(input: { accountId: "other" }) { __typename } }',
        { input: { accountId: "account-id" } },
      ),
    ).toEqual(Option.None());
  });

  it("returns None when the mutation is hidden in a fragment", () => {
    expect(
      getCreditTransfersAccountId(
        "mutation ($input: InitiateCreditTransfersInput!) { ... on Mutation { initiateCreditTransfers(input: $input) { __typename } } }",
        { input: { accountId: "account-id" } },
      ),
    ).toEqual(Option.None());
  });
});
