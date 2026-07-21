import { describe, expect, it } from "vitest";
import { WebBankingSettingsFragment } from "../../graphql/partner";
import {
  isMutationAuthorizedInWebBanking,
  isMutationRestrictedByWebBankingSettings,
} from "../permissions";

const makeSettings = (
  overrides: Partial<WebBankingSettingsFragment>,
): WebBankingSettingsFragment => ({
  __typename: "WebBankingSettings",
  ...overrides,
});

describe("isMutationRestrictedByWebBankingSettings", () => {
  it("returns true for a mutation present in the permissions matrix", () => {
    expect(isMutationRestrictedByWebBankingSettings("addCard")).toBe(true);
    expect(isMutationRestrictedByWebBankingSettings("updateAccount")).toBe(true);
  });

  it("returns false for a mutation absent from the permissions matrix", () => {
    expect(isMutationRestrictedByWebBankingSettings("unknownMutation")).toBe(false);
    expect(isMutationRestrictedByWebBankingSettings("")).toBe(false);
  });
});

describe("isMutationAuthorizedInWebBanking", () => {
  it("returns true when the single required setting is enabled", () => {
    expect(
      isMutationAuthorizedInWebBanking(
        "updateAccount",
        makeSettings({ canViewAccountDetails: true }),
      ),
    ).toBe(true);
  });

  it("returns true when all required settings are enabled", () => {
    expect(
      isMutationAuthorizedInWebBanking(
        "addAccountMembership",
        makeSettings({ canViewMembers: true, canAddNewMembers: true }),
      ),
    ).toBe(true);
  });

  it("returns false when the required setting is disabled", () => {
    expect(
      isMutationAuthorizedInWebBanking(
        "updateAccount",
        makeSettings({ canViewAccountDetails: false }),
      ),
    ).toBe(false);
  });

  it("returns false when the required setting is missing", () => {
    expect(isMutationAuthorizedInWebBanking("updateAccount", makeSettings({}))).toBe(false);
  });

  it("returns false when only some of the required settings are enabled", () => {
    expect(
      isMutationAuthorizedInWebBanking(
        "addAccountMembership",
        makeSettings({ canViewMembers: true, canAddNewMembers: false }),
      ),
    ).toBe(false);
  });
});
