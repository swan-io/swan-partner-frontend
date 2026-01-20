import { isMatching, Pattern } from "ts-pattern";
import { WebBankingSettingsFragment } from "../graphql/partner";

const PERMISSIONS_MATRIX = {
  addAccountMembership: {
    settings: {
      canAddNewMembers: true,
    },
  },
  sendAccountMembershipInviteNotification: {
    settings: {
      canAddNewMembers: true,
    },
  },
  updateAccountMembership: {
    settings: {
      canAddNewMembers: true,
    },
  },
  suspendAccountMembership: {
    settings: {
      canAddNewMembers: true,
    },
  },
  resumeAccountMembership: {
    settings: {
      canAddNewMembers: true,
    },
  },
  disableAccountMembership: {
    settings: {
      canAddNewMembers: true,
    },
  },
  addTrustedSepaBeneficiary: {
    settings: {
      canInitiatePaymentsToNewBeneficiaries: true,
    },
  },
  addTrustedInternationalBeneficiary: {
    settings: {
      canInitiatePaymentsToNewBeneficiaries: true,
    },
  },
  addSingleUseVirtualCard: {
    settings: {
      canOrderVirtualCards: true,
    },
  },
  addSingleUseVirtualCards: {
    settings: {
      canOrderVirtualCards: true,
    },
  },
  printPhysicalCard: {
    settings: {
      canOrderPhysicalCards: true,
    },
  },
  confirmPhysicalCardRenewal: {
    settings: {
      canOrderPhysicalCards: true,
    },
  },
  activatePhysicalCard: {
    settings: {
      canOrderPhysicalCards: true,
    },
  },
  cancelDigitalCard: {
    settings: {
      canUpdateCards: true,
    },
  },
  suspendPhysicalCard: {
    settings: {
      canUpdateCards: true,
    },
  },
  resumePhysicalCard: {
    settings: {
      canUpdateCards: true,
    },
  },
  cancelPhysicalCard: {
    settings: {
      canUpdateCards: true,
    },
  },
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
  addCard: {
    settings: {
      canOrderVirtualCards: true,
    },
  },
  addCards: {
    settings: {
      canOrderVirtualCards: true,
    },
  },
  addCardsWithGroupDelivery: {
    settings: {
      canOrderVirtualCards: true,
    },
  },
  requestMerchantProfile: {
    settings: {
      canCreateMerchantProfile: true,
    },
  },
  requestMerchantProfileUpdate: {
    settings: {
      canCreateMerchantProfile: true,
    },
  },
  requestMerchantPaymentMethods: {
    settings: {
      canRequestOnlineCardsPaymentMethod: true,
    },
  },
  createMerchantPaymentLink: {
    settings: {
      canCreateMerchantPaymentLinks: true,
    },
  },
  cancelMerchantPayment: {
    settings: {
      canCreateMerchantPaymentLinks: true,
    },
  },
  initiateCheckMerchantPayment: {
    settings: {
      canInitiateCheckMerchantPayments: true,
    },
  },
  generateAccountStatement: {
    settings: {
      canViewAccountStatement: true,
    },
  },
  generateTransactionStatement: {
    settings: {
      canViewAccountStatement: true,
    },
  },
  generateCreditStatement: {
    settings: {
      canViewAccountStatement: true,
    },
  },
  addVirtualIbanEntry: {
    settings: {
      canManageVirtualIbans: true,
    },
  },
  cancelVirtualIbanEntry: {
    settings: {
      canManageVirtualIbans: true,
    },
  },
  cancelStandingOrder: {
    settings: {
      canViewPaymentList: true,
    },
  },
  updateAccount: {
    settings: {
      canViewAccountDetails: true,
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
