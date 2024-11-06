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
  readAccountDetails: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountDetails: true,
    },
  },
  readTransaction: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  readAccountStatement: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountStatement: true,
    },
  },
  generateAccountStatement: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewAccountStatement: true,
    },
  },
  readVirtualIBAN: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canManageVirtualIbans: true,
    },
  },
  createVirtualIBAN: {
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
  cancelVirtualIBAN: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canManageVirtualIbans: true,
    },
  },
  updateAccount: {
    accountMembership: {
      canViewAccount: true,
      legalRepresentative: true,
      statusInfo: { status: ENABLED },
    },
  },
  readStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  createStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  cancelStandingOrder: {
    accountMembership: {
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  readCreditTransfer: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewPaymentList: true,
    },
  },
  initiateCreditTransfer: P.union(
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
  initiateCreditTransferToExistingBeneficiary: {
    accountMembership: {
      // `canViewAccount` is required since trusted beneficiaries
      canViewAccount: true,
      canInitiatePayments: true,
      statusInfo: { status: ENABLED },
    },
  },
  initiateCreditTransferToNewBeneficiary: {
    accountMembership: {
      canInitiatePayments: true,
      canManageBeneficiaries: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canInitiatePaymentsToNewBeneficiaries: true,
    },
  },
  readTrustedBeneficiary: {
    accountMembership: {
      canViewAccount: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
  },
  createTrustedBeneficiary: {
    accountMembership: {
      canManageBeneficiaries: true,
      statusInfo: { status: ENABLED },
    },
  },
  readCard: P.union(
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
  readOtherMembersCards: {
    accountMembership: {
      canManageAccountMembership: true,
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
  },
  addCard: {
    accountMembership: {
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canOrderVirtualCards: true,
    },
  },
  addCardForOtherMemberships: {
    accountMembership: {
      canManageCards: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canOrderVirtualCards: true,
    },
  },
  printPhysicalCard: {
    accountMembership: {
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canOrderPhysicalCards: true,
    },
  },
  updateCard: {
    accountMembership: {
      canManageCards: true,
      statusInfo: { status: ENABLED },
    },
  },
  cancelCardForOtherMembership: {
    accountMembership: {
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
  },
  readAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED_OR_BINDING_USER_ERROR },
    },
    settings: {
      canViewMembers: true,
    },
  },
  addAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
    settings: {
      canAddNewMembers: true,
    },
  },
  updateAccountMembership: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
      statusInfo: { status: ENABLED },
    },
  },
  readMerchantProfile: P.union(
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
  createMerchantProfile: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canCreateMerchantProfile: true,
    },
  },
  requestMerchantOnlineCardsPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestOnlineCardsPaymentMethod: true,
    },
  },
  requestMerchantSepaDirectDebitCorePaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestSepaDirectDebitCorePaymentMethod: true,
    },
  },
  requestMerchantSepaDirectDebitB2BPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestSepaDirectDebitB2BPaymentMethod: true,
    },
  },
  requestMerchantInternalDirectDebitCorePaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestInternalDirectDebitCorePaymentMethod: true,
    },
  },
  requestMerchantInternalDirectDebitB2BPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestInternalDirectDebitB2BPaymentMethod: true,
    },
  },
  requestMerchantChecksPaymentMethod: {
    accountMembership: {
      canViewAccount: true,
      canManageAccountMembership: true,
    },
    settings: {
      canRequestChecksPaymentMethod: true,
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

export const usePermission = <Key extends PermissionMatrixKey>(key: Key): boolean => {
  const permissions = useContext(PermissionContext);
  return permissions[key];
};

export const usePermissionMatrix = () => {
  return useContext(PermissionContext);
};
