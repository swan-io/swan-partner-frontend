import { isMatching, Pattern } from "ts-pattern";
import { WebBankingSettingsFragment } from "../graphql/partner";

const PERMISSIONS_MATRIX = {
  cancelCard: {
    settings: {
      canUpdateCards: true,
    },
  },
  updateCard: {
    settings: {
      canUpdateCards: true,
    },
  },
} satisfies Record<
  string,
  Pattern.Pattern<{
    settings: WebBankingSettingsFragment;
  }>
>;

export const isMutationRestrictedByWebBankingSettings = (
  mutationName: string,
): mutationName is keyof typeof PERMISSIONS_MATRIX => {
  return mutationName in PERMISSIONS_MATRIX;
};

export const isMutationAuthorizedInWebBanking = (
  mutationName: keyof typeof PERMISSIONS_MATRIX,
  webBankingSettings: WebBankingSettingsFragment,
) => {
  const pattern = PERMISSIONS_MATRIX[mutationName];
  return isMatching(pattern, { settings: webBankingSettings });
};
