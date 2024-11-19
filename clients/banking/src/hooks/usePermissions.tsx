import { Dict, Option } from "@swan-io/boxed";
import { createContext, ReactNode, useContext } from "react";
import { isMatching, P, Pattern } from "ts-pattern";
import {
  AccountMembershipPermissionsFragment,
  WebBankingSettingsFragment,
} from "../graphql/partner";

const ENABLED_OR_BINDING_USER_ERROR = P.union("BindingUserError", "Enabled");
const ENABLED = "Enabled";

const PERMISSIONS_MATRIX = {
  canReadAccountDetails: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountDetails: true,
    },
  },
  canReadTransaction: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  canReadAccountStatement: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountStatement: true,
    },
  },
  canGenerateAccountStatement: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountStatement: true,
    },
  },
  canReadVirtualIBAN: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canManageVirtualIbans: true,
    },
  },
  canCreateVirtualIBAN: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED },
      account: {
        paymentLevel: "Unlimited",
      },
    },
    settings: {
      canManageVirtualIbans: true,
    },
  },
  canCancelVirtualIBAN: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canManageVirtualIbans: true,
    },
  },
  canUpdateAccount: {
    accountMembership: {
      canViewAccount: true,
      legalRepresentative: true,
      statusInfo: { status: ENABLED },
    },
  },
  canReadStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  canCreateStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  canCancelStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  canReadCreditTransfer: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewPaymentList: true,
    },
  },
  canInitiateCreditTransfer: P.union(
    {
      accountMembership: {
        // `canViewAccount` is required since trusted beneficiaries
        canViewAccount: true,
        canInitiatePayments: true,
        statusInfo: { status: ENABLED },
      },
    },
    {
      accountMembership: {
        canInitiatePayments: true,
        canManageBeneficiaries: true,
        statusInfo: { status: ENABLED },
      },
      settings: {
        canInitiatePaymentsToNewBeneficiaries: true,
      },
    },
  ),
  canInitiateCreditTransferToExistingBeneficiary: {
    accountMembership: {
      // `canViewAccount` is required since trusted beneficiaries
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  canInitiateCreditTransferToNewBeneficiary: {
    accountMembership: {
      canInitiatePayments: true,
      canManageBeneficiaries: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canInitiatePaymentsToNewBeneficiaries: true,
    },
  },
  canReadTrustedBeneficiary: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  canCreateTrustedBeneficiary: {
    accountMembership: {
      canManageBeneficiaries: true,
      statusInfo: { status: ENABLED },
    },
  },
  canReadCard: P.union(
    // User can read card list if they have at least one
    {
      accountMembership: {
        allCards: { totalCount: P.number.gt(0) },
        statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
      },
    },
    // or can manage their own cards if order is available
    {
      accountMembership: {
        canManageCards: true,
        statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
      },
      settings: {
        canOrderVirtualCards: true,
      },
    },
    // or can manage cards for others
    {
      accountMembership: {
        canManageAccountMembership: true,
        canManageCards: true,
      },
    },
  ),
  canReadOtherMembersCards: {
    accountMembership: {
      canManageAccountMembership: true,
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
  },
  canAddCard: {
    accountMembership: {
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canOrderVirtualCards: true,
    },
  },
  canAddCardForOtherMemberships: {
    accountMembership: {
      canManageCards: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canOrderVirtualCards: true,
    },
  },
  canPrintPhysicalCard: {
    accountMembership: {
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canOrderPhysicalCards: true,
    },
  },
  canUpdateCard: {
    accountMembership: {
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
  },
  canCancelCardForOtherMembership: {
    accountMembership: {
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
  },
  canReadAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewMembers: true,
    },
  },
  canAddAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canAddNewMembers: true,
    },
  },
  canUpdateAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
  },
  canReadMerchantProfile: P.union(
    // either you already have one
    {
      accountMembership: {
        canViewAccount: true,
        canManageAccountMembership: true,
        account: { merchantProfiles: { totalCount: P.number.gt(0) } },
      },
    },
    // or the right to create one
    {
      accountMembership: {
        canViewAccount: true,
        canManageAccountMembership: true,
      },
      settings: {
        canCreateMerchantProfile: true,
      },
    },
  ),
  canCreateMerchantProfile: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canCreateMerchantProfile: true,
    },
  },
  canRequestMerchantOnlineCardsPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestOnlineCardsPaymentMethod: true,
    },
  },
  canRequestMerchantSepaDirectDebitCorePaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestSepaDirectDebitCorePaymentMethod: true,
    },
  },
  canRequestMerchantSepaDirectDebitB2BPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestSepaDirectDebitB2BPaymentMethod: true,
    },
  },
  canRequestMerchantInternalDirectDebitCorePaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestInternalDirectDebitCorePaymentMethod: true,
    },
  },
  canRequestMerchantInternalDirectDebitB2BPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestInternalDirectDebitB2BPaymentMethod: true,
    },
  },
  canRequestMerchantChecksPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestChecksPaymentMethod: true,
    },
  },
  canDeclareChecks: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canInitiateCheckMerchantPayments: true,
    },
  },
  canCreateMerchantPaymentLinks: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canCreateMerchantPaymentLinks: true,
    },
  },
} satisfies Record<
  string,
  Pattern.Pattern<{
    accountMembership: AccountMembershipPermissionsFragment;
    settings: WebBankingSettingsFragment | null | undefined;
  }>
>;

type PermissionMatrixKey = keyof typeof PERMISSIONS_MATRIX;
type PermissionMatrix = { [Key in PermissionMatrixKey]: boolean };

const defaultPermissionsMatrix = Dict.fromEntries(
  Dict.entries(PERMISSIONS_MATRIX).map(([key]) => [key, false]),
) as PermissionMatrix;

export const getPermissionMatrix = (data: {
  accountMembership: AccountMembershipPermissionsFragment;
  settings: WebBankingSettingsFragment | null | undefined;
}) =>
  Dict.fromEntries(
    Dict.entries(PERMISSIONS_MATRIX).map(([key, pattern]) => [key, isMatching(pattern, data)]),
  ) as PermissionMatrix;

type Input = Option<{
  accountMembership: AccountMembershipPermissionsFragment;
  settings: WebBankingSettingsFragment | null | undefined;
}>;

export const PermissionContext = createContext<PermissionMatrix>(defaultPermissionsMatrix);

export const PermissionProvider = ({ value, children }: { value: Input; children: ReactNode }) => {
  return (
    <PermissionContext.Provider
      value={value.map(getPermissionMatrix).getOr(defaultPermissionsMatrix)}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionContext);
};
