/* eslint-disable */
import { CountryCCA2 } from '@swan-io/shared-business/src/constants/countries';
import { CountryCCA3 } from '@swan-io/shared-business/src/constants/countries';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Swan account number */
  AccountNumber: { input: string; output: string; }
  /**
   * The amount given with fractional digits, where fractions must be compliant to the currency definition. Up to 14 significant figures. Negative amounts are signed by minus. The decimal separator is a dot.
   *
   * Example: Valid representations for EUR with up to two decimals are:
   *
   * 1056
   * 5768.2
   * -1.50
   * 5877.78
   */
  AmountValue: { input: string; output: string; }
  /** Bank Identifier Code */
  BIC: { input: string; output: string; }
  /** Country code alpha 2 (ISO 3166) */
  CCA2: { input: CountryCCA2; output: CountryCCA2; }
  /** Country code alpha 3 (ISO 3166) */
  CCA3: { input: CountryCCA3; output: CountryCCA3; }
  /** currency code alpha 3 (ISO 4217) */
  Currency: { input: string; output: string; }
  /** Date with YYYY-MM-DD format */
  Date: { input: string; output: string; }
  /**
   * Date time (ISO 8601 with time information)
   * ex: 2021-04-12T16:28:22.867Z
   */
  DateTime: { input: string; output: string; }
  EmailAddress: { input: string; output: string; }
  HexColorCode: { input: string; output: string; }
  /** International Bank Account Number */
  IBAN: { input: string; output: string; }
  /** 6 digits numeric passcode */
  PIN: { input: string; output: string; }
  /**
   * E.164 standard format phone number
   *
   * Examples
   * +551155256325
   * +44207183875
   */
  PhoneNumber: { input: string; output: string; }
  /**
   * SEPA Creditor Identifier
   * format :
   *     1 – 2: ISO Country Code
   *     3 – 4: Check Digit
   *     5 – 7: Creditor Business Code – you (Creditor) choose this. The default is ZZZ
   *     8 - 35: Creditor National Identifier – a consecutive number that will be assigned by country
   * example:
   *     FR11ABC123456
   */
  SepaCreditorIdentifier: { input: string; output: string; }
  /**
   * SEPA Identifier
   * max 35 Latin characters as follow :
   *     a b c d e f g h i j k l m n o p q r s t u v w x y z
   *     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
   *     0 1 2 3 4 5 6 7 8 9
   *     / - ? : ( ) . , '  +
   * with some follow extra rules :
   *     Content must not start or end with a ‘/’
   *     Content must not contain ‘//’s
   */
  SepaReference: { input: string; output: string; }
  /**
   * URL that follows the WHATWG URL Standard.
   *
   * [Examples of parsed URLs](https://url.spec.whatwg.org/#example-url-parsing) may be found in the Standard itself.
   */
  URL: { input: string; output: string; }
  Upload: { input: unknown; output: unknown; }
  WalletToken: { input: string; output: string; }
};

/** Whether you call it a wallet, monetary account, payment account or bank account, the notion of account is fundamental at Swan. All payment flows necessarily go through an account. */
export type Account = {
  __typename?: 'Account';
  /**
   * Bank Identifier Code
   * Only if the account membership has `canViewAccount=true` & this account has `paymentLevel=Unlimited`
   */
  BIC: Scalars['BIC']['output'];
  /**
   * International Bank Account Number
   * Only if the account membership has `canViewAccount=true` & this account has `paymentLevel=Unlimited`
   */
  IBAN: Maybe<Scalars['IBAN']['output']>;
  /** Link to the account's bank details */
  bankDetails: Maybe<Scalars['String']['output']>;
  /** `true` if the main IBAN refuses all Sepa Direct Debit received */
  blockSDD: Maybe<Scalars['Boolean']['output']>;
  /** Cash account type */
  cashAccountType: CashAccountType;
  /** Country of the account */
  country: AccountCountry;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Currency */
  currency: Scalars['Currency']['output'];
  /** Account holder */
  holder: AccountHolder;
  /** Unique identifier of an account */
  id: Scalars['ID']['output'];
  /** Language used for account statements */
  language: AccountLanguage;
  /** Legal representative account membership */
  legalRepresentativeMembership: AccountMembership;
  /**
   * List of account membership for this account
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  memberships: AccountMembershipConnection;
  /** Account name */
  name: Scalars['String']['output'];
  /** Unique account number */
  number: Scalars['AccountNumber']['output'];
  /** Partnership status */
  partnershipStatusInfo: Maybe<PartnershipStatusInfo>;
  /** Type of the account : EMoney if account holder has not finished the KYC requirements, PaymentService otherwise */
  paymentAccountType: PaymentAccountType;
  /** Payment level */
  paymentLevel: PaymentLevel;
  /** `true`if a consent is required to fetch new transactions */
  requiredConsentToFetchNewTransactions: Scalars['Boolean']['output'];
  /** Status of the account */
  statusInfo: AccountStatusInfo;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** Date of the account going from eMoney to PaymentService */
  upgradedAt: Maybe<Scalars['DateTime']['output']>;
  /**
   * List of Virtual IBAN
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  virtualIbanEntries: VirtualIbanEntryConnection;
};


/** Whether you call it a wallet, monetary account, payment account or bank account, the notion of account is fundamental at Swan. All payment flows necessarily go through an account. */
export type AccountMembershipsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<MembershipsFilterInput>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<AccountMembershipOrderByInput>;
};


/** Whether you call it a wallet, monetary account, payment account or bank account, the notion of account is fundamental at Swan. All payment flows necessarily go through an account. */
export type AccountVirtualIbanEntriesArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
};

/** Account and Requested Card, it the return type of accountByCardToken & accountByCardId; */
export type AccountAndCard = {
  __typename?: 'AccountAndCard';
  /** Account */
  account: Account;
  /** Requested Card */
  cardRequested: Card;
};

/** Account Closed status information */
export type AccountClosedStatus = AccountStatusInfo & {
  __typename?: 'AccountClosedStatus';
  closedAt: Scalars['DateTime']['output'];
  closingAt: Scalars['DateTime']['output'];
  /**
   * Reason why the account is suspended
   * @deprecated Use `reasonInfo` instead.
   */
  reason: Scalars['String']['output'];
  /** Reason why the account is currently closed */
  reasonInfo: CloseAccountStatusReason;
  /** Account status (always Closed for type AccountClosedStatus) */
  status: AccountStatus;
};

/** Account Closing status information */
export type AccountClosingStatus = AccountStatusInfo & {
  __typename?: 'AccountClosingStatus';
  closingAt: Scalars['DateTime']['output'];
  /**
   * Reason why the account is suspended
   * @deprecated Use `reasonInfo` instead.
   */
  reason: Scalars['String']['output'];
  /** Reason why the account is currently in closing */
  reasonInfo: CloseAccountStatusReason;
  /** Account status (always Closing for type AccountClosingStatus) */
  status: AccountStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type AccountConnection = Connection & {
  __typename?: 'AccountConnection';
  /** AccountEdge list */
  edges: Array<AccountEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/**
 * Refers to the country of the account. It will determine the country code of the local IBAN of the account.
 *
 * Available Account Country: CCA3
 */
export type AccountCountry =
  /** German account with a German IBAN, starting with DE. */
  | 'DEU'
  /** Spanish account with a Spanish IBAN, starting with ES. */
  | 'ESP'
  /** French account with a French IBAN, starting with FR. */
  | 'FRA'
  /** Italian account with an Italian IBAN, starting with IT (Coming Soon, not supported yet). */
  | 'ITA'
  /** Dutch account with a Dutch IBAN, starting with DU. */
  | 'NLD';

/** Implements the Relay Edge interface */
export type AccountEdge = Edge & {
  __typename?: 'AccountEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The account */
  node: Account;
};

/** The account holder is the person who owns the money stored in the account. The account holder can be one of your customers, whether it is a natural person or a legal person, or quite simply you. */
export type AccountHolder = {
  __typename?: 'AccountHolder';
  /**
   * List of accounts owned by the account holder.
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  accounts: AccountConnection;
  /** Created date. */
  createdDate: Scalars['DateTime']['output'];
  /**
   * List of funding limit settings change request for an account holder
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  fundingLimitSettingsChangeRequests: FundingLimitSettingsChangeRequestConnection;
  /** Unique identifier of the account holder. */
  id: Scalars['ID']['output'];
  /** Account holder type information. */
  info: AccountHolderInfo;
  /** Account holder onboarding */
  onboarding: Maybe<Onboarding>;
  /** Residency address. */
  residencyAddress: AddressInfo;
  /** Account holder status information. */
  statusInfo: Maybe<AccountHolderStatusInfo>;
  /**
   * List of supporting document collection for an account holder
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  supportingDocumentCollections: SupportingDocumentCollectionConnection;
  /** Updated date. */
  updatedDate: Scalars['DateTime']['output'];
  /**
   * Verification status.
   * *Banking regulations require financial institutions such as Swan to know and verify their customers in order to comply with their anti-money laundering and terrorist financing obligations. In banking jargon, we talk about KYC (Know Your Customers) procedure*
   */
  verificationStatus: VerificationStatus;
  /** Account holder verification Status information. */
  verificationStatusInfo: AccountHolderVerificationStatusInfo;
};


/** The account holder is the person who owns the money stored in the account. The account holder can be one of your customers, whether it is a natural person or a legal person, or quite simply you. */
export type AccountHolderAccountsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<AccountOrderByInput>;
};


/** The account holder is the person who owns the money stored in the account. The account holder can be one of your customers, whether it is a natural person or a legal person, or quite simply you. */
export type AccountHolderFundingLimitSettingsChangeRequestsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
};


/** The account holder is the person who owns the money stored in the account. The account holder can be one of your customers, whether it is a natural person or a legal person, or quite simply you. */
export type AccountHolderSupportingDocumentCollectionsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<SupportingDocumentCollectionFilterInput>;
  first?: Scalars['Int']['input'];
};

/** Account Holder Canceled Status Information */
export type AccountHolderCanceledStatusInfo = AccountHolderStatusInfo & {
  __typename?: 'AccountHolderCanceledStatusInfo';
  /** Reason why the account holder is suspended. */
  reason: Scalars['String']['output'];
  /** Status of the account holder. */
  status: AccountHolderStatus;
};

export type AccountHolderCompanyInfo = AccountHolderInfo & {
  __typename?: 'AccountHolderCompanyInfo';
  /** Business activity. */
  businessActivity: BusinessActivity;
  /**
   * Business activity description.
   * This must be 1024 characters long maximum.
   */
  businessActivityDescription: Scalars['String']['output'];
  /** Registration date of the company. */
  companyRegistrationDate: Maybe<Scalars['Date']['output']>;
  /** Legal form of the company (SAS, SCI, SASU, ...). */
  companyType: Maybe<CompanyType>;
  /**
   * The ultimate beneficiary is defined as the natural person (s) who own or control, directly or indirectly, the reporting company.
   *
   * The ultimate beneficiary is :
   * - either the natural person (s) who hold, directly or indirectly, more than 25% of the capital or the rights of vote of the reporting company;
   * - either the natural person (s) who exercise, by other means, a power of control of the company;
   */
  individualUltimateBeneficialOwners: Array<IndividualUltimateBeneficialOwner>;
  /** Legal representative personal address */
  legalRepresentativePersonalAddress: Maybe<AddressInformation>;
  /** Estimated monthly payment volume (euro). */
  monthlyPaymentVolume: MonthlyPaymentVolume;
  /** Name of the company. */
  name: Scalars['String']['output'];
  /**
   * Registration number of the company (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber: Maybe<Scalars['String']['output']>;
  /** Tax Identification Number */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Account holder type (always Company for type AccountHolderCompanyInfo) */
  type: AccountHolderType;
  /** Unique number that identifies a taxable person (business) or non-taxable legal entity that is registered for VAT */
  vatNumber: Maybe<Scalars['String']['output']>;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)). */
export type AccountHolderConnection = Connection & {
  __typename?: 'AccountHolderConnection';
  /** AccountHolderEdge list */
  edges: Array<AccountHolderEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface. */
export type AccountHolderEdge = Edge & {
  __typename?: 'AccountHolderEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The account holder */
  node: AccountHolder;
};

/** Account Holder Enabled Status Information */
export type AccountHolderEnabledStatusInfo = AccountHolderStatusInfo & {
  __typename?: 'AccountHolderEnabledStatusInfo';
  /** Status of the account holder. */
  status: AccountHolderStatus;
};

/** Filters that can be applied when listing account holders */
export type AccountHolderFilterInput = {
  /** Filter by birth date */
  birthDate?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by first name
   *
   * @deprecated(reason: "use `search` instead")
   */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by last name
   *
   * @deprecated(reason: "use `search` instead")
   */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Filter by registration number of the company
   * (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   *
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search string to look for
   *
   * Search will be performed in following fields:
   *  - First name
   *  - Last name
   *  - Company name
   *  - ID
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by status */
  status?: InputMaybe<Array<AccountHolderStatus>>;
  /** Filter by type */
  types?: InputMaybe<Array<AccountHolderType>>;
  /** Filter by verification status */
  verificationStatus?: InputMaybe<Array<VerificationStatus>>;
};

/** Individual account holder. */
export type AccountHolderIndividualInfo = AccountHolderInfo & {
  __typename?: 'AccountHolderIndividualInfo';
  /** Employment status of the account holder (regulatory questions). */
  employmentStatus: EmploymentStatus;
  /** Monthly income of the account holder (regulatory questions). */
  monthlyIncome: MonthlyIncome;
  /** Account Holder's first name and last name. */
  name: Scalars['String']['output'];
  /** Tax Identification Number */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Account holder type (always Individual for type AccountHolderIndividualInfo). */
  type: AccountHolderType;
  /** User of the individual account holder. */
  user: User;
};

/** Account holder types. */
export type AccountHolderInfo = {
  /** Account holder name */
  name: Scalars['String']['output'];
  /** Account holder type */
  type: AccountHolderType;
};

/** Rejection returned when the Account Holder was not found */
export type AccountHolderNotFoundRejection = Rejection & {
  __typename?: 'AccountHolderNotFoundRejection';
  message: Scalars['String']['output'];
};

export type AccountHolderNotStartedVerificationStatusInfo = AccountHolderVerificationStatusInfo & {
  __typename?: 'AccountHolderNotStartedVerificationStatusInfo';
  /** Verification Status of the account holder. */
  status: VerificationStatus;
};

/** Field we can use when ordering that can be applied when listing account holders */
export type AccountHolderOrderByFieldInput =
  | 'createdAt'
  | 'updatedAt';

/** Order that can be applied when listing account holders */
export type AccountHolderOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<AccountHolderOrderByFieldInput>;
};

export type AccountHolderPendingVerificationStatusInfo = AccountHolderVerificationStatusInfo & {
  __typename?: 'AccountHolderPendingVerificationStatusInfo';
  /** ISO Date string at which the account holder status was set to Pending */
  pendingAt: Scalars['DateTime']['output'];
  /** Verification Status of the account holder. */
  status: VerificationStatus;
};

export type AccountHolderRefusedVerificationStatusInfo = AccountHolderVerificationStatusInfo & {
  __typename?: 'AccountHolderRefusedVerificationStatusInfo';
  /** Reason for which the account holder was refused */
  reason: Scalars['String']['output'];
  /** ISO Date string at which the account holder status was set to Refused */
  refusedAt: Scalars['DateTime']['output'];
  /** Verification Status of the account holder. */
  status: VerificationStatus;
};

/** Account holder status. */
export type AccountHolderStatus =
  /** When the account holder is canceled. */
  | 'Canceled'
  /** When the account holder is enabled. */
  | 'Enabled'
  /** When the account holder is suspended. */
  | 'Suspended';

/** Account Holder Status Information */
export type AccountHolderStatusInfo = {
  /** Status of the account holder. */
  status: AccountHolderStatus;
};

/** Account Holder Suspended Status Information */
export type AccountHolderSuspendedStatusInfo = AccountHolderStatusInfo & {
  __typename?: 'AccountHolderSuspendedStatusInfo';
  /** Reason why the account holder is suspended. */
  reason: Scalars['String']['output'];
  /** Status of the account holder. */
  status: AccountHolderStatus;
};

/** Account holder type */
export type AccountHolderType =
  /** Company (Legal person) */
  | 'Company'
  /** Individual (Natural person) */
  | 'Individual';

/** Account Holder Verification Status Information */
export type AccountHolderVerificationStatusInfo = {
  /** Verification Status of the account holder. */
  status: VerificationStatus;
};

export type AccountHolderVerifiedVerificationStatusInfo = AccountHolderVerificationStatusInfo & {
  __typename?: 'AccountHolderVerifiedVerificationStatusInfo';
  /** Verification Status of the account holder. */
  status: VerificationStatus;
  /** ISO Date string at which the account holder status was set to Verified */
  verifiedAt: Scalars['DateTime']['output'];
};

export type AccountHolderWaitingForInformationVerificationStatusInfo = AccountHolderVerificationStatusInfo & {
  __typename?: 'AccountHolderWaitingForInformationVerificationStatusInfo';
  /**
   * @deprecated(reason: "Use `waitingForInformationAt` instead")
   * @deprecated Field no longer supported
   */
  WaitingForInformationAt: Scalars['DateTime']['output'];
  /** Verification Status of the account holder. */
  status: VerificationStatus;
  verificationRequirements: Array<VerificationRequirement>;
  /** ISO Date string at which the account holder status was set to WaitingForInformation */
  waitingForInformationAt: Scalars['DateTime']['output'];
};

/** Language: ISO 639-1 language code */
export type AccountLanguage =
  | 'de'
  | 'en'
  | 'es'
  | 'fi'
  | 'fr'
  | 'it'
  | 'nl'
  | 'pt';

/**
 * An account membership represents the rights of a user for a given account.
 *
 * *Each account is administered by an account membership having the capacity of legal representative. He has the possibility of delegating rights on this account to other users.*
 */
export type AccountMembership = {
  __typename?: 'AccountMembership';
  /** List of accepted identification level */
  acceptedIdentificationLevels: Array<Maybe<IdentificationLevel>>;
  /** account of the account membership */
  account: Maybe<Account>;
  /** Unique identifier of the account of the account membership */
  accountId: Scalars['ID']['output'];
  /** `true` if this account membership can initiate credit transfers */
  canInitiatePayments: Scalars['Boolean']['output'];
  /** `true` if this account membership can invite, update, suspend or resume memberships */
  canManageAccountMembership: Scalars['Boolean']['output'];
  /** `true` if this account membership can add or canceled beneficiaries */
  canManageBeneficiaries: Scalars['Boolean']['output'];
  /** `true` if this account membership can manage cards for himself or to the memberships he manages */
  canManageCards: Scalars['Boolean']['output'];
  /** `true` if this account membership can view account balances and transactions history */
  canViewAccount: Scalars['Boolean']['output'];
  /** account membership's cards */
  cards: CardConnection;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Disabled date */
  disabledAt: Maybe<Scalars['DateTime']['output']>;
  /** email */
  email: Scalars['String']['output'];
  /** Indicate if the identity bound to the account membership has required identification level */
  hasRequiredIdentificationLevel: Maybe<Scalars['Boolean']['output']>;
  /** Unique identifier of an account membership */
  id: Scalars['ID']['output'];
  /** Language of the account membership */
  language: Maybe<AccountLanguage>;
  /** `true` if this account membership having the capacity of the legal representative of the account holder. */
  legalRepresentative: Scalars['Boolean']['output'];
  /** Recommended identification level */
  recommendedIdentificationLevel: IdentificationLevel;
  /** Residency address of the member */
  residencyAddress: Maybe<AddressInfo>;
  /** Periodic Spending limit list */
  spendingLimits: Maybe<Array<SpendingLimit>>;
  /** status of the account membership */
  statusInfo: AccountMembershipStatusInfo;
  /** Tax Identification Number of the member */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** user of this account membership */
  user: Maybe<User>;
  /** version of the account membership started from '1' and incremented at every updates */
  version: Scalars['String']['output'];
};


/**
 * An account membership represents the rights of a user for a given account.
 *
 * *Each account is administered by an account membership having the capacity of legal representative. He has the possibility of delegating rights on this account to other users.*
 */
export type AccountMembershipCardsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<CardFiltersInput>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<CardOrderByInput>;
};

/** when a user is bound with the error to the account membership */
export type AccountMembershipBindingUserErrorStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipBindingUserErrorStatusInfo';
  /** `true` if the birth date of the bound user doesn't match with the invitation */
  birthDateMatchError: Scalars['Boolean']['output'];
  /** `true` if the email of the bound user doesn't match with the invitation */
  emailVerifiedMatchError: Scalars['Boolean']['output'];
  /** `true` if the first name of the bound user doesn't match with the invitation */
  firstNameMatchError: Scalars['Boolean']['output'];
  /** `true` if Swan hasn't verified the user's identity */
  idVerifiedMatchError: Scalars['Boolean']['output'];
  /** `true` if the last name of the bound user doesn't match with the invitation */
  lastNameMatchError: Scalars['Boolean']['output'];
  /** `true` if the phone number of the bound user doesn't match with the invitation */
  phoneNumberMatchError: Scalars['Boolean']['output'];
  /** restricted to a user */
  restrictedTo: RestrictedTo;
  /** AccountMembership status (always BindingUserError for type AccountMembershipBindingUserErrorStatusInfo) */
  status: AccountMembershipStatus;
};

export type AccountMembershipCannotBeDisabledRejection = Rejection & {
  __typename?: 'AccountMembershipCannotBeDisabledRejection';
  accountMembershipId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type AccountMembershipCannotBeUpdatedRejection = Rejection & {
  __typename?: 'AccountMembershipCannotBeUpdatedRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type AccountMembershipConnection = Connection & {
  __typename?: 'AccountMembershipConnection';
  /** AccountMembershipEdge list */
  edges: Array<AccountMembershipEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** when the user has to consent to invite a new account membership */
export type AccountMembershipConsentPendingStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipConsentPendingStatusInfo';
  /** The consent required to invite this account membership */
  consent: Consent;
  /** restricted to a user */
  restrictedTo: RestrictedTo;
  /** AccountMembership status (always ConsentPending for type AccountMembershipConsentPendingStatusInfo) */
  status: AccountMembershipStatus;
};

/** when the account membership is disabled */
export type AccountMembershipDisabledStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipDisabledStatusInfo';
  /** reason why the account membership is disabled */
  reason: Scalars['String']['output'];
  /** AccountMembership status (always Disabled for type AccountMembershipDisabledStatusInfo) */
  status: AccountMembershipStatus;
};

/** Implements the Relay Edge interface */
export type AccountMembershipEdge = Edge & {
  __typename?: 'AccountMembershipEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The account membership */
  node: AccountMembership;
};

/** when the account membership is enabled */
export type AccountMembershipEnabledStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipEnabledStatusInfo';
  /** AccountMembership status (always Enabled for type AccountMembershipEnabledStatusInfo) */
  status: AccountMembershipStatus;
};

/** when a new account membership is invited and there is no user bound yet */
export type AccountMembershipInvitationSentStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipInvitationSentStatusInfo';
  /** restricted to a user */
  restrictedTo: RestrictedTo;
  /** AccountMembership status (always InvitationSent for type AccountMembershipInvitationSentStatusInfo) */
  status: AccountMembershipStatus;
};

/** Rejection returned when the Account Membership is not allowed to use an operation. */
export type AccountMembershipNotAllowedRejection = Rejection & {
  __typename?: 'AccountMembershipNotAllowedRejection';
  message: Scalars['String']['output'];
};

export type AccountMembershipNotFoundRejection = Rejection & {
  __typename?: 'AccountMembershipNotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Rejection returned if invitation has not been sent to user yet */
export type AccountMembershipNotReadyToBeBoundRejection = Rejection & {
  __typename?: 'AccountMembershipNotReadyToBeBoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type AccountMembershipNotReadyToBeUpdatedRejection = {
  __typename?: 'AccountMembershipNotReadyToBeUpdatedRejection';
  message: Scalars['String']['output'];
};

/** Field we can use when ordering that can be applied when listing account memberships */
export type AccountMembershipOrderByFieldInput =
  | 'createdAt'
  | 'updatedAt';

/** Order that can be applied when listing account memberships */
export type AccountMembershipOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<AccountMembershipOrderByFieldInput>;
};

/** AccountMembership enabled */
export type AccountMembershipStatus =
  /** when the user bound with errors to the account membership */
  | 'BindingUserError'
  /** when the consent to invite the account membership is pending */
  | 'ConsentPending'
  /** when the account membership is disabled */
  | 'Disabled'
  /** when the account membership is enabled */
  | 'Enabled'
  /** when the account membership is invited */
  | 'InvitationSent'
  /** when the account membership is suspended */
  | 'Suspended';

/** here are the different account membership status: */
export type AccountMembershipStatusInfo = {
  /** AccountMembership status */
  status: AccountMembershipStatus;
};

/** when the account membership is suspended */
export type AccountMembershipSuspendedStatusInfo = AccountMembershipStatusInfo & {
  __typename?: 'AccountMembershipSuspendedStatusInfo';
  /** reason why the account membership is suspended */
  reason: Scalars['String']['output'];
  /** AccountMembership status (always Suspended for type AccountMembershipSuspendedStatusInfo) */
  status: AccountMembershipStatus;
};

/** Filters that can be applied when listing account memberships */
export type AccountMembershipsFilterInput = {
  /** Filter by account */
  accountId?: InputMaybe<Scalars['String']['input']>;
  /** Can the user initiate payments on this account */
  canInitiatePayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user manage account membership */
  canManageAccountMembership?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user manage beneficiaries */
  canManageBeneficiaries?: InputMaybe<Scalars['Boolean']['input']>;
  /** `true` if this account membership can manage cards for himself or to the memberships he manages */
  canManageCards?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user view account */
  canViewAccount?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Search by email
   *
   * @deprecated(reason: "use `search` instead")
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by first name
   *
   * @deprecated(reason: "use `search` instead")
   */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by last name
   *
   * @deprecated(reason: "use `search` instead")
   */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search string to look for
   *
   * Search will be performed in following fields:
   *  - First name
   *  - Last name
   *  - Email
   *  - ID
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Account memberships status/statuses we're looking for */
  status?: InputMaybe<Array<AccountMembershipStatus>>;
};

/** Rejection returned if the account was not found or if the user does not have the rights to know that the card exists */
export type AccountNotFoundRejection = Rejection & {
  __typename?: 'AccountNotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Account Opened status information */
export type AccountOpenedStatus = AccountStatusInfo & {
  __typename?: 'AccountOpenedStatus';
  /** Account status (always Opened for type AccountOpenedStatus) */
  status: AccountStatus;
};

/** Fields that can be used when ordering accounts */
export type AccountOrderByFieldInput =
  | 'createdAt'
  | 'updatedAt';

/** Order that can be applied when listing accounts */
export type AccountOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<AccountOrderByFieldInput>;
};

export type AccountStatus =
  /** When the account is closed */
  | 'Closed'
  /** When the account is currently closing */
  | 'Closing'
  /** When the account is opened */
  | 'Opened'
  /** When the account is suspended */
  | 'Suspended';

export type AccountStatusInfo = {
  /** Account status */
  status: AccountStatus;
};

/** Account Suspended status information */
export type AccountSuspendedStatus = AccountStatusInfo & {
  __typename?: 'AccountSuspendedStatus';
  /**
   * Reason why the account is suspended
   * @deprecated Use `reasonInfo` instead.
   */
  reason: Scalars['String']['output'];
  /** Reason why the account is currently suspend */
  reasonInfo: SuspendAccountStatusReason;
  /** Account status (always Suspended for type AccountSuspendedStatus) */
  status: AccountStatus;
};

export type ActionNotAllowedRejection = Rejection & {
  __typename?: 'ActionNotAllowedRejection';
  message: Scalars['String']['output'];
};

export type ActiveMerchantPaymentLinkStatusInfo = MerchantPaymentLinkStatusInfo & {
  __typename?: 'ActiveMerchantPaymentLinkStatusInfo';
  /**
   * The date when the payment link expires.
   * By default the payment link expires 120 days after it was created.
   */
  expiresAt: Scalars['DateTime']['output'];
  status: MerchantPaymentLinkStatus;
};

export type AddCardPaymentMandateInput = {
  /** Payment Link related to the Card Payment Mandate */
  paymentLinkId: Scalars['ID']['input'];
  /** Payment Method ID generated by Swan */
  paymentMethodId: Scalars['ID']['input'];
  /** Determines whether the payment mandate is a one-off or recurrent */
  sequence: PaymentMandateSequence;
  /** ??? */
  token: Scalars['String']['input'];
};

/** Union type return by the addCardPaymentMandate mutation */
export type AddCardPaymentMandatePayload = AddCardPaymentMandateSuccessPayload | AlreadyCompletedPaymentLinkRejection | ExpiredPaymentLinkRejection | InternalErrorRejection | MerchantProfileWrongStatusRejection | NotFoundRejection | PaymentMandateReferenceAlreadyUsedRejection | PaymentMethodNotCompatibleRejection;

/** Return type in case of a successful response of the initiateMerchantSddPaymentCollectionFromPaymentLink mutation */
export type AddCardPaymentMandateSuccessPayload = {
  __typename?: 'AddCardPaymentMandateSuccessPayload';
  paymentMandate: CardPaymentMandate;
};

export type AddSepaDirectDebitPaymentMandateFromPaymentLinkInput = {
  /** Debtor of the SEPA Direct Debit Payment Mandate */
  debtor: SepaPaymentMandateDebtorInput;
  /** The browser's language used for the mandate, or English if not available. */
  language?: InputMaybe<Language>;
  /** Payment Link related to the SEPA Direct Debit Payment Mandate */
  paymentLinkId: Scalars['ID']['input'];
};

/** Union type return by the addSepaDirectDebitPaymentMandate mutation */
export type AddSepaDirectDebitPaymentMandateFromPaymentLinkPayload = AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload | DebtorAccountClosedRejection | DebtorAccountNotAllowedRejection | ForbiddenRejection | IbanNotReachableRejection | IbanNotValidRejection | InternalErrorRejection | MerchantProfileNotValidRejection | NotFoundRejection | PaymentMandateReferenceAlreadyUsedRejection | PaymentMethodNotCompatibleRejection | SchemeWrongRejection | ValidationRejection;

/** Return type in case of a successful response of the addSepaDirectDebitPaymentMandateFromPaymentLink mutation */
export type AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload = {
  __typename?: 'AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload';
  paymentMandate: SepaPaymentDirectDebitMandate;
};

/** Rejection returned if the attempting to add cards to different accounts. */
export type AddingCardsToDifferentAccountsRejection = Rejection & {
  __typename?: 'AddingCardsToDifferentAccountsRejection';
  message: Scalars['String']['output'];
};

/** Address Information */
export type Address = {
  __typename?: 'Address';
  /** address line 1 */
  addressLine1: Maybe<Scalars['String']['output']>;
  /** addressLine2 */
  addressLine2: Maybe<Scalars['String']['output']>;
  /** city */
  city: Maybe<Scalars['String']['output']>;
  /** country */
  country: Maybe<Scalars['CCA3']['output']>;
  /** postal code (max 10 characters) */
  postalCode: Maybe<Scalars['String']['output']>;
  /** state */
  state: Maybe<Scalars['String']['output']>;
};

/** Address information. */
export type AddressInfo = {
  __typename?: 'AddressInfo';
  /** Address line 1. */
  addressLine1: Maybe<Scalars['String']['output']>;
  /** Address line 2. */
  addressLine2: Maybe<Scalars['String']['output']>;
  /** City. */
  city: Maybe<Scalars['String']['output']>;
  /** Country. */
  country: Maybe<Scalars['CCA3']['output']>;
  /** Postal code. */
  postalCode: Maybe<Scalars['String']['output']>;
  /** State. */
  state: Maybe<Scalars['String']['output']>;
};

/** Address */
export type AddressInformation = {
  __typename?: 'AddressInformation';
  /** Address */
  addressLine1: Scalars['String']['output'];
  /** Address */
  addressLine2: Maybe<Scalars['String']['output']>;
  /** City */
  city: Scalars['String']['output'];
  /** Country */
  country: Scalars['CCA3']['output'];
  /** Postal code */
  postalCode: Scalars['String']['output'];
  /** State */
  state: Maybe<Scalars['String']['output']>;
};

/** Address */
export type AddressInformationInput = {
  /** Address */
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  /** Address */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** City */
  city?: InputMaybe<Scalars['String']['input']>;
  /** Country */
  country: Scalars['CCA3']['input'];
  /** Postal code */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** State */
  state?: InputMaybe<Scalars['String']['input']>;
};

/** Address Information */
export type AddressInput = {
  /** address line 1 (max 100 characters) */
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  /** address line 2 (max 100 characters) */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** city (max 100 characters) */
  city?: InputMaybe<Scalars['String']['input']>;
  /** country code */
  country: Scalars['CCA3']['input'];
  /** postal code (max 10 characters) */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** state (max 100 characters) */
  state?: InputMaybe<Scalars['String']['input']>;
};

export type AlreadyCompletedPaymentLinkRejection = Rejection & {
  __typename?: 'AlreadyCompletedPaymentLinkRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned if card already has a valid Physical Card */
export type AlreadyValidPhysicalCardRejection = Rejection & {
  __typename?: 'AlreadyValidPhysicalCardRejection';
  message: Scalars['String']['output'];
};

/** Amount with its currency */
export type Amount = {
  __typename?: 'Amount';
  /** currency */
  currency: Scalars['Currency']['output'];
  /** value of the amount */
  value: Scalars['AmountValue']['output'];
};

/** Amount with its currency */
export type AmountInput = {
  /** currency */
  currency: Scalars['Currency']['input'];
  /** value of the amount */
  value: Scalars['AmountValue']['input'];
};

/** Rejection return if the project is not configured to allow Apple Pay */
export type ApplePayNotAllowedForProjectRejection = Rejection & {
  __typename?: 'ApplePayNotAllowedForProjectRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Approved Funding Limit */
export type ApprovedFundingLimit = {
  __typename?: 'ApprovedFundingLimit';
  /** Requested amount settings for the funding limit */
  fundingLimit: FundingLimitAmount;
  /** Requested amount settings for the instant funding limit */
  instantFundingLimit: FundingLimitAmount;
};

/** A method used to authenticate a user */
export type Authenticator = {
  __typename?: 'Authenticator';
  /** Accept-Language header used during registration */
  acceptLanguage: Maybe<Scalars['String']['output']>;
  /** Device Brand parsed from the user agent (eg: Acer, Alcatel, Amazon, Apple, ...) */
  brand: Maybe<Scalars['String']['output']>;
  /** Device Model parsed from the user agent */
  model: Maybe<Scalars['String']['output']>;
  /** Operating System parsed from the user agent (eg AIX, Amiga OS, Android, Arch, Bada, BeOS, BlackBerry, ...) */
  os: Maybe<Scalars['String']['output']>;
  /** Type of authenticator */
  type: AuthenticatorType;
  /** Raw user agent */
  userAgent: Maybe<Scalars['String']['output']>;
};

export type AuthenticatorType =
  /** Deprecated: swan authenticator */
  | 'Swan'
  /** A Swan web authenticator */
  | 'SwanWeb';

/** Rejection returned if the status account is not valid */
export type BadAccountStatusRejection = Rejection & {
  __typename?: 'BadAccountStatusRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type BadRequestRejection = Rejection & {
  __typename?: 'BadRequestRejection';
  message: Scalars['String']['output'];
};

/** Basic Physical Card Info */
export type BasicPhysicalCardInfo = {
  __typename?: 'BasicPhysicalCardInfo';
  /** Masked Card Number */
  cardMaskedNumber: Scalars['String']['output'];
  /** Custom Options */
  customOptions: PhysicalCardCustomOptions;
  /** Physical Card expiration date  with MM/YY string format */
  expiryDate: Maybe<Scalars['String']['output']>;
  /** Unique identifier present on physical card */
  identifier: Maybe<Scalars['String']['output']>;
  /** `true` if physical card is expired */
  isExpired: Scalars['Boolean']['output'];
  /** Offline Spending limit defined by Swan */
  offlineSpendingLimit: Amount;
};

/** Business activity. */
export type BusinessActivity =
  | 'AdministrativeServices'
  | 'Agriculture'
  | 'Arts'
  | 'BusinessAndRetail'
  | 'Construction'
  | 'Education'
  | 'ElectricalDistributionAndWaterSupply'
  | 'FinancialAndInsuranceOperations'
  | 'Health'
  | 'Housekeeping'
  | 'InformationAndCommunication'
  | 'LodgingAndFoodServices'
  | 'ManufacturingAndMining'
  | 'Other'
  | 'PublicAdministration'
  | 'RealEstate'
  | 'ScientificActivities'
  | 'Transportation';

/** Rejection returned when the Physical Card cannot be activated */
export type CannotActivatePhysicalCardRejection = Rejection & {
  __typename?: 'CannotActivatePhysicalCardRejection';
  identifier: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Card */
export type Card = {
  __typename?: 'Card';
  /** Account membership to define the cardholder and the account linked to the card. */
  accountMembership: AccountMembership;
  /** Card expiration date  if `null` it does not have an expiration date */
  cardContractExpiryDate: Maybe<Scalars['DateTime']['output']>;
  /** URL of the card design */
  cardDesignUrl: Scalars['String']['output'];
  /** Masked Card Number */
  cardMaskedNumber: Scalars['String']['output'];
  /** Card product */
  cardProduct: CardProduct;
  /** URL of the card with masked card information (like its number) and with full card information if connected user consented beforehand */
  cardUrl: Scalars['String']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /**
   * Digital Cards linked to this card
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  digitalCards: DigitalCardConnection;
  /** `true` if this card allows transactions at eCommerce sites */
  eCommerce: Scalars['Boolean']['output'];
  /** Card expiry date with MM/YY format */
  expiryDate: Maybe<Scalars['String']['output']>;
  /** Unique identifier of a card */
  id: Scalars['ID']['output'];
  /** `true` if this card allows payments outside of the country */
  international: Scalars['Boolean']['output'];
  /** Issuing Country */
  issuingCountry: Scalars['CCA3']['output'];
  /** Main Currency */
  mainCurrency: Scalars['Currency']['output'];
  /** Card name */
  name: Maybe<Scalars['String']['output']>;
  /** `true` if this card allows transactions outside of the card's main currency */
  nonMainCurrencyTransactions: Scalars['Boolean']['output'];
  /** Physical card if the cardholder has ordered one */
  physicalCard: Maybe<PhysicalCard>;
  /** Periodic Spending limit list */
  spendingLimits: Maybe<Array<SpendingLimit>>;
  /** Card status information */
  statusInfo: CardStatusInfo;
  /** Type of a card */
  type: CardType;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** `true` if this card allows cash withdrawals */
  withdrawal: Scalars['Boolean']['output'];
};


/** Card */
export type CardDigitalCardsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<DigitalCardFiltersInput>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<DigitalCardOrderByInput>;
};

/** Rejection returned if the card could not be digitalized */
export type CardCanNotBeDigitalizedRejection = Rejection & {
  __typename?: 'CardCanNotBeDigitalizedRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Card Canceled Status Information */
export type CardCanceledStatusInfo = CardStatusInfo & {
  __typename?: 'CardCanceledStatusInfo';
  /** Reason why the card is canceled */
  reason: Scalars['String']['output'];
  /** Card status (always Canceled for type CardCanceledStatusInfo). */
  status: CardStatus;
};

/** Card Canceling Status Information */
export type CardCancelingStatusInfo = CardStatusInfo & {
  __typename?: 'CardCancelingStatusInfo';
  /** Reason why the card is about to be canceled. */
  reason: Scalars['String']['output'];
  /** Card status (always Canceling for type CardCancelingStatusInfo). */
  status: CardStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type CardConnection = Connection & {
  __typename?: 'CardConnection';
  /** CardEdge list */
  edges: Array<CardEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** when the user has to consent to add this card */
export type CardConsentPendingStatusInfo = CardStatusInfo & {
  __typename?: 'CardConsentPendingStatusInfo';
  /** The consent required to add this card */
  consent: Consent;
  /** Card status (always ConsentPending for type CardConsentPendingStatusInfo) */
  status: CardStatus;
};

export type CardDesignBackground = {
  __typename?: 'CardDesignBackground';
  /** Card design background url */
  cardBackgroundUrl: Scalars['String']['output'];
  /** Card design background text color */
  cardTextColor: Scalars['String']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a project card design background */
  id: Scalars['ID']['output'];
  /** Card design background name */
  name: Scalars['String']['output'];
  /** Card design background type */
  type: Scalars['String']['output'];
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
};

/** Project Card Design Background Type */
export type CardDesignBackgroundType =
  /** when Card design background is black */
  | 'Black'
  /** when Card design background is customized */
  | 'Custom'
  /** when Card design background is light */
  | 'Silver';

/** Card designs Status */
export type CardDesignStatus =
  /** when card design are Disabled */
  | 'Disabled'
  /** when card design are in Draft */
  | 'Draft'
  /** when card design are Enabled */
  | 'Enabled'
  /** when card design are ToReview */
  | 'ToReview';

/** Implements the Relay Edge interface */
export type CardEdge = Edge & {
  __typename?: 'CardEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The Card entry */
  node: Card;
};

/** Card Enabled Status Information */
export type CardEnabledStatusInfo = CardStatusInfo & {
  __typename?: 'CardEnabledStatusInfo';
  /** Card status (always Enabled for type CardEnabledStatusInfo). */
  status: CardStatus;
};

/** Filters that can be applied when listing cards */
export type CardFiltersInput = {
  /**
   * Account identifier
   *
   * This filter is only available for User Access Token, for the moment
   */
  accountId?: InputMaybe<Scalars['String']['input']>;
  /** String searched */
  search?: InputMaybe<Scalars['String']['input']>;
  /**
   * The status of the card.
   *
   * @deprecated(reason: "use `statuses` instead")
   */
  status?: InputMaybe<CardStatus>;
  /** Statuses of the card. */
  statuses?: InputMaybe<Array<CardStatus>>;
  /**
   * Type of card
   *
   * @deprecated(reason: "use `types` instead")
   */
  type?: InputMaybe<CardType>;
  /** Types of card */
  types?: InputMaybe<Array<CardType>>;
};

export type CardFundingType =
  /** Default funding type for cards */
  | 'Debit'
  /** Credit funding type for cards */
  | 'DeferredDebit';

export type CardInfo = {
  __typename?: 'CardInfo';
  cardHolderName: Scalars['String']['output'];
  cvvIframeUrl: Scalars['String']['output'];
  expiryDateIframeUrl: Scalars['String']['output'];
  panIframeUrl: Scalars['String']['output'];
};

export type CardInfoPayload = CardInfo | MaskedCardInfo;

export type CardInfos = {
  __typename?: 'CardInfos';
  /** Card Background Type */
  cardBackgroundType: CardSettingsBackgroundType;
  /** Card Design Url */
  cardDesignUrl: Scalars['String']['output'];
  /** Card Information to display either masked or not. */
  cardInfos: Maybe<CardInfoPayload>;
  /** Card Text Color in hexadecimal */
  cardTextColor: Scalars['String']['output'];
};

export type CardInfosInput = {
  requestId?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
};

/** COMING SOON */
export type CardMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'CardMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Reason of rejection when the status is Rejected */
  rejectReason: Maybe<MerchantPaymentMethodCardRejectReason>;
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** Rejection returned if the card was not found or if the user does not have the rights to know that the account exists */
export type CardNotFoundRejection = Rejection & {
  __typename?: 'CardNotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Field we can use when ordering that can be applied when listing cards */
export type CardOrderByFieldInput =
  | 'createdAt'
  | 'id'
  | 'updatedAt';

/** Order that can be applied when listing cards */
export type CardOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<CardOrderByFieldInput>;
};

export type CardPinInfos = {
  __typename?: 'CardPINInfos';
  consumerId: Scalars['String']['output'];
  controlValue: Scalars['String']['output'];
  costumerRef: Scalars['String']['output'];
  mac: Scalars['String']['output'];
  requestRef: Scalars['String']['output'];
  time: Scalars['Int']['output'];
  urlToCall: Scalars['String']['output'];
};

export type CardPinInfosInput = {
  cardId: Scalars['String']['input'];
  requestId: Scalars['String']['input'];
};

export type CardPaymentMandate = {
  __typename?: 'CardPaymentMandate';
  /** Unique identifier of the Card Payment Mandate */
  id: Scalars['ID']['output'];
};

/** Location where the card should be printed from */
export type CardPrintingHub =
  | 'France'
  | 'Spain';

/** when the card is in the process of being ready to use */
export type CardProcessingStatusInfo = CardStatusInfo & {
  __typename?: 'CardProcessingStatusInfo';
  /** Card status (always Processing for type CardProcessingStatusInfo) */
  status: CardStatus;
};

/** Card Product */
export type CardProduct = {
  __typename?: 'CardProduct';
  applicableToPhysicalCards: Scalars['Boolean']['output'];
  cardDesigns: Array<CardProductDesign>;
  /** Card printing hub */
  cardPrintingHub: Maybe<CardPrintingHub>;
  companySpendingLimit: SpendingLimit;
  createdAt: Scalars['DateTime']['output'];
  defaultCardProduct: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  individualSpendingLimit: SpendingLimit;
  name: Maybe<Scalars['String']['output']>;
  projectId: Scalars['ID']['output'];
  status: CardProductStatus;
  updatedAt: Scalars['DateTime']['output'];
};

/** Card design of a Card Product */
export type CardProductDesign = {
  __typename?: 'CardProductDesign';
  /** Accent color */
  accentColor: Scalars['String']['output'];
  /** Card Background of the Card design */
  cardBackground: CardDesignBackground;
  /** Card Design URL */
  cardDesignUrl: Maybe<Scalars['String']['output']>;
  /** Logo url 300 dpi */
  cardProjectLogo300dpiUrl: Maybe<Scalars['String']['output']>;
  /** Logo url 300 dpi */
  cardProjectLogo600dpiUrl: Maybe<Scalars['String']['output']>;
  /** Logo url svg */
  cardProjectLogoSvgUrl: Maybe<Scalars['String']['output']>;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a card design */
  id: Scalars['ID']['output'];
  /** Status of the card design */
  status: CardDesignStatus;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** Design version */
  version: Scalars['Int']['output'];
  /** Zoom level */
  zoomRatioProjectLogo: Maybe<Scalars['Int']['output']>;
};

/** Rejection returned if the card product is disabled. */
export type CardProductDisabledRejection = Rejection & {
  __typename?: 'CardProductDisabledRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned if the card product is not applicable to physical card. */
export type CardProductNotApplicableToPhysicalCardsRejection = Rejection & {
  __typename?: 'CardProductNotApplicableToPhysicalCardsRejection';
  message: Scalars['String']['output'];
};

export type CardProductNotFoundRejection = Rejection & {
  __typename?: 'CardProductNotFoundRejection';
  message: Scalars['String']['output'];
};

/** Card Product Status */
export type CardProductStatus =
  /** When card product is suspended */
  | 'Disabled'
  /** When card product is Enabled */
  | 'Enabled'
  /** When card product is waiting for review */
  | 'PendingReview'
  /** When card product is suspended */
  | 'Suspended';

/** Rejection returned if the card product is suspended. */
export type CardProductSuspendedRejection = Rejection & {
  __typename?: 'CardProductSuspendedRejection';
  message: Scalars['String']['output'];
};

export type CardProductUsedRejection = Rejection & {
  __typename?: 'CardProductUsedRejection';
  message: Scalars['String']['output'];
};

/** Card settings for a Project */
export type CardSettings = {
  __typename?: 'CardSettings';
  /** Accent color */
  accentColor: Scalars['String']['output'];
  /**
   * Flag used to indicate if ApplePay is activated for the project
   * @deprecated Field no longer supported
   */
  allowsApplePay: Scalars['Boolean']['output'];
  /** Card Background of the Card Settings */
  cardBackground: CardSettingsBackground;
  /** Card Design URL */
  cardDesignUrl: Maybe<Scalars['String']['output']>;
  /** Logo url 300 dpi */
  cardProjectLogo300dpiUrl: Maybe<Scalars['String']['output']>;
  /** Logo url 300 dpi */
  cardProjectLogo600dpiUrl: Maybe<Scalars['String']['output']>;
  /** Logo url svg */
  cardProjectLogoSvgUrl: Maybe<Scalars['String']['output']>;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a project card settings */
  id: Scalars['ID']['output'];
  /** Status of the card settings */
  status: ProjectCardStatus;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** Settings version */
  version: Scalars['Int']['output'];
  /** Zoom level */
  zoomRatioProjectLogo: Maybe<Scalars['Int']['output']>;
};

export type CardSettingsBackground = {
  __typename?: 'CardSettingsBackground';
  /** Card settings background url */
  cardBackgroundUrl: Scalars['String']['output'];
  /** Card settings background text color */
  cardTextColor: Scalars['String']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a project card settings */
  id: Scalars['ID']['output'];
  /** Card settings background name */
  name: Scalars['String']['output'];
  /** Card settings background type */
  type: Scalars['String']['output'];
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
};

/** Card Settings Background Type */
export type CardSettingsBackgroundType =
  /** when Card background is black */
  | 'Black'
  /** when Card background is customized */
  | 'Custom'
  /** when Card background is light */
  | 'Silver';

/** Card Status */
export type CardStatus =
  /** when the card is canceled */
  | 'Canceled'
  /** when the card is about to be canceled */
  | 'Canceling'
  /** when the consent to add this card is pending */
  | 'ConsentPending'
  /** when the card is enabled */
  | 'Enabled'
  /** when the card is in the process of being ready to use */
  | 'Processing';

/** Card Status Information */
export type CardStatusInfo = {
  /** Status of the card. */
  status: CardStatus;
};

/** Card Type */
export type CardType =
  /** When card is Single Use Virtual */
  | 'SingleUseVirtual'
  /** When card is Virtual */
  | 'Virtual'
  /** When card is Virtual and Physical */
  | 'VirtualAndPhysical';

/** Rejection returned when the Card is not the expected status */
export type CardWrongStatusRejection = Rejection & {
  __typename?: 'CardWrongStatusRejection';
  currentStatus: CardStatus;
  expectedStatus: CardStatus;
  identifier: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Cash account type (Always Current) */
export type CashAccountType =
  | 'CashIncome'
  | 'CashPayment'
  | 'CashTrading'
  | 'Charges'
  | 'ClearingParticipantSettlementAccount'
  | 'Commission'
  /** When the account is a current account. */
  | 'Current'
  | 'LimitedLiquiditySavingsAccount'
  | 'Loan'
  | 'MarginalLending'
  | 'MoneyMarket'
  | 'NonResidentExternal'
  | 'OtherAccount'
  | 'OverNightDeposit'
  | 'Overdraft'
  | 'Salary'
  | 'Savings'
  | 'Settlement'
  | 'Tax'
  | 'TransactingAccount';

/** Certificate */
export type Certificate = {
  /**
   * CertificateType
   *
   * Can be either LEAF or INTERMEDIATE
   */
  key: Scalars['String']['input'];
  /** Base64 value of the certificate */
  value: Scalars['String']['input'];
};

/** CheckMerchantPaymentMethod */
export type CheckMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'CheckMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** Define a reason with a message and a specific type for closing account action */
export type CloseAccountReason = Reason & {
  __typename?: 'CloseAccountReason';
  message: Maybe<Scalars['String']['output']>;
  type: CloseAccountReasonType;
};

/** Specific type for closing account action */
export type CloseAccountReasonType =
  /** Capital Deposit Reason */
  | 'CapitalDepositReason'
  /** Compliance Reason */
  | 'ComplianceReason'
  /** Inactivity */
  | 'Inactivity'
  /** Partner Reason */
  | 'PartnerReason';

/** Union between PartnerCloseAccountReasonType and InternalCloseAccountReason */
export type CloseAccountStatusReason = CloseAccountReason;

/** Data provided following the search for company information by siren number */
export type CompanyInfo = {
  __typename?: 'CompanyInfo';
  companyName: Scalars['String']['output'];
  headquarters: Headquarters;
  legalRepresentativePersonalAddress: Maybe<AddressInformation>;
  siren: Scalars['String']['output'];
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  vatNumber: Maybe<Scalars['String']['output']>;
};

/** Inputs to fetch company info by siren number */
export type CompanyInfoBySirenInput = {
  /** headquarter country ex FR | DE */
  headquarterCountry: Scalars['String']['input'];
  /** registration number of the company (SIREN) */
  siren: Scalars['String']['input'];
};

export type CompanyInfoBySirenPayload = CompanyInfoBySirenSuccessPayload | InternalErrorRejection | InvalidSirenNumberRejection | NotSupportedCountryRejection;

export type CompanyInfoBySirenSuccessPayload = {
  __typename?: 'CompanyInfoBySirenSuccessPayload';
  companyInfo: CompanyInfo;
};

/** Type of company. */
export type CompanyType =
  | 'Association'
  | 'Company'
  | 'HomeOwnerAssociation'
  | 'Other'
  | 'SelfEmployed';

/** Inputs to fetch company info by Company Ref and Headquarter Country */
export type CompanyUboByCompanyRefAndHeadquarterCountryInput = {
  /** registration number of the company (ex: SIREN) */
  companyRef: Scalars['String']['input'];
  /** headquarter country ex FRA */
  headquarterCountry: Scalars['CCA3']['input'];
};

export type CompanyUboByCompanyRefAndHeadquarterCountryPayload = {
  __typename?: 'CompanyUboByCompanyRefAndHeadquarterCountryPayload';
  individualUltimateBeneficialOwners: Array<IndividualUltimateBeneficialOwner>;
};

/** Complete Address Information */
export type CompleteAddressInput = {
  /** address line 1 (max 38 characters) */
  addressLine1: Scalars['String']['input'];
  /** address line 2 (max 38 characters) */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** city (max 30 characters) */
  city: Scalars['String']['input'];
  /** country code */
  country: Scalars['CCA3']['input'];
  /** postal code (max 10 characters) */
  postalCode: Scalars['String']['input'];
  /** state (max 30 characters) */
  state?: InputMaybe<Scalars['String']['input']>;
};

/** Complete Address Information with a contact */
export type CompleteAddressWithContactInput = {
  /** address line 1 (max 38 characters) */
  addressLine1: Scalars['String']['input'];
  /** address line 2 (max 38 characters) */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** city (max 30 characters) */
  city: Scalars['String']['input'];
  /** contact company name (max 38 characters) */
  companyName?: InputMaybe<Scalars['String']['input']>;
  /** country code */
  country: Scalars['CCA3']['input'];
  /** contact first name */
  firstName: Scalars['String']['input'];
  /** contact last name */
  lastName: Scalars['String']['input'];
  /** contact phone number */
  phoneNumber: Scalars['PhoneNumber']['input'];
  /** postal code (max 10 characters) */
  postalCode: Scalars['String']['input'];
  /** state (max 30 characters) */
  state?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Complete Digital Card used for ApplePay or GooglePay
 *
 * Once the pending phase is over, more data will be available in the response
 */
export type CompleteDigitalCard = DigitalCard & {
  __typename?: 'CompleteDigitalCard';
  /** The card contract ID */
  cardContractId: Scalars['ID']['output'];
  /**
   * Masked DPAN with the last four digits visible
   *
   * This value is present in the user wallet application
   */
  cardMaskedNumber: Scalars['String']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /**
   * Device
   * In case of a wallet application, some information about the device will be provided
   */
  device: Device;
  /** Unique identifier of a digital card */
  id: Scalars['ID']['output'];
  /** The project ID */
  projectId: Scalars['ID']['output'];
  /**
   * Digital Card status information
   *
   * In this type the status will be either ConsentPending or Pending
   */
  statusInfo: CompleteDigitalCardStatusInfo;
  /** The type of digitalization that created this digital card. */
  type: DigitalizationType;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /**
   * Id of the wallet application.
   * Will not be present for Merchant
   */
  walletId: Maybe<Scalars['String']['output']>;
  /** Wallet Provider (ApplePay, GooglePay ...) */
  walletProvider: WalletProvider;
};

/** Complete Digital Card Status */
export type CompleteDigitalCardStatus =
  /**
   * when the digital card is canceled
   *
   * this is a final state
   */
  | 'Canceled'
  /** when the digital card is enabled */
  | 'Enabled'
  /**
   * when the digital card is suspended
   *
   * the transactions will be blocked
   */
  | 'Suspended';

/** Complete Digital Card Status Information */
export type CompleteDigitalCardStatusInfo = {
  /** Status of the digital card. */
  status: CompleteDigitalCardStatus;
};

export type CompletedMerchantPaymentLinkStatusInfo = MerchantPaymentLinkStatusInfo & {
  __typename?: 'CompletedMerchantPaymentLinkStatusInfo';
  /** The time when the customer completed the payment. */
  completedAt: Scalars['DateTime']['output'];
  status: MerchantPaymentLinkStatus;
};

/** Relay Connection type, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type Connection = {
  /** Edge list */
  edges: Array<Edge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Some sensitive operation at Swan, such as initiating a payment, require consent */
export type Consent = {
  __typename?: 'Consent';
  /** date when the consent is accepted */
  acceptedAt: Maybe<Scalars['DateTime']['output']>;
  /** date when the consent is canceled */
  canceledAt: Maybe<Scalars['DateTime']['output']>;
  /** unique hash of the consent */
  challenge: Maybe<Scalars['String']['output']>;
  /** Redirect the user to this URL to start the consent flow */
  consentUrl: Scalars['String']['output'];
  /** created date */
  createdAt: Scalars['DateTime']['output'];
  /** date when the consent expire */
  expiredAt: Maybe<Scalars['DateTime']['output']>;
  /** unique identifier of the consent */
  id: Scalars['ID']['output'];
  /** purpose of the consent */
  purpose: ConsentPurpose;
  /** When the consent flow is finished the user is redirected to this URL */
  redirectUrl: Scalars['String']['output'];
  /** date when the consent is refused */
  refusedAt: Maybe<Scalars['DateTime']['output']>;
  /** `true` if the consent requires a Strong Customer Authentication */
  requireSCA: Scalars['Boolean']['output'];
  /** date when the `consentUrl` was request the first time */
  startedAt: Maybe<Scalars['DateTime']['output']>;
  /** status of the consent */
  status: ConsentStatus;
  /** updated date */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** user who initiated the consent */
  user: Maybe<User>;
  /** userId who initiated the consent */
  userId: Scalars['String']['output'];
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type ConsentConnection = Connection & {
  __typename?: 'ConsentConnection';
  /** ConsentEdge list */
  edges: Array<ConsentEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type ConsentEdge = Edge & {
  __typename?: 'ConsentEdge';
  /** Opaque identifier pointing to this consent node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The consent */
  node: Consent;
};

/** Purpose of a consent */
export type ConsentPurpose =
  /** when accepting the partnership conditions */
  | 'AcceptPartnershipConditions'
  /** when activating a physical card */
  | 'ActivatePhysicalCard'
  /** when inviting a new account membership */
  | 'AddAccountMembership'
  /** when adding several account memberships */
  | 'AddAccountMemberships'
  /** when adding a beneficiary */
  | 'AddBeneficiary'
  /** when adding a virtual card */
  | 'AddCard'
  /** when adding multiple cards */
  | 'AddCards'
  /** when adding a digital card */
  | 'AddDigitalCard'
  /** when adding a payment direct debit mandate */
  | 'AddDirectDebitPaymentMandate'
  /** when closing an account */
  | 'CloseAccount'
  /** when the consent is a multiple consent */
  | 'ConsentToMultipleConsents'
  /** when enabling a mandate */
  | 'EnableMandate'
  /** when initiating a credit transfer */
  | 'InitPayment'
  /** when initiating a funding request */
  | 'InitiateFundingRequest'
  /** when initiating an instant funding request */
  | 'InitiateInstantFundingRequest'
  /** when initiating an international credit transfer */
  | 'InitiateInternationalCreditTransfer'
  /** when requesting to print physical card */
  | 'PrintPhysicalCard'
  /** when resuming an account membership */
  | 'ResumeAccountMembership'
  /** when resuming a physical card */
  | 'ResumePhysicalCard'
  /** when returning a transaction for direct debit */
  | 'ReturnTransactionForDirectDebit'
  /** when returning a transaction for international credit transfer */
  | 'ReturnTransactionForInternationalCreditTransfer'
  /** when scheduling a standing order */
  | 'ScheduleStandingOrder'
  /** when updating an account membership */
  | 'UpdateAccountMembership'
  /** when updating a card */
  | 'UpdateCard'
  /** when updating a server consent project settings */
  | 'UpdateServerConsentProjectSettings'
  /** when viewing card confidential of a virtual card */
  | 'ViewCardNumbers'
  /** when requesting to view physical card PIN */
  | 'ViewPhysicalCardPin';

/** Status of a consent */
export type ConsentStatus =
  /** when the user accepted */
  | 'Accepted'
  /** when the user or the project decided to cancel the consent */
  | 'Canceled'
  /** when the consent is created */
  | 'Created'
  /**
   * when the user credentials were refused
   * @deprecated this status has never been used and will be removed in the following months
   */
  | 'CredentialRefused'
  /** when the user refused */
  | 'CustomerRefused'
  /** when the consent is expired */
  | 'Expired'
  /** when something went wrong */
  | 'Failed'
  /** when the operation is committing */
  | 'OperationCommitting'
  /** when the consentUrl has been requested */
  | 'Started';

export type Customer = {
  __typename?: 'Customer';
  /**
   * A customer id present in a third-party system.
   * Alows to link a customer to a payment link and by extension, to a Merchant Payment.
   */
  externalCustomerId: Maybe<Scalars['String']['output']>;
  iban: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

/** Rejection returned when the Debtor is closed */
export type DebtorAccountClosedRejection = Rejection & {
  __typename?: 'DebtorAccountClosedRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned when the Debtor does not belong to the same project as the creditor */
export type DebtorAccountNotAllowedRejection = Rejection & {
  __typename?: 'DebtorAccountNotAllowedRejection';
  message: Scalars['String']['output'];
};

export type DeleteSupportingDocumentInput = {
  /** Id of the supporting document to delete */
  id: Scalars['ID']['input'];
};

export type DeleteSupportingDocumentPayload = DeleteSupportingDocumentSuccessPayload | ForbiddenRejection | InternalErrorRejection | SupportingDocumentCollectionNotFoundRejection | SupportingDocumentCollectionStatusDoesNotAllowDeletionRejection | SupportingDocumentNotFoundRejection | SupportingDocumentStatusDoesNotAllowDeletionRejection | ValidationRejection;

export type DeleteSupportingDocumentSuccessPayload = {
  __typename?: 'DeleteSupportingDocumentSuccessPayload';
  id: Scalars['String']['output'];
};

/** Device */
export type Device = {
  __typename?: 'Device';
  /** Secure Element ID */
  SEID: Maybe<Scalars['String']['output']>;
  /**
   * Device name
   * End user defined name of the device on which the card id provided
   */
  name: Maybe<Scalars['String']['output']>;
  /** The type of device. It can be a Phone, Tablet, Watch */
  type: Maybe<Scalars['String']['output']>;
};

/** Digital Card used for ApplePay or GooglePay */
export type DigitalCard = {
  /** The card contract ID */
  cardContractId: Scalars['ID']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a digital card */
  id: Scalars['ID']['output'];
  /** The project ID */
  projectId: Scalars['ID']['output'];
  /** The type of digitalization that created this digital card. */
  type: DigitalizationType;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** Wallet Provider (ApplePay, GooglePay ...) */
  walletProvider: WalletProvider;
};

/** Digital Card Canceled Status Information */
export type DigitalCardCanceledStatusInfo = CompleteDigitalCardStatusInfo & {
  __typename?: 'DigitalCardCanceledStatusInfo';
  /** Cancel Date */
  canceledAt: Scalars['DateTime']['output'];
  /** Enable Date */
  enabledAt: Scalars['DateTime']['output'];
  /** Card status (always Canceled for type DigitalCardCanceledStatusInfo). */
  status: CompleteDigitalCardStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type DigitalCardConnection = Connection & {
  __typename?: 'DigitalCardConnection';
  /** CardEdge list */
  edges: Array<DigitalCardEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Digital Card ConsentPending Status Information */
export type DigitalCardConsentPendingStatusInfo = PendingDigitalCardStatusInfo & {
  __typename?: 'DigitalCardConsentPendingStatusInfo';
  /** A reference to the consent to validate */
  consent: Consent;
  /** Digital Card status (always ConsentPending for type DigitalCardConsentPendingStatusInfo). */
  status: PendingDigitalCardStatus;
};

/** Digital Card Declined Status Information */
export type DigitalCardDeclinedStatusInfo = PendingDigitalCardStatusInfo & {
  __typename?: 'DigitalCardDeclinedStatusInfo';
  /** Digital Card status (always Declined for type DigitalCardDeclinedStatusInfo). */
  status: PendingDigitalCardStatus;
};

/** Implements the Relay Edge interface */
export type DigitalCardEdge = Edge & {
  __typename?: 'DigitalCardEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The Card entry */
  node: DigitalCard;
};

/** Digital Card Enabled Status Information */
export type DigitalCardEnabledStatusInfo = CompleteDigitalCardStatusInfo & {
  __typename?: 'DigitalCardEnabledStatusInfo';
  /** Enable Date */
  enabledAt: Scalars['DateTime']['output'];
  /** Digital Card status (always Enabled for type DigitalCardEnabledStatusInfo). */
  status: CompleteDigitalCardStatus;
};

/** Filters that can be applied when listing digitalCards */
export type DigitalCardFiltersInput = {
  /**
   * The Secure Element ID
   * Mostly present on APple Devices
   */
  SEID?: InputMaybe<Scalars['String']['input']>;
  /** The digital card masker number */
  cardMaskedNumber?: InputMaybe<Scalars['String']['input']>;
  /** The id of the digitalCard */
  id?: InputMaybe<Scalars['String']['input']>;
  /** The status of the digital card. It can be a CompleteDigitalCardStatus or a PendingDigitalCardStatus */
  status?: InputMaybe<Scalars['String']['input']>;
  /** The wallet application ID in the user phone */
  walletId?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the wallet provider in the scheme system */
  walletProviderId?: InputMaybe<Scalars['String']['input']>;
  /** Either ApplePay, GooglePay or Merchant */
  walletProviderName?: InputMaybe<Scalars['String']['input']>;
};

/** Rejection returned when the Digital Card does not exist */
export type DigitalCardNotFoundRejection = Rejection & {
  __typename?: 'DigitalCardNotFoundRejection';
  identifier: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Field we can use when ordering that can be applied when listing digital cards */
export type DigitalCardOrderByFieldInput =
  | 'createdAt'
  | 'id'
  | 'updatedAt';

/** Order that can be applied when listing digital cards */
export type DigitalCardOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<DigitalCardOrderByFieldInput>;
};

/** Digital Card Pending Status Information */
export type DigitalCardPendingStatusInfo = PendingDigitalCardStatusInfo & {
  __typename?: 'DigitalCardPendingStatusInfo';
  /** Digital Card status (always Pending for type DigitalCardPendingStatusInfo). */
  status: PendingDigitalCardStatus;
};

/** Digital Card Suspended Status Information */
export type DigitalCardSuspendedStatusInfo = CompleteDigitalCardStatusInfo & {
  __typename?: 'DigitalCardSuspendedStatusInfo';
  /** Enable Date */
  enabledAt: Scalars['DateTime']['output'];
  /** Digital Card status (always Suspended for type DigitalCardSuspendedStatusInfo). */
  status: CompleteDigitalCardStatus;
  /** Suspend Date */
  suspendedAt: Scalars['DateTime']['output'];
};

/** Digitalization Type */
export type DigitalizationType =
  /** This digital card was created based on a PAN stored into a merchant application (ex: iTunes) */
  | 'CardOnFile'
  /** This digital card was created by an in app provisioning */
  | 'InApp'
  /**
   * This digital card was created by direct input of the PAN into a wallet application
   *
   * This direct input can also be done using the device camera
   */
  | 'Manual'
  /** We could not get the source of the digitalization */
  | 'Unknown';

/** EnabledMerchantPaymentMethodStatusInfo */
export type DisabledMerchantPaymentMethodStatusInfo = MerchantPaymentMethodStatusInfo & {
  __typename?: 'DisabledMerchantPaymentMethodStatusInfo';
  /** Merchant Payment Method disabled date */
  disabledAt: Scalars['Date']['output'];
  status: MerchantPaymentMethodStatus;
};

/** DisabledMerchantProfileStatusInfo */
export type DisabledMerchantProfileStatusInfo = MerchantProfileStatusInfo & {
  __typename?: 'DisabledMerchantProfileStatusInfo';
  disabledAt: Scalars['Date']['output'];
  status: MerchantProfileStatus;
};

/**
 * Edge type containing the node and cursor. The node is not defined in the interface because generic is not supported by GraphQL
 * but all implementation contains its own node property according to the paginated type.
 */
export type Edge = {
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
};

/** Employment status. */
export type EmploymentStatus =
  | 'Craftsman'
  | 'Employee'
  | 'Entrepreneur'
  | 'Farmer'
  | 'Manager'
  | 'Practitioner'
  | 'Retiree'
  | 'ShopOwner'
  | 'Student'
  | 'Unemployed';

/** Rejection returned if the card product don't have a card design enabled */
export type EnabledCardDesignNotFoundRejection = Rejection & {
  __typename?: 'EnabledCardDesignNotFoundRejection';
  message: Scalars['String']['output'];
};

/** EnabledMerchantPaymentMethodStatusInfo */
export type EnabledMerchantPaymentMethodStatusInfo = MerchantPaymentMethodStatusInfo & {
  __typename?: 'EnabledMerchantPaymentMethodStatusInfo';
  /** Merchant Payment Method enabled date */
  enabledAt: Scalars['Date']['output'];
  status: MerchantPaymentMethodStatus;
};

/** EnabledMerchantProfileStatusInfo */
export type EnabledMerchantProfileStatusInfo = MerchantProfileStatusInfo & {
  __typename?: 'EnabledMerchantProfileStatusInfo';
  enabledAt: Scalars['Date']['output'];
  status: MerchantProfileStatus;
};

export type EnvType =
  | 'Live'
  | 'Sandbox';

export type ExpiredMerchantPaymentLinkStatusInfo = MerchantPaymentLinkStatusInfo & {
  __typename?: 'ExpiredMerchantPaymentLinkStatusInfo';
  /**
   * The date when the payment link expired.
   * By default the payment link expires 120 days after it was created.
   */
  expiredAt: Scalars['DateTime']['output'];
  status: MerchantPaymentLinkStatus;
};

export type ExpiredPaymentLinkRejection = Rejection & {
  __typename?: 'ExpiredPaymentLinkRejection';
  message: Scalars['String']['output'];
};

export type ExternalAccountAlreadyExistsRejection = Rejection & {
  __typename?: 'ExternalAccountAlreadyExistsRejection';
  accountHolderId: Scalars['String']['output'];
  iban: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type FailedThreeDs = {
  __typename?: 'FailedThreeDs';
  code: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  status: ThreeDsStatus;
};

export type FieldValidationError =
  | 'Missing';

export type ForbiddenRejection = Rejection & {
  __typename?: 'ForbiddenRejection';
  message: Scalars['String']['output'];
};

/** Funding Limit Amount */
export type FundingLimitAmount = {
  __typename?: 'FundingLimitAmount';
  /** The amount settings */
  amount: Amount;
};

/** Funding Limit Amount Input */
export type FundingLimitAmountInput = {
  /** The amount settings */
  amount: AmountInput;
};

/** Funding Limit Settings Change Request */
export type FundingLimitSettingsChangeRequest = {
  __typename?: 'FundingLimitSettingsChangeRequest';
  /** Approved amount settings for the the instant funding limit and the funding limit */
  approved: Maybe<ApprovedFundingLimit>;
  /** Date of creation */
  createdAt: Maybe<Scalars['Date']['output']>;
  /** Requested amount settings for the funding limit */
  fundingLimit: FundingLimitAmount;
  /** Unique identifier of a funding limit settings change request */
  id: Scalars['ID']['output'];
  /** Requested amount settings for the instant funding limit */
  instantFundingLimit: FundingLimitAmount;
  /** Status of the request */
  statusInfo: FundingLimitSettingsChangeRequestStatusInfo;
  /** Date of last update */
  updatedAt: Maybe<Scalars['Date']['output']>;
};

/** StatusInfo when funding limit settings change request has been approved */
export type FundingLimitSettingsChangeRequestApprovedStatusInfo = FundingLimitSettingsChangeRequestStatusInfo & {
  __typename?: 'FundingLimitSettingsChangeRequestApprovedStatusInfo';
  reason: Scalars['String']['output'];
  status: FundingLimitSettingsChangeRequestStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type FundingLimitSettingsChangeRequestConnection = Connection & {
  __typename?: 'FundingLimitSettingsChangeRequestConnection';
  /** FundingLimitSettingsChangeRequestEdge list */
  edges: Array<FundingLimitSettingsChangeRequestEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type FundingLimitSettingsChangeRequestEdge = Edge & {
  __typename?: 'FundingLimitSettingsChangeRequestEdge';
  /** Opaque identifier pointing to this onboarding node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The FundingLimitSettingsChangeRequest */
  node: FundingLimitSettingsChangeRequest;
};

/** Filters that can be applied when listing funding limit settings change requests */
export type FundingLimitSettingsChangeRequestFiltersInput = {
  /** Filter by IDs */
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by status */
  status?: InputMaybe<Array<FundingLimitSettingsChangeRequestStatus>>;
};

/** Field we can use when ordering that can be applied when listing funding limit settings change requests */
export type FundingLimitSettingsChangeRequestOrderByFieldInput =
  | 'createdAt'
  | 'id'
  | 'updatedAt';

/** Order that can be applied when listing funding limit settings change requests */
export type FundingLimitSettingsChangeRequestOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<FundingLimitSettingsChangeRequestOrderByFieldInput>;
};

/** StatusInfo when funding limit settings change request is pending */
export type FundingLimitSettingsChangeRequestPendingStatusInfo = FundingLimitSettingsChangeRequestStatusInfo & {
  __typename?: 'FundingLimitSettingsChangeRequestPendingStatusInfo';
  status: FundingLimitSettingsChangeRequestStatus;
};

/** StatusInfo when funding limit settings change request has been rejected */
export type FundingLimitSettingsChangeRequestRefusedStatusInfo = FundingLimitSettingsChangeRequestStatusInfo & {
  __typename?: 'FundingLimitSettingsChangeRequestRefusedStatusInfo';
  reason: Scalars['String']['output'];
  status: FundingLimitSettingsChangeRequestStatus;
};

/** Funding Limit Settings Change Request Status */
export type FundingLimitSettingsChangeRequestStatus =
  /** When the request is approved */
  | 'Approved'
  /** When the request is in pending */
  | 'Pending'
  /** When the request is refused */
  | 'Refused'
  /** When the request is in waiting for information */
  | 'WaitingForInformation';

/** Object containing details about funding limit settings change request status */
export type FundingLimitSettingsChangeRequestStatusInfo = {
  /** Current limit settings change request status. */
  status: FundingLimitSettingsChangeRequestStatus;
};

/** StatusInfo when funding limit settings change request is waiting for more information */
export type FundingLimitSettingsChangeRequestWaitingForInformationStatusInfo = FundingLimitSettingsChangeRequestStatusInfo & {
  __typename?: 'FundingLimitSettingsChangeRequestWaitingForInformationStatusInfo';
  status: FundingLimitSettingsChangeRequestStatus;
};

export type GenerateSupportingDocumentUploadUrlInput = {
  /** Name of the document which will be sent */
  filename: Scalars['String']['input'];
  /** Unique identifier of a supporting document collection */
  supportingDocumentCollectionId: Scalars['ID']['input'];
  /** Purpose of document */
  supportingDocumentPurpose?: InputMaybe<SupportingDocumentPurposeEnum>;
  /** Type of document */
  supportingDocumentType?: InputMaybe<SupportingDocumentType>;
};

export type GenerateSupportingDocumentUploadUrlPayload = ForbiddenRejection | GenerateSupportingDocumentUploadUrlSuccessPayload | InternalErrorRejection | SupportingDocumentCollectionNotFoundRejection | SupportingDocumentUploadNotAllowedRejection | ValidationRejection;

export type GenerateSupportingDocumentUploadUrlSuccessPayload = {
  __typename?: 'GenerateSupportingDocumentUploadUrlSuccessPayload';
  /** Id of the supporting document created for this uploadUrl */
  supportingDocumentId: Scalars['String']['output'];
  /** Info to upload the document : url and fields to add along file in form (POST) */
  upload: SupportingDocumentUploadInfo;
};

export type Headquarters = {
  __typename?: 'Headquarters';
  address: Scalars['String']['output'];
  town: Scalars['String']['output'];
  zipCode: Scalars['String']['output'];
};

/** Rejection returned when the IBAN is not reachable */
export type IbanNotReachableRejection = Rejection & {
  __typename?: 'IBANNotReachableRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned when the IBAN is not valid */
export type IbanNotValidRejection = Rejection & {
  __typename?: 'IBANNotValidRejection';
  message: Scalars['String']['output'];
};

/** Virtual IBAN Status */
export type IbanStatus =
  /** When the virtual IBAN refuse definitely to receive Sepa payments */
  | 'Canceled'
  /** When the virtual IBAN accept to receive Sepa payments */
  | 'Enabled'
  /** When the virtual IBAN refuse temporarily to receive Sepa payments */
  | 'Suspended';

export type IbanValidationRejection = Rejection & {
  __typename?: 'IbanValidationRejection';
  message: Scalars['String']['output'];
};

/** Possible value for the field IdentificationLevel */
export type IdentificationLevel =
  /** Human identity verification */
  | 'Expert'
  /** Identity verification with PVID */
  | 'PVID'
  /** Identity verification with Qualified Electronic Signature */
  | 'QES';

/** Identification levels */
export type IdentificationLevels = {
  __typename?: 'IdentificationLevels';
  PVID: Scalars['Boolean']['output'];
  QES: Scalars['Boolean']['output'];
  expert: Scalars['Boolean']['output'];
};

/** Rejection returned if identity and the account memberships are already bind */
export type IdentityAlreadyBindToAccountMembershipRejection = Rejection & {
  __typename?: 'IdentityAlreadyBindToAccountMembershipRejection';
  accountId: Scalars['String']['output'];
  identityId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Data used for in app provisioning */
export type InAppProvisioningData = {
  __typename?: 'InAppProvisioningData';
  /** Cryptographic OTP used to pre-validate digitalization */
  activationData: Scalars['String']['output'];
  /** Encrypted card data */
  encryptedData: Scalars['String']['output'];
  /** Base64 public key used with the wallet provider public key to encrypt the card data */
  ephemeralPublicKey: Scalars['String']['output'];
  /** IV used to encrypt the card Data (Useful for Google Pay) */
  iv: Maybe<Scalars['String']['output']>;
  /** hash algorithm used during encryption of the card data (Useful for Google Pay) */
  oaepHashingAlgorithm: Maybe<Scalars['String']['output']>;
  /** public key fingerprint of the key used to encrypt card data (Useful for Google Pay) */
  publicKeyFingerprint: Maybe<Scalars['String']['output']>;
};

/**
 * Individual Ultimate Beneficial Owner
 * You need to describe the natural person (s) who hold, directly or indirectly, more than 25% of the capital or the rights of vote of the reporting company.
 * Please describe the company (s) that owns the company that wishes to open an account, when an individual holds in fine more than 25%
 */
export type IndividualUltimateBeneficialOwner = {
  __typename?: 'IndividualUltimateBeneficialOwner';
  /** individual birth city */
  birthCity: Maybe<Scalars['String']['output']>;
  /** individual birth city postal code */
  birthCityPostalCode: Maybe<Scalars['String']['output']>;
  /** individual birth country code */
  birthCountryCode: Maybe<Scalars['CCA3']['output']>;
  /** individual birth date */
  birthDate: Maybe<Scalars['DateTime']['output']>;
  /** individual first name */
  firstName: Maybe<Scalars['String']['output']>;
  /** Ultimate beneficial owner's identity document details */
  identityDocumentDetails: Maybe<UboIdentityDocumentDetails>;
  /** Information relating to the type of the UBO */
  info: IndividualUltimateBeneficialOwnerInfo;
  /** individual last name */
  lastName: Maybe<Scalars['String']['output']>;
  /** Individual beneficial owner residency Address */
  residencyAddress: Maybe<AddressInformation>;
  /** Individual beneficial owner Tax or Identification Number */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Individual beneficial owner title (Mr/Ms) */
  title: Maybe<TitleEnum>;
};

/** Define the type of the UBO */
export type IndividualUltimateBeneficialOwnerInfo = {
  /** Individual type */
  type: IndividualUltimateBeneficialOwnerTypeEnum;
};

export type IndividualUltimateBeneficialOwnerInput = {
  /** Individual birth city. Length must be from 0 to 100 characters */
  birthCity?: InputMaybe<Scalars['String']['input']>;
  /** Individual birth city postal code. Length must be from 0 to 50 characters */
  birthCityPostalCode?: InputMaybe<Scalars['String']['input']>;
  /** Individual birth country code */
  birthCountryCode?: InputMaybe<Scalars['CCA3']['input']>;
  /** Individual birth date. Must be a valid date in the YYYY/MM/DD format */
  birthDate?: InputMaybe<Scalars['String']['input']>;
  /** Define UBO is a Direct Owner */
  direct?: InputMaybe<Scalars['Boolean']['input']>;
  /** Individual beneficial owner first name. Length must be from 0 to 100 characters */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Ultimate beneficial owner's identity document details */
  identityDocumentDetails?: InputMaybe<UboIdentityDocumentDetailsInput>;
  /** Define UBO is an Indirect Owner */
  indirect?: InputMaybe<Scalars['Boolean']['input']>;
  /** Individual beneficial owner last name. Length must be from 0 to 100 characters */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Individual beneficial owner residency address */
  residencyAddress?: InputMaybe<ResidencyAddressInput>;
  /** Individual beneficial owner Tax or Identification Number */
  taxIdentificationNumber?: InputMaybe<Scalars['String']['input']>;
  /** Individual ultimate beneficial owner title (Mr/Ms) */
  title?: InputMaybe<TitleEnum>;
  /** Total of capital (in percentage, ex: 50 = 50%). Must be between 1 and 100. */
  totalCapitalPercentage?: InputMaybe<Scalars['Float']['input']>;
  /** Define UBO is a Legal Representative */
  type?: InputMaybe<IndividualUltimateBeneficialOwnerTypeEnum>;
};

/** Individual Ultimate beneficial owner nature */
export type IndividualUltimateBeneficialOwnerTypeEnum =
  /** The Beneficial Owner have shares */
  | 'HasCapital'
  /** The Beneficial Owner is the representant legal */
  | 'LegalRepresentative'
  /** Other */
  | 'Other';

/** Individual Ultimate Beneficial Owner Type Has Capital */
export type IndividualUltimateBeneficialOwnerTypeHasCapital = IndividualUltimateBeneficialOwnerInfo & {
  __typename?: 'IndividualUltimateBeneficialOwnerTypeHasCapital';
  /** Define UBO is an Direct Owner */
  direct: Maybe<Scalars['Boolean']['output']>;
  /** Define UBO is an Indirect Owner */
  indirect: Maybe<Scalars['Boolean']['output']>;
  /** Total of capital (in percentage, ex: 50 = 50%) */
  totalCapitalPercentage: Maybe<Scalars['Float']['output']>;
  /** Individual type */
  type: IndividualUltimateBeneficialOwnerTypeEnum;
};

/** Individual Ultimate Beneficial Owner Type Legal Representative */
export type IndividualUltimateBeneficialOwnerTypeLegalRepresentative = IndividualUltimateBeneficialOwnerInfo & {
  __typename?: 'IndividualUltimateBeneficialOwnerTypeLegalRepresentative';
  /** Individual type */
  type: IndividualUltimateBeneficialOwnerTypeEnum;
};

/** Individual Ultimate Beneficial Owner Type Other */
export type IndividualUltimateBeneficialOwnerTypeOther = IndividualUltimateBeneficialOwnerInfo & {
  __typename?: 'IndividualUltimateBeneficialOwnerTypeOther';
  /** Individual type */
  type: IndividualUltimateBeneficialOwnerTypeEnum;
};

/** InternalDirectDebitB2BMerchantPaymentMethod */
export type InternalDirectDebitB2BMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'InternalDirectDebitB2BMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** InternalDirectDebitStandardMerchantPaymentMethod */
export type InternalDirectDebitStandardMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'InternalDirectDebitStandardMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** Rejection returned on unexpected server error */
export type InternalErrorRejection = Rejection & {
  __typename?: 'InternalErrorRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned on invalid argument error */
export type InvalidArgumentRejection = Rejection & {
  __typename?: 'InvalidArgumentRejection';
  code: InvalidArgumentRejectionCode;
  fields: Array<InvalidArgumentRejectionField>;
  message: Scalars['String']['output'];
};

export type InvalidArgumentRejectionCode =
  | 'INVALID_INPUT';

export type InvalidArgumentRejectionField = {
  __typename?: 'InvalidArgumentRejectionField';
  errors: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

/** Rejection returned if phone number is not well formatted */
export type InvalidPhoneNumberRejection = Rejection & {
  __typename?: 'InvalidPhoneNumberRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned if siren number is not well formatted */
export type InvalidSirenNumberRejection = Rejection & {
  __typename?: 'InvalidSirenNumberRejection';
  message: Scalars['String']['output'];
};

export type Language =
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'it'
  | 'nl';

export type LegalRepresentativeAccountMembershipCannotBeDisabledRejection = Rejection & {
  __typename?: 'LegalRepresentativeAccountMembershipCannotBeDisabledRejection';
  accountMembershipId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type LegalRepresentativeAccountMembershipCannotBeSuspendedRejection = Rejection & {
  __typename?: 'LegalRepresentativeAccountMembershipCannotBeSuspendedRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type LegalRepresentativeEmailCannotBeUpdatedRejection = {
  __typename?: 'LegalRepresentativeEmailCannotBeUpdatedRejection';
  message: Scalars['String']['output'];
};

export type LegalRepresentativePermissionsCannotBeUpdatedRejection = {
  __typename?: 'LegalRepresentativePermissionsCannotBeUpdatedRejection';
  message: Scalars['String']['output'];
};

export type MaskedCardInfo = {
  __typename?: 'MaskedCardInfo';
  cardHolderName: Scalars['String']['output'];
  maskedCvv: Scalars['String']['output'];
  maskedExpiryDate: Scalars['String']['output'];
  maskedPan: Scalars['String']['output'];
};

/** Filters that can be applied when listing account memberships */
export type MembershipsFilterInput = {
  /** Can the user initiate payments on this account */
  canInitiatePayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user manage account membership */
  canManageAccountMembership?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user manage beneficiaries */
  canManageBeneficiaries?: InputMaybe<Scalars['Boolean']['input']>;
  /** `true` if this account membership can manage cards for himself or to the memberships he manages */
  canManageCards?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the user view account */
  canViewAccount?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Search by email
   *
   * @deprecated(reason: "use `search` instead")
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by first name
   *
   * @deprecated(reason: "use `search` instead")
   */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search by last name
   *
   * @deprecated(reason: "use `search` instead")
   */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search string to look for
   *
   * Search will be performed in following fields:
   *  - First name
   *  - Last name
   *  - Email
   *  - ID
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Account memberships status/statuses we're looking for */
  status?: InputMaybe<Array<AccountMembershipStatus>>;
};

/** The different balances of the payment. Use this to understand in details what actions have been taken on the payment and what actions can be taken moving forward. */
export type MerchantBalance = {
  __typename?: 'MerchantBalance';
  /** The amount that can be canceled on this payment */
  availableToCancel: Amount;
  /** The amount that can be captured on this payment */
  availableToCapture: Amount;
  /** The amount that can be refunded on this payment */
  availableToRefund: Amount;
  /** The amount authorised */
  totalAuthorized: Amount;
  /** The amount canceled */
  totalCanceled: Amount;
  /** The amount captured */
  totalCaptured: Amount;
  /** The amount disputed */
  totalDisputed: Amount;
  /** The amount refunded */
  totalRefunded: Amount;
};

/** Rejection returned when the Merchant Card Payment is declined */
export type MerchantCardPaymentDeclinedRejection = Rejection & {
  __typename?: 'MerchantCardPaymentDeclinedRejection';
  message: Scalars['String']['output'];
};

export type MerchantPayment = {
  __typename?: 'MerchantPayment';
  /** amount */
  amount: Amount;
  /** Authorized date */
  authorizedAt: Maybe<Scalars['DateTime']['output']>;
  balance: MerchantBalance;
  /** The billing address associated to the payment */
  billingAddress: Maybe<Address>;
  /** Canceled date */
  canceledAt: Maybe<Scalars['DateTime']['output']>;
  /** Captured date */
  capturedAt: Maybe<Scalars['DateTime']['output']>;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Disputed date */
  disputedAt: Maybe<Scalars['DateTime']['output']>;
  /** an arbitrary identifier that was defined by you when you created this payment */
  externalReference: Maybe<Scalars['String']['output']>;
  /** unique identifier of a merchant payment */
  id: Scalars['ID']['output'];
  /** Label */
  label: Maybe<Scalars['String']['output']>;
  /** unique identifier of the merchant profile associated to the payment */
  merchantProfileId: Scalars['ID']['output'];
  /** unique identifier of the payment link associated to the payment */
  paymentLinkId: Maybe<Scalars['ID']['output']>;
  /** unique identifier of the payment mandate associated to the payment */
  paymentMandateId: Scalars['ID']['output'];
  /** unique identifier of the payment method associated to the payment */
  paymentMethodId: Scalars['ID']['output'];
  reference: Maybe<Scalars['String']['output']>;
  /** Refunded date */
  refundedAt: Maybe<Scalars['DateTime']['output']>;
  /** Rejected date */
  rejectedAt: Maybe<Scalars['DateTime']['output']>;
  /** status information */
  statusInfo: MerchantPaymentStatusInfo;
  threeDS: Maybe<ThreeDs>;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
};

/** Merchant Payment status authorized */
export type MerchantPaymentAuthorized = MerchantPaymentStatusInfo & {
  __typename?: 'MerchantPaymentAuthorized';
  /** status of the merchant payment */
  status: MerchantPaymentStatus;
};

/** Merchant Payment status captured */
export type MerchantPaymentCaptured = MerchantPaymentStatusInfo & {
  __typename?: 'MerchantPaymentCaptured';
  /** status of the merchant payment */
  status: MerchantPaymentStatus;
};

export type MerchantPaymentConnection = Connection & {
  __typename?: 'MerchantPaymentConnection';
  /** Edge list */
  edges: Array<MerchantPaymentEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

export type MerchantPaymentEdge = Edge & {
  __typename?: 'MerchantPaymentEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  node: MerchantPayment;
};

export type MerchantPaymentFiltersInput = {
  amountGreaterThan?: InputMaybe<Scalars['AmountValue']['input']>;
  amountSmallerThan?: InputMaybe<Scalars['AmountValue']['input']>;
  /** To filter after a createdAt value */
  isAfterCreatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** To filter before a createdAt value */
  isBeforeCreatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** To filter on some Merchant Payment Method Type (all if empty) */
  paymentMethod?: InputMaybe<Array<MerchantPaymentMethodType>>;
  /** To filter on some text occurrences (words or ids) */
  search?: InputMaybe<Scalars['String']['input']>;
  /** To filter on some Merchant Payment Link Status (all if empty) */
  status?: InputMaybe<Array<MerchantPaymentStatus>>;
};

/** Merchant Payment status initiated */
export type MerchantPaymentInitiated = MerchantPaymentStatusInfo & {
  __typename?: 'MerchantPaymentInitiated';
  /** status of the merchant payment */
  status: MerchantPaymentStatus;
};

export type MerchantPaymentLink = {
  __typename?: 'MerchantPaymentLink';
  /** Amount to be paid to successfully complete the payment. */
  amount: Amount;
  /**
   * The customer billing Address
   * These fields should be completed also to pre-fill a SEPA direct debit mandate.
   *
   * We strongly advice to complete these fields if merchants want to get paid through card payment method, in order to minimize the risk of payment rejection by Visa / Mastercard schemes
   */
  billingAddress: Maybe<Address>;
  /** URL to redirect the user to if they cancel their payment */
  cancelRedirectUrl: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /**
   *  We will use the information specified here to prefill the payment link fields
   * depending on the payment method the end user chooses.
   * Keep in mind that your end customer will be able to edit these fields.
   */
  customer: Maybe<Customer>;
  /**
   * Any string that you want to be attached to this payment link.
   * Usually something to help you reference the link in an external system.
   */
  externalReference: Maybe<Scalars['String']['output']>;
  /** Merchant payment link's unique ID. */
  id: Scalars['String']['output'];
  /** Label of the concerned payment collection, which will be displayed on Swan bank statement	and on the Swan merchant payment page. */
  label: Maybe<Scalars['String']['output']>;
  /**
   * The language used for the payment page.
   * Default is the browser's language, or English if not available.
   */
  language: Maybe<Scalars['String']['output']>;
  /** The Merchant Profile to link this Payment Link to */
  merchantProfile: MerchantProfile;
  /**
   * List of payment methods IDs enabled for this payment link.
   * If the array is empty Swan will allow all the payment methods that are enabled for the merchant profile (except for Check and Internal Direct Debit)
   */
  paymentMethods: Array<MerchantPaymentMethod>;
  /** ID of the related project */
  projectId: Scalars['ID']['output'];
  /** Merchant Website URL to redirect the user to when the payment is completed. */
  redirectUrl: Maybe<Scalars['String']['output']>;
  /**
   * Optional field intended to provide a way for you to include a reference number or code.
   * The customer will most likely see this value on their bank statement, though we can't know as every banking platform is different.
   */
  reference: Maybe<Scalars['String']['output']>;
  /**
   *   A date that reflects the time at which the user asked the transaction to be executed.
   * For card transactions, request execution must occur within 7 days after authorization or the authorization may expire.
   * For SEPA Direct Debit transactions, request execution must occur up to 1 year in the future.
   *
   * Default value means that the execution will be as soon as possible
   */
  requestedExecutionAt: Maybe<Scalars['DateTime']['output']>;
  /**
   * Controls if the payment mandate created from this payment link is for one-time use or can be reused
   * This is applicable for card and SEPA Direct Debit payment methods only.
   */
  sequence: PaymentMandateSequence;
  /** The merchant payment link status. */
  statusInfo: MerchantPaymentLinkStatusInfo;
  /** The URL at which the customer can complete the payment. */
  url: Scalars['String']['output'];
};

export type MerchantPaymentLinkConnection = Connection & {
  __typename?: 'MerchantPaymentLinkConnection';
  /** Edge list */
  edges: Array<MerchantPaymentLinkEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

export type MerchantPaymentLinkEdge = Edge & {
  __typename?: 'MerchantPaymentLinkEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  node: MerchantPaymentLink;
};

export type MerchantPaymentLinkFiltersInput = {
  /** To filter payment links having an amount greater than the given criteria */
  amountGreaterThan?: InputMaybe<Scalars['AmountValue']['input']>;
  /** To filter payment links having an amount smaller than the given criteria */
  amountSmallerThan?: InputMaybe<Scalars['AmountValue']['input']>;
  /** To filter after a createdAt value */
  isAfterCreatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** To filter before a createdAt value */
  isBeforeCreatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** To filter on some text occurrences (words or ids) */
  search?: InputMaybe<Scalars['String']['input']>;
  /** To filter on some Merchant Payment Link Status (all if empty) */
  status?: InputMaybe<Array<MerchantPaymentLinkStatus>>;
};

export type MerchantPaymentLinkOrderByFieldInput =
  | 'createdAt'
  | 'label'
  | 'url';

export type MerchantPaymentLinkOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<MerchantPaymentLinkOrderByFieldInput>;
};

export type MerchantPaymentLinkStatus =
  /** Customers can still use the merchant payment link to pay. */
  | 'Active'
  /** The customer completed the payment. */
  | 'Completed'
  /** The merchant payment link is expired. */
  | 'Expired';

export type MerchantPaymentLinkStatusInfo = {
  status: MerchantPaymentLinkStatus;
};

/** Base object for the different Payment Methods available */
export type MerchantPaymentMethod = {
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** The different rejection reasons for a CardMerchantPaymentMethod */
export type MerchantPaymentMethodCardRejectReason =
  | 'SwanRefused'
  | 'SwanTechnicalErrorOccurred'
  | 'UnsupportedBusiness';

/** Rejection returned when the Merchant Payment Method is not active */
export type MerchantPaymentMethodNotActiveRejection = Rejection & {
  __typename?: 'MerchantPaymentMethodNotActiveRejection';
  message: Scalars['String']['output'];
  paymentMethodIds: Maybe<Array<Scalars['String']['output']>>;
};

/** The different statuses a MerchantPaymentMethod can have */
export type MerchantPaymentMethodStatus =
  | 'Disabled'
  | 'Enabled'
  | 'PendingReview'
  | 'Rejected'
  | 'Suspended';

/** The payment method status information */
export type MerchantPaymentMethodStatusInfo = {
  /** Merchant Payment Method Status */
  status: MerchantPaymentMethodStatus;
};

/** The different statuses a MerchantPaymentMethod can have */
export type MerchantPaymentMethodType =
  | 'Card'
  | 'Check'
  | 'InternalDirectDebitB2b'
  | 'InternalDirectDebitStandard'
  | 'SepaDirectDebitB2b'
  | 'SepaDirectDebitCore';

export type MerchantPaymentMethodUpdateRequest = {
  id: Scalars['ID']['output'];
};

export type MerchantPaymentMethodWrongStatusRejection = Rejection & {
  __typename?: 'MerchantPaymentMethodWrongStatusRejection';
  message: Scalars['String']['output'];
};

export type MerchantPaymentOrderByFieldInput =
  | 'amount'
  | 'createdAt'
  | 'externalReference'
  | 'label'
  | 'status';

export type MerchantPaymentOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<MerchantPaymentOrderByFieldInput>;
};

/** Merchant Payment status rejected */
export type MerchantPaymentRejected = MerchantPaymentStatusInfo & {
  __typename?: 'MerchantPaymentRejected';
  /** rejected reason */
  reason: Scalars['String']['output'];
  /** status of the merchant payment */
  status: MerchantPaymentStatus;
};

/** Merchant Payment status */
export type MerchantPaymentStatus =
  | 'Authorized'
  | 'Captured'
  | 'Initiated'
  | 'Rejected';

/** Merchant Payment Status Information */
export type MerchantPaymentStatusInfo = {
  /** status of the merchant payment */
  status: MerchantPaymentStatus;
};

/** Merchant Profile */
export type MerchantProfile = {
  __typename?: 'MerchantProfile';
  /**
   * Your accent color, used in white label interfaces.
   * This color would also be inherited in the Swan Merchant Payment page.
   */
  accentColor: Maybe<Scalars['String']['output']>;
  /** The Account ID this Merchant Profile is linked to */
  accountId: Scalars['ID']['output'];
  /** created date */
  createdAt: Scalars['DateTime']['output'];
  /** expected average basket value. */
  expectedAverageBasket: Amount;
  /** Expected annual activity volumes for all payment method */
  expectedMonthlyPaymentVolume: Amount;
  /** The Merchant Profile ID */
  id: Scalars['ID']['output'];
  /** Url of the merchant's logo */
  merchantLogoUrl: Maybe<Scalars['String']['output']>;
  /** Business name of the merchant, i.e. name that will be displayed on debtors' bank statements */
  merchantName: Scalars['String']['output'];
  merchantPaymentLinks: Maybe<MerchantPaymentLinkConnection>;
  /** Payment Methods associated */
  merchantPaymentMethods: Maybe<Array<MerchantPaymentMethod>>;
  merchantPayments: Maybe<MerchantPaymentConnection>;
  /** Url of the merchant's website */
  merchantWebsite: Maybe<Scalars['String']['output']>;
  /** Type of product sold. List of value: Goods, Services, VirtualGoods, GiftsAndDonations. Gifts and donations can be club subscription or collection of donations (for associations), tips collection, contributions for local authorities */
  productType: ProductType;
  /** Update Requested associated */
  requestMerchantProfileUpdate: Maybe<RequestMerchantProfileUpdate>;
  /**
   * Updates Requested associated
   * @deprecated Field no longer supported
   */
  requestedMerchantProfileUpdates: Maybe<Array<RequestMerchantProfileUpdate>>;
  /** The status of the merchant profile */
  statusInfo: MerchantProfileStatusInfo;
  /** updated date */
  updatedAt: Scalars['DateTime']['output'];
};


/** Merchant Profile */
export type MerchantProfileMerchantPaymentLinksArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<MerchantPaymentLinkFiltersInput>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<MerchantPaymentLinkOrderByInput>;
};


/** Merchant Profile */
export type MerchantProfileMerchantPaymentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<MerchantPaymentFiltersInput>;
  first?: Scalars['Int']['input'];
  orderBy: InputMaybe<MerchantPaymentOrderByInput>;
};

export type MerchantProfileNotValidRejection = Rejection & {
  __typename?: 'MerchantProfileNotValidRejection';
  message: Scalars['String']['output'];
};

/** Merchant Profile Statuses */
export type MerchantProfileStatus =
  /** Disabled */
  | 'Disabled'
  /** Enabled */
  | 'Enabled'
  /** A Merchant Profile is created in the PendingReview status */
  | 'PendingReview'
  /** Rejected */
  | 'Rejected'
  /** Suspended */
  | 'Suspended';

/** Merchant Profile Status Information */
export type MerchantProfileStatusInfo = {
  status: MerchantProfileStatus;
};

/** Rejection returned when the Merchant Profile is not in the expected status */
export type MerchantProfileWrongStatusRejection = Rejection & {
  __typename?: 'MerchantProfileWrongStatusRejection';
  currentStatus: MerchantProfileStatus;
  expectedStatus: MerchantProfileStatus;
  message: Scalars['String']['output'];
};

export type MissingBirthDateRejection = {
  __typename?: 'MissingBirthDateRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned when mandatory fields are missing from the call. */
export type MissingMandatoryFieldRejection = Rejection & {
  __typename?: 'MissingMandatoryFieldRejection';
  message: Scalars['String']['output'];
};

/** Monthly income. */
export type MonthlyIncome =
  /** between 500 and 1500 */
  | 'Between500And1500'
  /** between 1500 and 3000 */
  | 'Between1500And3000'
  /** between 3000 and 4500 */
  | 'Between3000And4500'
  /** less than 500 */
  | 'LessThan500'
  /** more than 4500 */
  | 'MoreThan4500';

/** Monthly payment volume. */
export type MonthlyPaymentVolume =
  | 'Between10000And50000'
  | 'Between50000And100000'
  | 'LessThan10000'
  | 'MoreThan100000';

export type Mutation = {
  __typename?: 'Mutation';
  addSepaDirectDebitPaymentMandateFromPaymentLink: AddSepaDirectDebitPaymentMandateFromPaymentLinkPayload;
  /**
   * Delete a supporting document, in case uploaded file is not what was wanted. This action can not be undone.
   *
   * This mutation can only be used on an "Uploaded" supporting document of a "WaitingForDocument" supporting document collection.
   *
   * *This mutation is restricted to a Project access token ([Learn More](https://docs.swan.io/api/authentication))*
   */
  deleteSupportingDocument: DeleteSupportingDocumentPayload;
  /**
   * Generate and return a presigned URL to upload a unique file for the supporting document collection
   *
   * *This mutation is restricted to a Project access token ([Learn More](https://docs.swan.io/api/authentication))*
   */
  generateSupportingDocumentUploadUrl: GenerateSupportingDocumentUploadUrlPayload;
  /**
   * Ask for Swan's compliance team to review given supporting document collection.
   *
   * *This mutation is restricted to a Project access token ([Learn More](https://docs.swan.io/api/authentication))*
   */
  requestSupportingDocumentCollectionReview: RequestSupportingDocumentCollectionReviewPayload;
  unauthenticatedAddCardPaymentMandate: AddCardPaymentMandatePayload;
  unauthenticatedInitiateMerchantCardPaymentFromPaymentLink: UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkPayload;
  unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkPayload;
  unauthenticatedOnboardPublicCompanyAccountHolder: UnauthenticatedOnboardPublicCompanyAccountHolderPayload;
  unauthenticatedOnboardPublicIndividualAccountHolder: UnauthenticatedOnboardPublicIndividualAccountHolderPayload;
  unauthenticatedUpdateCompanyOnboarding: UnauthenticatedUpdateCompanyOnboardingPayload;
  unauthenticatedUpdateIndividualOnboarding: UnauthenticatedUpdateIndividualOnboardingPayload;
};


export type MutationAddSepaDirectDebitPaymentMandateFromPaymentLinkArgs = {
  input: AddSepaDirectDebitPaymentMandateFromPaymentLinkInput;
};


export type MutationDeleteSupportingDocumentArgs = {
  input: DeleteSupportingDocumentInput;
};


export type MutationGenerateSupportingDocumentUploadUrlArgs = {
  input: GenerateSupportingDocumentUploadUrlInput;
};


export type MutationRequestSupportingDocumentCollectionReviewArgs = {
  input: InputMaybe<RequestSupportingDocumentCollectionReviewInput>;
};


export type MutationUnauthenticatedAddCardPaymentMandateArgs = {
  input: AddCardPaymentMandateInput;
};


export type MutationUnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkArgs = {
  input: UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkInput;
};


export type MutationUnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkArgs = {
  input: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput;
};


export type MutationUnauthenticatedOnboardPublicCompanyAccountHolderArgs = {
  input: InputMaybe<UnauthenticatedOnboardPublicCompanyAccountHolderInput>;
};


export type MutationUnauthenticatedOnboardPublicIndividualAccountHolderArgs = {
  input: InputMaybe<UnauthenticatedOnboardPublicIndividualAccountHolderInput>;
};


export type MutationUnauthenticatedUpdateCompanyOnboardingArgs = {
  input: InputMaybe<UnauthenticatedUpdateCompanyOnboardingInput>;
};


export type MutationUnauthenticatedUpdateIndividualOnboardingArgs = {
  input: UnauthenticatedUpdateIndividualOnboardingInput;
};

/** Rejection returned if the entity was not found or if the user does not have the rights to know that the account exists */
export type NotFoundRejection = Rejection & {
  __typename?: 'NotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Rejection returned when consent status couldn't change */
export type NotReachableConsentStatusRejection = Rejection & {
  __typename?: 'NotReachableConsentStatusRejection';
  currentStatus: Maybe<ConsentStatus>;
  message: Scalars['String']['output'];
  unreachableStatus: Maybe<ConsentStatus>;
};

/** Rejection returned if the queried service doesn't support the country code */
export type NotSupportedCountryRejection = Rejection & {
  __typename?: 'NotSupportedCountryRejection';
  message: Scalars['String']['output'];
};

/** Extra parameters provided by partner */
export type OAuthRedirectParameters = {
  __typename?: 'OAuthRedirectParameters';
  /** URL used to redirect the user at the end of the onboarding process. If `null` the user is redirected to the white label web banking. */
  redirectUrl: Maybe<Scalars['String']['output']>;
  /** Custom state provided by partner to prevent XSRF attack, will be filled by onBoardingId in case of nullity. */
  state: Maybe<Scalars['String']['output']>;
};

export type OAuthRedirectParametersInput = {
  /** URL used to redirect the user at the end of the onboarding process. If `null` the user is redirected to the white label web banking. Length must be from 0 to 255 characters */
  redirectUrl?: InputMaybe<Scalars['String']['input']>;
  /** Custom state provided by partner to prevent XSRF attack, will be filled by onBoardingId in case of nullity. Length must be from 0 to 255 characters */
  state?: InputMaybe<Scalars['String']['input']>;
};

/** Information provided during the onboarding process of an individual or a company */
export type Onboarding = {
  __typename?: 'Onboarding';
  /** Account opened after the onboarding finalization */
  account: Maybe<Account>;
  /** Account Country */
  accountCountry: AccountCountry;
  /** Account holder created at the end of the onboarding process */
  accountHolder: Maybe<AccountHolder>;
  /** Account name */
  accountName: Maybe<Scalars['String']['output']>;
  /** Creation date */
  createdAt: Scalars['DateTime']['output'];
  /** Email */
  email: Maybe<Scalars['String']['output']>;
  /** Finalization date */
  finalizedAt: Maybe<Scalars['DateTime']['output']>;
  /** Unique identifier of an onboarding */
  id: Scalars['String']['output'];
  /** Information regarding the Individual or the company to onboard */
  info: OnboardingAccountHolderInfo;
  /**
   * Language of the onboarding process.
   * - Accepted languages: `["en", "fr", "nl", "de", "it", "es", "pt", "fi"]`
   */
  language: Maybe<Scalars['String']['output']>;
  /** List of accepted identification level for the legal representative */
  legalRepresentativeAcceptedIdentificationLevels: Array<Maybe<IdentificationLevel>>;
  /** Recommended identification level for the legal representative */
  legalRepresentativeRecommendedIdentificationLevel: IdentificationLevel;
  /** Extra parameters provided by partner */
  oAuthRedirectParameters: Maybe<OAuthRedirectParameters>;
  /** Current computed state of onboarding */
  onboardingState: OnboardingState;
  /** Redirect the legal representative of a new account holder to this URL to start the onboarding process */
  onboardingUrl: Maybe<Scalars['String']['output']>;
  /**
   * URL used to redirect the user at the end of the onboarding process. If `null` the user is redirected to the white label web banking.
   * @deprecated Use `redirectUrl` field on oauthRedirectParameters parameters instead.
   */
  redirectUrl: Scalars['String']['output'];
  /** Status (valid/invalid/finalized) and details of errors on fields */
  statusInfo: OnboardingStatusInfo;
  /** List of supporting document collection owned by the account holder. */
  supportingDocumentCollection: SupportingDocumentCollection;
  /** Swan TCU URL */
  tcuUrl: Scalars['String']['output'];
  /** Creation date */
  updatedAt: Scalars['DateTime']['output'];
};

/** The onboarding could be for an Individual or a company */
export type OnboardingAccountHolderInfo = {
  /** Account holder type */
  type: AccountHolderType;
};

/** Company Account Holder Information */
export type OnboardingCompanyAccountHolderInfo = OnboardingAccountHolderInfo & {
  __typename?: 'OnboardingCompanyAccountHolderInfo';
  /** business activity */
  businessActivity: Maybe<BusinessActivity>;
  /**
   * business activity description
   * This must be 1024 characters long maximum.
   */
  businessActivityDescription: Maybe<Scalars['String']['output']>;
  /** legal form of the company (SAS, SCI, SASU, ...) */
  companyType: Maybe<CompanyType>;
  /**
   * The ultimate beneficiary is defined as the natural person (s) who own or control, directly or indirectly, the reporting company.
   *
   * The ultimate beneficiary is :
   * - either the natural person (s) who hold, directly or indirectly, more than 25% of the capital or the rights of vote of the reporting company;
   * - either the natural person (s) who exercise, by other means, a power of control of the company;
   */
  individualUltimateBeneficialOwners: Maybe<Array<IndividualUltimateBeneficialOwner>>;
  /** Is company registered at RCS in its country */
  isRegistered: Maybe<Scalars['Boolean']['output']>;
  /** Legal representative personal address */
  legalRepresentativePersonalAddress: Maybe<AddressInformation>;
  /** estimated monthly payment volume (euro) */
  monthlyPaymentVolume: Maybe<MonthlyPaymentVolume>;
  /** Name of the company. */
  name: Maybe<Scalars['String']['output']>;
  /**
   * Registration number of the company (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber: Maybe<Scalars['String']['output']>;
  /** residency address of the head office (Must be in a European country) */
  residencyAddress: Maybe<AddressInfo>;
  /** Tax Identification Number */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Account holder type (always Company for type OnboardingCompanyAccountHolderInfo) */
  type: AccountHolderType;
  /** Type of representation (legal representative or power of attorney) */
  typeOfRepresentation: Maybe<TypeOfRepresentation>;
  /** Unique number that identifies a taxable person (business) or non-taxable legal entity that is registered for VAT */
  vatNumber: Maybe<Scalars['String']['output']>;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type OnboardingConnection = Connection & {
  __typename?: 'OnboardingConnection';
  /** OnboardingEdge list */
  edges: Array<OnboardingEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type OnboardingEdge = Edge & {
  __typename?: 'OnboardingEdge';
  /** Opaque identifier pointing to this onboarding node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The Onboarding */
  node: Onboarding;
};

/** Filters that can be applied when listing onboardings */
export type OnboardingFiltersInput = {
  /**
   * Search by email
   *
   * @deprecated(reason: "use `search` instead")
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /**
   * Search string to look for
   *
   * Search will be performed in following fields:
   *  - Account holder's first name
   *  - Account holder's last name
   *  - Account holder's company name
   *  - Account holder's ID
   *  - Email
   *  - ID
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by status */
  status?: InputMaybe<Array<OnboardingStatus>>;
  /** Filter by type */
  types?: InputMaybe<Array<AccountHolderType>>;
};

/** StatusInfo when onboarding has been finalized */
export type OnboardingFinalizedStatusInfo = OnboardingStatusInfo & {
  __typename?: 'OnboardingFinalizedStatusInfo';
  status: OnboardingStatus;
};

/** Individual Account Holder Information */
export type OnboardingIndividualAccountHolderInfo = OnboardingAccountHolderInfo & {
  __typename?: 'OnboardingIndividualAccountHolderInfo';
  /** employment status of the individual account holder */
  employmentStatus: Maybe<EmploymentStatus>;
  /** monthly income of the individual account holder */
  monthlyIncome: Maybe<MonthlyIncome>;
  /** residency address of the individual account holder (must be in a European country) */
  residencyAddress: Maybe<AddressInfo>;
  /** Tax Identification Number */
  taxIdentificationNumber: Maybe<Scalars['String']['output']>;
  /** Account holder type (always Individual for type OnboardingIndividualAccountHolderInfo) */
  type: AccountHolderType;
};

export type OnboardingInfo = {
  __typename?: 'OnboardingInfo';
  /** Country of the account that will be created at the end of the onboarding process */
  accountCountry: Maybe<AccountCountry>;
  /** Account name */
  accountName: Maybe<Scalars['String']['output']>;
  /** email */
  email: Maybe<Scalars['String']['output']>;
  /** Unique identifier of an onboarding */
  id: Scalars['String']['output'];
  /** Information regarding the Individual or the company to onboard */
  info: OnboardingAccountHolderInfo;
  /**
   * Language of the onboarding process.
   * - Accepted languages: `["en", "fr", "nl", "de", "it", "es", "pt", "fi"]`
   */
  language: Maybe<Scalars['String']['output']>;
  /** List of accepted identification level for the legal representative */
  legalRepresentativeAcceptedIdentificationLevels: Array<Maybe<IdentificationLevel>>;
  /** Recommended identification level for the legal representative */
  legalRepresentativeRecommendedIdentificationLevel: IdentificationLevel;
  /** Extra parameters provided by partner */
  oAuthRedirectParameters: Maybe<OAuthRedirectParameters>;
  /** Current computed state of onboarding */
  onboardingState: Maybe<OnboardingState>;
  /** Redirect the legal representative of a new account holder to this URL to start the onboarding process */
  onboardingUrl: Scalars['String']['output'];
  /** Project infos you set in the dashboard */
  projectInfo: Maybe<ProjectInfo>;
  /** URL used to redirect the user at the end of the onboarding process. If `null` the user is redirected to the white label web banking. */
  redirectUrl: Scalars['String']['output'];
  /** Status (valid/invalid/finalized) and details of errors on fields */
  statusInfo: OnboardingStatusInfo;
  /** Supporting document collection related to onboarding. */
  supportingDocumentCollection: SupportingDocumentCollection;
  /** Swan TCU URL */
  tcuUrl: Scalars['String']['output'];
  /** Verification Flow */
  verificationFlow: VerificationFlow;
};

/** StatusInfo when onboarding has still at least one incorrect field */
export type OnboardingInvalidStatusInfo = OnboardingStatusInfo & {
  __typename?: 'OnboardingInvalidStatusInfo';
  errors: Array<ValidationError>;
  status: OnboardingStatus;
};

/** Rejection returned if an onboarding is not completed */
export type OnboardingNotCompletedRejection = Rejection & {
  __typename?: 'OnboardingNotCompletedRejection';
  message: Scalars['String']['output'];
  onboarding: Onboarding;
  /** @deprecated use `onboarding.id` instead */
  onboardingId: Scalars['String']['output'];
};

/** Field we can use when ordering that can be applied when listing onboardings */
export type OnboardingOrderByFieldInput =
  | 'createdAt'
  | 'finalizedAt'
  | 'updatedAt';

/** Order that can be applied when listing onboardings */
export type OnboardingOrderByInput = {
  direction?: InputMaybe<OrderByDirection>;
  field?: InputMaybe<OnboardingOrderByFieldInput>;
};

/** Onboarding process state */
export type OnboardingState =
  /** When the onboarding is finalized and the account holder is created */
  | 'Completed'
  /** When the onboarding is in progress */
  | 'Ongoing';

/** Possible values for onboarding status */
export type OnboardingStatus =
  /** When the onboarding is finalized */
  | 'Finalized'
  /** when the onboarding is invalid. Final status */
  | 'Invalid'
  /** When the onboarding is valid. Final status */
  | 'Valid';

/** Object containing details about onboarding status (valid/invalid and why it is invalid/already finalized) */
export type OnboardingStatusInfo = {
  /** Current onboarding status. Onboarding can only be finalized if status is "valid" */
  status: OnboardingStatus;
};

/** StatusInfo when onboarding has all onboarding fields are correctly filled */
export type OnboardingValidStatusInfo = OnboardingStatusInfo & {
  __typename?: 'OnboardingValidStatusInfo';
  status: OnboardingStatus;
};

export type OrderByDirection =
  | 'Asc'
  | 'Desc';

/** Implements PageInfo from the Relay Connections Specification - information about a page in the pagination mechanism */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Opaque identifier pointing to the last node of the page */
  endCursor: Maybe<Scalars['String']['output']>;
  /** Indicates whether more edges exist following this page */
  hasNextPage: Maybe<Scalars['Boolean']['output']>;
  /** Indicates whether more edges exist preceding this page */
  hasPreviousPage: Maybe<Scalars['Boolean']['output']>;
  /** Opaque identifier pointing to the first node of the page */
  startCursor: Maybe<Scalars['String']['output']>;
};

/** Input version */
export type PartnerCloseAccountReasonInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  type: PartnerCloseAccountReasonType;
};

/** Specific type for closing account action */
export type PartnerCloseAccountReasonType =
  /** Simple closing request */
  | 'ClosingRequested';

/** Partnership Status Accepted */
export type PartnershipAcceptedStatusInfo = PartnershipStatusInfo & {
  __typename?: 'PartnershipAcceptedStatusInfo';
  /** Accepted date of the partnership for this account */
  acceptedDate: Scalars['DateTime']['output'];
  /** Partnership status (always Accepted for type PartnershipAcceptedStatusInfo) */
  status: PartnershipStatus;
};

/** Partnership Status canceled */
export type PartnershipCanceledStatusInfo = PartnershipStatusInfo & {
  __typename?: 'PartnershipCanceledStatusInfo';
  /** Accepted date of the partnership for this account */
  acceptedDate: Scalars['DateTime']['output'];
  /** Canceled date of the partnership for this account */
  canceledDate: Scalars['DateTime']['output'];
  /** Reason of the cancelation */
  reason: Scalars['String']['output'];
  /** Partnership status (always Canceled for type PartnershipCanceledStatusInfo) */
  status: PartnershipStatus;
};

/** Partnership Status currently cancelling */
export type PartnershipCancelingStatusInfo = PartnershipStatusInfo & {
  __typename?: 'PartnershipCancelingStatusInfo';
  /** Accepted date of the partnership for this account */
  acceptedDate: Scalars['DateTime']['output'];
  /** Canceled date of the partnership for this account */
  canceledAfter: Scalars['DateTime']['output'];
  /** Partnership status (always Canceling for type PartnershipCancelingStatusInfo) */
  status: PartnershipStatus;
};

export type PartnershipStatus =
  /** When the partnership is accepted by the account holder for this account */
  | 'Accepted'
  /** When the partnership was canceled by you or the account holder */
  | 'Canceled'
  /** When you decide to stop the partnership, you have 2 months notice */
  | 'Canceling';

/** Partnership Status information */
export type PartnershipStatusInfo = {
  /** Status of the partnership for this account */
  status: PartnershipStatus;
};

export type Payment = {
  __typename?: 'Payment';
  /** created date */
  createdAt: Scalars['DateTime']['output'];
  /** unique identifier of a payment */
  id: Scalars['ID']['output'];
  /** status information */
  statusInfo: PaymentStatusInfo;
  /** updated date */
  updatedAt: Scalars['DateTime']['output'];
};

export type PaymentAccountType =
  /** When the account holder if the account hasn't met KYC requirements */
  | 'EMoney'
  /** When all KYC requirements are met */
  | 'PaymentService';

/** Payment status consent pending */
export type PaymentConsentPending = PaymentStatusInfo & {
  __typename?: 'PaymentConsentPending';
  /** The consent required to initiate this payment */
  consent: Consent;
  /** status of the payment */
  status: PaymentStatus;
};

export type PaymentDirectDebitMandate = {
  /** Unique identifier of the Direct Debit Payment Mandate */
  id: Scalars['ID']['output'];
};

/** Payment status initiated */
export type PaymentInitiated = PaymentStatusInfo & {
  __typename?: 'PaymentInitiated';
  /** status of the payment */
  status: PaymentStatus;
};

/** Payment Level of the account */
export type PaymentLevel =
  /** When the account is limited to 0€ within 30 days and with no IBAN */
  | 'Limited'
  /** When the account holder is fully verified and then the account is unlimited with an IBAN */
  | 'Unlimited';

export type PaymentMandate = {
  /** Unique identifier of the Payment Mandate */
  id: Scalars['ID']['output'];
};

export type PaymentMandateCanceledReason =
  /** When the Payment Mandate is expired */
  | 'MandateExpired'
  /** When the user requested to cancel the Payment Mandate */
  | 'RequestedByUser';

/** Payment Mandate Canceled status information */
export type PaymentMandateCanceledStatusInfo = PaymentMandateStatusInfo & {
  __typename?: 'PaymentMandateCanceledStatusInfo';
  /** Reason behind the Payment Mandate Canceled status */
  reason: PaymentMandateCanceledReason;
  /** Payment Mandate status (always Canceled for type PaymentMandateCanceledStatusInfo). */
  status: PaymentMandateStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type PaymentMandateConnection = Connection & {
  __typename?: 'PaymentMandateConnection';
  /** PaymentMandateEdge list */
  edges: Array<PaymentMandateEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of elements in the list */
  totalCount: Scalars['Int']['output'];
};

/** Payment Mandate Consent Pending status information */
export type PaymentMandateConsentPendingStatusInfo = PaymentMandateStatusInfo & {
  __typename?: 'PaymentMandateConsentPendingStatusInfo';
  /** Consent information required to enable the concerned Payment Mandate */
  consent: Consent;
  /** Payment Mandate status (always Enabled for type PaymentMandateEnableedStatusInfo). */
  status: PaymentMandateStatus;
};

export type PaymentMandateCreditor = {
  /** Creditor address */
  address: Address;
  /** Creditor UUID */
  id: Scalars['ID']['output'];
  /** Creditor name */
  name: Scalars['String']['output'];
};

export type PaymentMandateDebtor = {
  /** Debtor country */
  country: Scalars['CCA3']['output'];
  /** Debtor e-mail */
  email: Maybe<Scalars['String']['output']>;
  /** Debtor name */
  name: Scalars['String']['output'];
};

/** Implements the Relay Edge interface */
export type PaymentMandateEdge = Edge & {
  __typename?: 'PaymentMandateEdge';
  /** Opaque identifier pointing to this onboarding node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The payment mandate */
  node: PaymentMandate;
};

/** Payment Mandate Enabled status information */
export type PaymentMandateEnabledStatusInfo = PaymentMandateStatusInfo & {
  __typename?: 'PaymentMandateEnabledStatusInfo';
  /** Payment Mandate status (always Enabled for type PaymentMandateEnabledStatusInfo). */
  status: PaymentMandateStatus;
};

/** Rejection returned when a payment mandate reference is already for a creditor */
export type PaymentMandateReferenceAlreadyUsedRejection = Rejection & {
  __typename?: 'PaymentMandateReferenceAlreadyUsedRejection';
  message: Scalars['String']['output'];
};

/** Payment Mandate Rejected status information */
export type PaymentMandateRejectedStatusInfo = PaymentMandateStatusInfo & {
  __typename?: 'PaymentMandateRejectedStatusInfo';
  /** Payment Mandate status (always Rejected for type PaymentMandateSuspendedStatusInfo). */
  status: PaymentMandateStatus;
};

export type PaymentMandateScheme =
  /** Card Cartes Bancaires */
  | 'CardCartesBancaires'
  /** Card Mastercard */
  | 'CardMastercard'
  /** Card Visa */
  | 'CardVisa'
  /** Internal Direct Debit B2B */
  | 'InternalDirectDebitB2b'
  /** Internal Direct Debit Standard */
  | 'InternalDirectDebitStandard'
  /** SEPA Direct Debit B2B */
  | 'SepaDirectDebitB2b'
  /** SEPA Direct Debit Core */
  | 'SepaDirectDebitCore';

/** Payment Mandate Sequence */
export type PaymentMandateSequence =
  /** The Payment Mandate can be used only once */
  | 'OneOff'
  /** The Payment Mandate can be used for recurrent collections */
  | 'Recurrent';

/** Payment Mandate status */
export type PaymentMandateStatus =
  | 'Canceled'
  | 'ConsentPending'
  | 'Enabled'
  | 'Rejected';

/** Payment Mandate status information */
export type PaymentMandateStatusInfo = {
  /** Status of the payment mandate. */
  status: PaymentMandateStatus;
};

/** Rejection returned when a payment method is not compatible for the requested mutation */
export type PaymentMethodNotCompatibleRejection = Rejection & {
  __typename?: 'PaymentMethodNotCompatibleRejection';
  message: Scalars['String']['output'];
};

/** Payment status rejected */
export type PaymentRejected = PaymentStatusInfo & {
  __typename?: 'PaymentRejected';
  /** rejected reason */
  reason: Scalars['String']['output'];
  /** status of the payment */
  status: PaymentStatus;
};

/** Payment status */
export type PaymentStatus =
  /** when a consent is pending before initiating the payment */
  | 'ConsentPending'
  /** when the payment has been initiated */
  | 'Initiated'
  /** when the payment has been rejected */
  | 'Rejected';

/** Payment Status Information */
export type PaymentStatusInfo = {
  /** status of the payment */
  status: PaymentStatus;
};

/** Pending Digital Card used for ApplePay or GooglePay */
export type PendingDigitalCard = DigitalCard & {
  __typename?: 'PendingDigitalCard';
  /** The card contract ID */
  cardContractId: Scalars['ID']['output'];
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of a digital card */
  id: Scalars['ID']['output'];
  /**
   * Data to provide to the wallet during InApp Provisioning
   *
   * Signature Data is mandatory for ApplePay
   *
   * This data is only available for a digital card in
   * - status: Pending
   * - type: InApp
   */
  inAppProvisioningData: Maybe<InAppProvisioningData>;
  /** The project ID */
  projectId: Scalars['ID']['output'];
  /**
   * Digital Card status information
   *
   * In this type the status will be either ConsentPending or Pending
   */
  statusInfo: PendingDigitalCardStatusInfo;
  /** The type of digitalization that created this digital card. */
  type: DigitalizationType;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
  /** Wallet Provider (ApplePay, GooglePay ...) */
  walletProvider: WalletProvider;
};


/** Pending Digital Card used for ApplePay or GooglePay */
export type PendingDigitalCardInAppProvisioningDataArgs = {
  signatureData: InputMaybe<SignatureData>;
};

/** Pending Digital Card Status */
export type PendingDigitalCardStatus =
  /** when the digital card is waiting for the user to finish his consent */
  | 'ConsentPending'
  /**
   * when the creation of a digital card is declined
   *
   * this is a final state
   */
  | 'Declined'
  /** when the digital card is pending the end of the digitalization process */
  | 'Pending';

/** Pending Digital Card Status Information */
export type PendingDigitalCardStatusInfo = {
  /** Status of the digital card. */
  status: PendingDigitalCardStatus;
};

/** PendingMerchantPaymentMethodStatusInfo */
export type PendingMerchantPaymentMethodStatusInfo = MerchantPaymentMethodStatusInfo & {
  __typename?: 'PendingMerchantPaymentMethodStatusInfo';
  status: MerchantPaymentMethodStatus;
};

/** PendingReviewMerchantProfileStatusInfo */
export type PendingReviewMerchantProfileStatusInfo = MerchantProfileStatusInfo & {
  __typename?: 'PendingReviewMerchantProfileStatusInfo';
  status: MerchantProfileStatus;
};

export type PermissionCannotBeGrantedRejection = Rejection & {
  __typename?: 'PermissionCannotBeGrantedRejection';
  message: Scalars['String']['output'];
};

/** Physical Card */
export type PhysicalCard = {
  __typename?: 'PhysicalCard';
  /** Masked Card Number */
  cardMaskedNumber: Scalars['String']['output'];
  /** Custom Options */
  customOptions: PhysicalCardCustomOptions;
  /** Physical Card expiration date  with MM/YY string format */
  expiryDate: Maybe<Scalars['String']['output']>;
  /** Unique identifier present on physical card, such identifier is null if the status is ToActivate or Canceled. This identifier is updated when a renewed card is activated */
  identifier: Maybe<Scalars['String']['output']>;
  /** Offline Spending limit defined by Swan */
  offlineSpendingLimit: Amount;
  /** every previous Physical Card information */
  previousPhysicalCards: Array<BasicPhysicalCardInfo>;
  /** Physical Card status information */
  statusInfo: PhysicalCardStatusInfo;
};

/** Physical Card Activated Status Information */
export type PhysicalCardActivatedStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardActivatedStatusInfo';
  /** Physical Card status (always Activated for type PhysicalCardEnabledStatusInfo). */
  status: PhysicalCardStatus;
};

/** Physical Card Canceled Status Information */
export type PhysicalCardCanceledStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardCanceledStatusInfo';
  /** Reason why the card is canceled. */
  reason: Scalars['String']['output'];
  /** Physical Card status (always Canceled for type PhysicalCardCanceledStatusInfo). */
  status: PhysicalCardStatus;
};

/** Physical Card Canceling Status Information */
export type PhysicalCardCancelingStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardCancelingStatusInfo';
  /** Reason why the card is canceled. */
  reason: Scalars['String']['output'];
  /** Physical Card status (always Canceling for type PhysicalCardCancelingStatusInfo). */
  status: PhysicalCardStatus;
};

/** when the user has to authorize production of the physical card */
export type PhysicalCardConsentPendingStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardConsentPendingStatusInfo';
  /** The consent required to authorize production of the physical card */
  consent: Consent;
  /** Physical Card status (always ConsentPending for type PhysicalCardConsentPendingStatusInfo) */
  status: PhysicalCardStatus;
};

/** Custom options for physical card. */
export type PhysicalCardCustomOptions = {
  __typename?: 'PhysicalCardCustomOptions';
  /** Additional line embossed on the card. */
  additionalPrintedLine: Maybe<Scalars['String']['output']>;
  /** Custom Card Holder Name */
  customCardHolderName: Maybe<Scalars['String']['output']>;
};

/** Rejection returned when the Physical Card does not exist */
export type PhysicalCardNotFoundRejection = Rejection & {
  __typename?: 'PhysicalCardNotFoundRejection';
  identifier: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** when the physical card is in the process of being ready to use */
export type PhysicalCardProcessingStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardProcessingStatusInfo';
  /** Physical card status (always Processing for type PhysicalCardProcessingStatusInfo) */
  status: PhysicalCardStatus;
};

/** Physical Card Renewed Status Information */
export type PhysicalCardRenewedStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardRenewedStatusInfo';
  /** address to deliver the physical card */
  address: Address;
  /** Estimated delivery date */
  estimatedDeliveryDate: Maybe<Scalars['DateTime']['output']>;
  /** `true` if PIN Code is available. */
  isPINReady: Scalars['Boolean']['output'];
  /** New physical Card info */
  newPhysicalCard: BasicPhysicalCardInfo;
  /** Name of the shipping provider (Ex: LaPoste, DHL ...) */
  shippingProvider: Maybe<Scalars['String']['output']>;
  /** Physical Card status (always Renewed for type PhysicalCardRenewedStatusInfo). */
  status: PhysicalCardStatus;
  /** Shipping tracking number */
  trackingNumber: Maybe<Scalars['String']['output']>;
};

/** Physical Card Status */
export type PhysicalCardStatus =
  /** Physical card is activated and can be used */
  | 'Activated'
  /** Physical card is canceled, can’t be used, and can’t be restored */
  | 'Canceled'
  /** Physical card is in the process of being canceled; card can’t be used or restored */
  | 'Canceling'
  /** Consent to authorize physical card production is pending */
  | 'ConsentPending'
  /** Physical card is in processing and can’t be used yet */
  | 'Processing'
  /** Physical card is renewed but hasn’t made a transaction since renewal */
  | 'Renewed'
  /** Physical card is suspended and can’t be used */
  | 'Suspended'
  /** Physical card needs to be activated by cardholder */
  | 'ToActivate'
  /** Physical card is in the process of being renewed */
  | 'ToRenew';

/** Physical Card Status Information */
export type PhysicalCardStatusInfo = {
  /** Status of the physical card. */
  status: PhysicalCardStatus;
};

/** Physical Card Suspended Status Information */
export type PhysicalCardSuspendedStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardSuspendedStatusInfo';
  /** Reason why the card is suspended. */
  reason: Scalars['String']['output'];
  /** Physical Card status (always Suspended for type PhysicalCardSuspendedStatusInfo). */
  status: PhysicalCardStatus;
};

/** Physical Card To Activate Status Information */
export type PhysicalCardToActivateStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardToActivateStatusInfo';
  /** address to deliver the physical card */
  address: Address;
  /** Estimated delivery date */
  estimatedDeliveryDate: Maybe<Scalars['DateTime']['output']>;
  /** `true` if PIN Code is available. */
  isPINReady: Scalars['Boolean']['output'];
  /** Name of the shipping provider (Ex: LaPoste, DHL ...) */
  shippingProvider: Maybe<Scalars['String']['output']>;
  /** Physical Card status (always ToActivate for type PhysicalCardToActivateStatusInfo). */
  status: PhysicalCardStatus;
  /** Shipping tracking number */
  trackingNumber: Maybe<Scalars['String']['output']>;
};

/** when the physical card is in the process of being renewed */
export type PhysicalCardToRenewStatusInfo = PhysicalCardStatusInfo & {
  __typename?: 'PhysicalCardToRenewStatusInfo';
  /** registered address to deliver the new physical card */
  address: Address;
  /** Physical card status (always ToRenew for type PhysicalCardToRenewStatusInfo) */
  status: PhysicalCardStatus;
};

/** Rejection returned when the Physical Card is not the expected status */
export type PhysicalCardWrongStatusRejection = Rejection & {
  __typename?: 'PhysicalCardWrongStatusRejection';
  currentStatus: PhysicalCardStatus;
  expectedStatus: PhysicalCardStatus;
  identifier: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type PreProvisioningSuvCardSettings = {
  __typename?: 'PreProvisioningSUVCardSettings';
  ownerProvisioningSUVCards: Maybe<Scalars['ID']['output']>;
  preProvisioningSUVCards: Scalars['Boolean']['output'];
  preProvisioningSUVCardsAvailablePercentage: Scalars['Float']['output'];
  preProvisioningSUVNumberOfCards: Scalars['Int']['output'];
};

export type PreferredNotificationChannel =
  /** Use In-App notification */
  | 'App'
  /** Use Swan SMS */
  | 'Sms';

/** Type of product sold. Gifts and donations can be club subscription or collection of donations (for associations), tips collection, contributions for local authorities */
export type ProductType =
  | 'GiftsAndDonations'
  | 'Goods'
  | 'Services'
  | 'VirtualGoods';

export type ProjectCardDesigns = {
  __typename?: 'ProjectCardDesigns';
  /** Project card product designs */
  cardDesigns: Array<CardProductDesign>;
  /** Unique identifier of a project */
  id: Scalars['ID']['output'];
  /** Visual Id from the issuing card processor (Monext) */
  issuingProcessorVisualId: Maybe<Scalars['String']['output']>;
  /** Project name */
  name: Maybe<Scalars['String']['output']>;
  /** Project's pre provisioning suv card settings */
  preProvisioningSUVCardSettings: Maybe<PreProvisioningSuvCardSettings>;
  /** Specific card product for companies */
  specificCardProductCodeForCompanies: Maybe<Scalars['String']['output']>;
};

export type ProjectCardSettings = {
  __typename?: 'ProjectCardSettings';
  /** Project's card settings */
  cardSettings: Array<CardSettings>;
  /** Unique identifier of a project */
  id: Scalars['ID']['output'];
  /** Visual Id from the issuing card processor (Monext) */
  issuingProcessorVisualId: Maybe<Scalars['String']['output']>;
  /** Project name */
  name: Maybe<Scalars['String']['output']>;
  /** Project's pre provisioning suv card settings */
  preProvisioningSUVCardSettings: Maybe<PreProvisioningSuvCardSettings>;
  /** Specific card product for companies */
  specificCardProductCodeForCompanies: Maybe<Scalars['String']['output']>;
};

/** Project Card Settings Background Type */
export type ProjectCardSettingsBackgroundType =
  /** when Card setting background is black */
  | 'Black'
  /** when Card setting background is customized */
  | 'Custom'
  /** when Card setting background is light */
  | 'Silver';

/** Card Status */
export type ProjectCardStatus =
  /** when project's card settings are Disabled */
  | 'Disabled'
  /** when project's card settings are Enabled */
  | 'Enabled'
  /** when project's card settings are Initiated */
  | 'Initiated'
  /** when project's card settings are Rejected */
  | 'Rejected'
  /** when project's card settings are Suspended */
  | 'Suspended'
  /** when project's card settings are ToReview */
  | 'ToReview';

export type ProjectForbiddenRejection = Rejection & {
  __typename?: 'ProjectForbiddenRejection';
  message: Scalars['String']['output'];
};

/** Public information of a `Project` */
export type ProjectInfo = {
  __typename?: 'ProjectInfo';
  B2BMembershipIDVerification: Maybe<Scalars['Boolean']['output']>;
  /** Your accent color, used in white label interfaces. Most of the time for call to actions */
  accentColor: Maybe<Scalars['String']['output']>;
  /**
   * the currently active card settings
   * @deprecated Use cardProduct.cardDesigns instead
   */
  activeCardSettings: Maybe<CardSettings>;
  /** Flag that determines if desktop authentication is enabled for this project */
  allowsDesktopAuthentication: Scalars['Boolean']['output'];
  /** The card products associated with this project. */
  cardProducts: Maybe<Array<CardProduct>>;
  /** Your custom subdomain used in consents */
  customConsentSubdomain: Maybe<Scalars['String']['output']>;
  /** Unique identifier of the project */
  id: Scalars['ID']['output'];
  /** URL of your logo */
  logoUri: Maybe<Scalars['String']['output']>;
  /** Your project name displayed in white label interfaces and in the terms and conditions */
  name: Scalars['String']['output'];
  /** Your OAuth client id */
  oAuthClientId: Maybe<Scalars['String']['output']>;
  /** The related project settings */
  projectSettingsId: Scalars['ID']['output'];
  /** Project status */
  status: ProjectStatus;
  /** Unique id of your current Terms and Conditions of Use */
  tcuDocumentId: Scalars['String']['output'];
  /** URL to your Terms and Conditions of Use document depending on the provided language */
  tcuDocumentUri: Scalars['String']['output'];
  /** The type of your project */
  type: ProjectType;
  /** Web banking settings */
  webBankingSettings: Maybe<WebBankingSettings>;
};


/** Public information of a `Project` */
export type ProjectInfoTcuDocumentUriArgs = {
  language: Scalars['String']['input'];
};

export type ProjectInvalidStatusRejection = Rejection & {
  __typename?: 'ProjectInvalidStatusRejection';
  message: Scalars['String']['output'];
};

export type ProjectNotFound = Rejection & {
  __typename?: 'ProjectNotFound';
  message: Scalars['String']['output'];
};

/** Rejection returned when the project is not found */
export type ProjectNotFoundRejection = Rejection & {
  __typename?: 'ProjectNotFoundRejection';
  message: Scalars['String']['output'];
};

export type ProjectSettingsForbiddenError = Rejection & {
  __typename?: 'ProjectSettingsForbiddenError';
  message: Scalars['String']['output'];
};

export type ProjectSettingsNotFound = Rejection & {
  __typename?: 'ProjectSettingsNotFound';
  message: Scalars['String']['output'];
};

export type ProjectSettingsStatusNotReachable = Rejection & {
  __typename?: 'ProjectSettingsStatusNotReachable';
  message: Scalars['String']['output'];
};

export type ProjectStatus =
  | 'BetaLiveAccess'
  | 'Disabled'
  | 'Enabled'
  | 'FullLiveAccess'
  | 'Initiated'
  | 'LimitedLiveAccess'
  | 'MeetingScheduled'
  | 'PendingCompliance'
  | 'PendingLiveReview'
  | 'Rejected'
  | 'Suspended'
  | 'ToReview';

export type ProjectType =
  | 'COMPANY'
  | 'COMPANY_AND_CUSTOMERS'
  | 'Company'
  | 'CompanyAndCustomers'
  | 'INDIVIDUAL'
  | 'Individual';

/** Rejection returned when the public onboarding is disabled */
export type PublicOnboardingDisabledRejection = Rejection & {
  __typename?: 'PublicOnboardingDisabledRejection';
  message: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  cardInfos: Maybe<CardInfos>;
  cardPINInfos: Maybe<CardPinInfos>;
  /** Fetch company info (name, beneficiaries...) by Siren number */
  companyInfoBySiren: CompanyInfoBySirenPayload;
  /** Fetch company info (name, beneficiaries...) by Company Ref and Headquarter Country */
  companyUboByCompanyRefAndHeadquarterCountry: CompanyUboByCompanyRefAndHeadquarterCountryPayload;
  /** Return a merchant payment link by id */
  merchantPaymentLink: Maybe<MerchantPaymentLink>;
  /** Return the list of CCA3 non-EEA countries */
  nonEEACountries: Array<Scalars['CCA3']['output']>;
  onboardingInfo: Maybe<OnboardingInfo>;
  projectInfoById: ProjectInfo;
  /** Returns a supporting document collection from its id. */
  supportingDocumentCollection: Maybe<SupportingDocumentCollection>;
};


export type QueryCardInfosArgs = {
  input: CardInfosInput;
};


export type QueryCardPinInfosArgs = {
  input: CardPinInfosInput;
};


export type QueryCompanyInfoBySirenArgs = {
  input: CompanyInfoBySirenInput;
};


export type QueryCompanyUboByCompanyRefAndHeadquarterCountryArgs = {
  input: CompanyUboByCompanyRefAndHeadquarterCountryInput;
};


export type QueryMerchantPaymentLinkArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOnboardingInfoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectInfoByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySupportingDocumentCollectionArgs = {
  id: Scalars['ID']['input'];
};

/** Define a reason with a message */
export type Reason = {
  message: Maybe<Scalars['String']['output']>;
};

/** Input version */
export type ReasonInput = {
  message?: InputMaybe<Scalars['String']['input']>;
};

/** RejectedMerchantPaymentMethodStatusInfo */
export type RejectedMerchantPaymentMethodStatusInfo = MerchantPaymentMethodStatusInfo & {
  __typename?: 'RejectedMerchantPaymentMethodStatusInfo';
  /** Merchant Payment Method rejected date */
  rejectedAt: Scalars['Date']['output'];
  status: MerchantPaymentMethodStatus;
};

/** RejectedMerchantProfileStatusInfo */
export type RejectedMerchantProfileStatusInfo = MerchantProfileStatusInfo & {
  __typename?: 'RejectedMerchantProfileStatusInfo';
  rejectedAt: Scalars['Date']['output'];
  status: MerchantProfileStatus;
};

export type Rejection = {
  message: Scalars['String']['output'];
};

/** Request Update Merchant Profile */
export type RequestMerchantProfileUpdate = {
  __typename?: 'RequestMerchantProfileUpdate';
  /** created date */
  createdAt: Scalars['DateTime']['output'];
  /** expected average basket value. */
  expectedAverageBasket: Amount;
  /** Expected annual activity volumes for all payment method */
  expectedMonthlyPaymentVolume: Amount;
  /** The Request ID */
  id: Scalars['ID']['output'];
  /** Url of the merchant's logo */
  merchantLogoUrl: Maybe<Scalars['String']['output']>;
  /** Business name of the merchant, i.e. name that will be displayed on debtors' bank statements */
  merchantName: Scalars['String']['output'];
  /** The Merchant Profile ID to update */
  merchantProfileId: Scalars['ID']['output'];
  /** Url of the merchant's website */
  merchantWebsite: Maybe<Scalars['String']['output']>;
  /** Type of product sold. List of value: Goods, Services, VirtualGoods, GiftsAndDonations. Gifts and donations can be club subscription or collection of donations (for associations), tips collection, contributions for local authorities */
  productType: ProductType;
  /** The status of the request */
  status: RequestMerchantProfileUpdateStatus;
  /** updated date */
  updatedAt: Scalars['DateTime']['output'];
};

/** Request Merchant Profile Update Statuses */
export type RequestMerchantProfileUpdateStatus =
  /** A Request that has been canceled by the user */
  | 'Canceled'
  /** A Request that has already been approved */
  | 'Enabled'
  /** A Request is created in the PendingReview status */
  | 'PendingReview'
  /** A Request that has already been rejected */
  | 'Rejected';

export type RequestSupportingDocumentCollectionReviewInput = {
  /** Id of the supporting document collection to review. */
  supportingDocumentCollectionId: Scalars['ID']['input'];
};

export type RequestSupportingDocumentCollectionReviewPayload = ForbiddenRejection | RequestSupportingDocumentCollectionReviewSuccessPayload | SupportingDocumentCollectionNotFoundRejection | SupportingDocumentCollectionStatusNotAllowedRejection | ValidationRejection;

export type RequestSupportingDocumentCollectionReviewSuccessPayload = {
  __typename?: 'RequestSupportingDocumentCollectionReviewSuccessPayload';
  supportingDocumentCollection: SupportingDocumentCollection;
};

export type ResidencyAddressInput = {
  /** Address line 1. Length must be from 0 to 255 characters */
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  /** AddressLine2. Length must be from 0 to 255 characters */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** City. Length must be from 0 to 100 characters */
  city?: InputMaybe<Scalars['String']['input']>;
  /** Country */
  country?: InputMaybe<Scalars['CCA3']['input']>;
  /** Postal code. Length must be from 0 to 50 characters */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** State of residency. Length must be from 0 to 100 characters */
  state?: InputMaybe<Scalars['String']['input']>;
};

/** Account membership restricted to */
export type RestrictedTo = {
  __typename?: 'RestrictedTo';
  /** birth date */
  birthDate: Maybe<Scalars['Date']['output']>;
  /** first name */
  firstName: Scalars['String']['output'];
  /** last name */
  lastName: Scalars['String']['output'];
  /**
   * phone number
   * We're introducing more flexibility in the process to invite & bind new account members (cf [public roadmap](https://swanio.notion.site/Swan-Public-Roadmap-385e4b2e91b3409786a6c8e885654a22?p=a59db00a478e4faaaefbd901e1ed7ed3&pm=s) on notion).
   * For some use cases, it would be possible to invite an account member without their mobile phone number.
   * Please note that the phone number will remain mandatory at the invitation (despite being optional in the Graph) until the new flow is delivered. It is hidden behind a feature toggle
   */
  phoneNumber: Maybe<Scalars['String']['output']>;
};

/** Rejection returned if the mutation cannot be executed in another context than user */
export type RestrictedToUserRejection = Rejection & {
  __typename?: 'RestrictedToUserRejection';
  message: Scalars['String']['output'];
};

/**
 * Percentage over a number of business days, that is applied to all funds collected to compute a Reserved amount
 * This amount cannot be used over the corresponding business days
 */
export type RollingReserve = {
  __typename?: 'RollingReserve';
  /** Percentage of the funding amount to be reserved */
  percentage: Scalars['Int']['output'];
  /** Number of business days the computed amount is reserved */
  rollingDays: Scalars['Int']['output'];
};

export type SepaPaymentDirectDebitMandate = {
  __typename?: 'SEPAPaymentDirectDebitMandate';
  /** Unique identifier of the SEPA Direct Debit Payment Mandate */
  id: Scalars['ID']['output'];
  /** SEPA Direct Debit Payment Mandate PDF document URL */
  mandateDocumentUrl: Scalars['String']['output'];
};

/** Rejection returned when adding a B2B mandate with an Individual debtor */
export type SchemeWrongRejection = Rejection & {
  __typename?: 'SchemeWrongRejection';
  message: Scalars['String']['output'];
};

/** SepaDirectDebitB2BMerchantPaymentMethod */
export type SepaDirectDebitB2BMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'SepaDirectDebitB2BMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** When the above is false, the value of the Sepa Creditor Identifier used */
  sepaCreditorIdentifier: Maybe<Scalars['String']['output']>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  updateRequest: Maybe<SepaDirectDebitPaymentMethodUpdateRequest>;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Whether this payment method uses the Swan Sepa Creditor Identifier */
  useSwanSepaCreditorIdentifier: Scalars['Boolean']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

/** SepaDirectDebitCoreMerchantPaymentMethod */
export type SepaDirectDebitCoreMerchantPaymentMethod = MerchantPaymentMethod & {
  __typename?: 'SepaDirectDebitCoreMerchantPaymentMethod';
  /** Unique identifier tied to every version of a given Merchant Payment Method */
  id: Scalars['ID']['output'];
  /** Unique identifier for a given merchant Payment Method, identical for every version of a given Merchant Payment Method Type */
  methodId: Scalars['ID']['output'];
  /** Rolling Reserve applied to the Merchant Payment Method */
  rollingReserve: Maybe<RollingReserve>;
  /** When the above is false, the value of the Sepa Creditor Identifier used */
  sepaCreditorIdentifier: Maybe<Scalars['String']['output']>;
  /** Status of the Merchant Payment Method */
  statusInfo: MerchantPaymentMethodStatusInfo;
  /** The Merchant Payment Method Type */
  type: MerchantPaymentMethodType;
  updateRequest: Maybe<SepaDirectDebitPaymentMethodUpdateRequest>;
  /** Date at which the Merchant Payment Method was last updated */
  updatedAt: Scalars['Date']['output'];
  /** Whether this payment method uses the Swan Sepa Creditor Identifier */
  useSwanSepaCreditorIdentifier: Scalars['Boolean']['output'];
  /** Version of the Merchant Payment Method */
  version: Scalars['Int']['output'];
};

export type SepaDirectDebitPaymentMethodUpdateRequest = MerchantPaymentMethodUpdateRequest & {
  __typename?: 'SepaDirectDebitPaymentMethodUpdateRequest';
  id: Scalars['ID']['output'];
  /** Your own SCI - Mandatory if the useSwanCreditorIdentifier is set to false */
  sepaCreditorIdentifier: Maybe<Scalars['String']['output']>;
  /** If `true`, the transaction will be created with the Swan Creditor Identifier */
  useSwanSepaCreditorIdentifier: Scalars['Boolean']['output'];
};

export type SepaPaymentMandateDebtorInput = {
  address: AddressInput;
  /** SEPA Direct Debit Payment Mandate debtor IBAN */
  iban: Scalars['String']['input'];
  /** SEPA Direct Debit Payment Mandate debtor name */
  name: Scalars['String']['input'];
};

/** Signature data used during apple pay inApp provisioning */
export type SignatureData = {
  /** list of apple generated certificates */
  certificates: Array<Certificate>;
  /** nonce */
  nonce: Scalars['String']['input'];
  /** nonce signed by the secure element */
  nonceSignature: Scalars['String']['input'];
};

/** Spending limits */
export type SpendingLimit = {
  __typename?: 'SpendingLimit';
  /** sum of amount of spending authorized during the period */
  amount: Amount;
  /** period concerned */
  period: SpendingLimitPeriod;
  /** type of limit (defined by the Partner, defined by Swan, etc.) */
  type: SpendingLimitType;
};

/** Inputs when editing spending limit configuration */
export type SpendingLimitInput = {
  /** sum of amount of spending authorized during the period */
  amount: AmountInput;
  /** period concerned */
  period: SpendingLimitPeriodInput;
};

/** Available period to compute spending limits */
export type SpendingLimitPeriod =
  | 'Always'
  | 'Daily'
  | 'Monthly'
  | 'Weekly';

/** Available period to compute spending limits */
export type SpendingLimitPeriodInput =
  | 'Always'
  | 'Daily'
  | 'Monthly'
  | 'Weekly';

/** Available type of spending limits */
export type SpendingLimitType =
  /** for the account holder - defined by the partner */
  | 'AccountHolder'
  /** for the partner - defined by Swan */
  | 'Partner';

export type SuccessfulThreeDs = {
  __typename?: 'SuccessfulThreeDs';
  status: ThreeDsStatus;
};

/** Supporting document used for compliance */
export type SupportingDocument = {
  __typename?: 'SupportingDocument';
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of the document */
  id: Scalars['String']['output'];
  /** Supporting document status information */
  statusInfo: SupportingDocumentStatusInfo;
  /** Purpose of supporting document */
  supportingDocumentPurpose: SupportingDocumentPurposeEnum;
  /** Type of supporting Document */
  supportingDocumentType: Maybe<SupportingDocumentType>;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
};

export type SupportingDocumentAccountHolder = {
  __typename?: 'SupportingDocumentAccountHolder';
  id: Maybe<Scalars['ID']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type SupportingDocumentCollectMode =
  | 'API'
  | 'EndCustomer'
  | 'EndCustomerCcPartner'
  | 'Partner';

/**
 * Collection of supporting documents used for compliance
 *
 * Fetching SupportingDocument is restricted to Project access token
 */
export type SupportingDocumentCollection = {
  __typename?: 'SupportingDocumentCollection';
  accountHolder: SupportingDocumentAccountHolder;
  /** Created date */
  createdAt: Scalars['DateTime']['output'];
  /** Unique identifier of the supporting document collection */
  id: Scalars['String']['output'];
  onboarding: SupportingDocumentOnboarding;
  projectInfo: ProjectInfo;
  /** List of required supporting document purposes for this supporting document collection */
  requiredSupportingDocumentPurposes: Array<SupportingDocumentPurpose>;
  /** Status of the supporting document collection */
  statusInfo: SupportingDocumentCollectionStatusInfo;
  /** SupportingDocumentCollection URL to Swan portal */
  supportingDocumentCollectionUrl: Scalars['String']['output'];
  /** List of supported documents contained in the supporting document collection */
  supportingDocuments: Array<Maybe<SupportingDocument>>;
  transaction: SupportingDocumentTransaction;
  type: SupportingDocumentCollectionType;
  /** Updated date */
  updatedAt: Scalars['DateTime']['output'];
};

/** Supporting document collection with Approved status */
export type SupportingDocumentCollectionApprovedStatusInfo = SupportingDocumentCollectionStatusInfo & {
  __typename?: 'SupportingDocumentCollectionApprovedStatusInfo';
  /** Date on which the supporting document collection has been approved */
  approvedAt: Scalars['DateTime']['output'];
  /** When the supporting document collection is approved */
  status: SupportingDocumentCollectionStatus;
};

/** Supporting document collection with Canceled status */
export type SupportingDocumentCollectionCanceledStatusInfo = SupportingDocumentCollectionStatusInfo & {
  __typename?: 'SupportingDocumentCollectionCanceledStatusInfo';
  /** Date on which the supporting document collection has been canceled */
  canceledAt: Scalars['DateTime']['output'];
  /** When the supporting document collection is canceled */
  status: SupportingDocumentCollectionStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type SupportingDocumentCollectionConnection = Connection & {
  __typename?: 'SupportingDocumentCollectionConnection';
  /** SupportingDocumentCollectionEdge list */
  edges: Array<SupportingDocumentCollectionEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type SupportingDocumentCollectionEdge = Edge & {
  __typename?: 'SupportingDocumentCollectionEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The supporting document collection */
  node: SupportingDocumentCollection;
};

/** Filters that can be applied when listing supporting document collections */
export type SupportingDocumentCollectionFilterInput = {
  /** Supporting document collection status we're looking for */
  status?: InputMaybe<Array<SupportingDocumentCollectionStatus>>;
  /** Supporting document collection type/types we're looking for */
  type?: InputMaybe<Array<SupportingDocumentCollectionType>>;
};

/** Rejection returned if the supporting document collection was not found */
export type SupportingDocumentCollectionNotFoundRejection = Rejection & {
  __typename?: 'SupportingDocumentCollectionNotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Supporting document collection with PendingReview status */
export type SupportingDocumentCollectionPendingReviewStatusInfo = SupportingDocumentCollectionStatusInfo & {
  __typename?: 'SupportingDocumentCollectionPendingReviewStatusInfo';
  /** When the supporting document collection is completed and in compliance review */
  status: SupportingDocumentCollectionStatus;
};

/** Supporting document collection with Rejected status */
export type SupportingDocumentCollectionRejectedStatusInfo = SupportingDocumentCollectionStatusInfo & {
  __typename?: 'SupportingDocumentCollectionRejectedStatusInfo';
  /** Date on which the supporting document collection has been rejected */
  rejectedAt: Scalars['DateTime']['output'];
  /** When the supporting document collection is rejected */
  status: SupportingDocumentCollectionStatus;
};

/** Verification status of a supporting document collection */
export type SupportingDocumentCollectionStatus =
  /** When the supporting document collection is approved. Final status */
  | 'Approved'
  /** When the supporting document collection is canceled. Final status */
  | 'Canceled'
  /** When the supporting document collection is completed and in compliance review */
  | 'PendingReview'
  /** When the supporting document collection is rejected. Final status */
  | 'Rejected'
  /** When the supporting document collection is created and on going */
  | 'WaitingForDocument';

/** Rejection returned if supporting document cannot be deleted because its supporting document collection status is not WaitingForDocument */
export type SupportingDocumentCollectionStatusDoesNotAllowDeletionRejection = Rejection & {
  __typename?: 'SupportingDocumentCollectionStatusDoesNotAllowDeletionRejection';
  message: Scalars['String']['output'];
  supportingDocumentCollection: SupportingDocumentCollection;
  supportingDocumentCollectionStatus: SupportingDocumentCollectionStatus;
};

/** Rejection returned if supporting document cannot be updated because its supporting document collection status is not WaitingForDocument */
export type SupportingDocumentCollectionStatusDoesNotAllowUpdateRejection = Rejection & {
  __typename?: 'SupportingDocumentCollectionStatusDoesNotAllowUpdateRejection';
  message: Scalars['String']['output'];
  supportingDocumentCollection: SupportingDocumentCollection;
  supportingDocumentCollectionStatus: SupportingDocumentCollectionStatus;
};

export type SupportingDocumentCollectionStatusInfo = {
  /** Status of the supporting document collection */
  status: SupportingDocumentCollectionStatus;
};

/** Rejection returned if the status transition is not allowed */
export type SupportingDocumentCollectionStatusNotAllowedRejection = Rejection & {
  __typename?: 'SupportingDocumentCollectionStatusNotAllowedRejection';
  message: Scalars['String']['output'];
  newStatus: SupportingDocumentCollectionStatus;
  oldStatus: SupportingDocumentCollectionStatus;
};

export type SupportingDocumentCollectionType =
  | 'AccountHolderVerificationRenewal'
  | 'Onboarding'
  | 'Transaction';

/** Supporting document collection with WaitingForUpload status */
export type SupportingDocumentCollectionWaitingForDocumentStatusInfo = SupportingDocumentCollectionStatusInfo & {
  __typename?: 'SupportingDocumentCollectionWaitingForDocumentStatusInfo';
  /** When the Supporting Document Collection is created */
  status: SupportingDocumentCollectionStatus;
};

export type SupportingDocumentCommunicationLanguageSettings =
  | 'en'
  | 'fr';

/** Rejection returned if the supporting document was not found */
export type SupportingDocumentNotFoundRejection = Rejection & {
  __typename?: 'SupportingDocumentNotFoundRejection';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Supporting document with NotUploaded status. */
export type SupportingDocumentNotUploadedStatusInfo = SupportingDocumentStatusInfo & {
  __typename?: 'SupportingDocumentNotUploadedStatusInfo';
  /** When the document has not been updated on time. */
  status: SupportingDocumentStatus;
};

export type SupportingDocumentOnboarding = {
  __typename?: 'SupportingDocumentOnboarding';
  id: Maybe<Scalars['ID']['output']>;
};

export type SupportingDocumentPostField = {
  __typename?: 'SupportingDocumentPostField';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** Details of a supporting document purpose */
export type SupportingDocumentPurpose = {
  __typename?: 'SupportingDocumentPurpose';
  /** Corresponding supporting document types accepted for this supporting document purpose */
  acceptableSupportingDocumentTypes: Array<SupportingDocumentType>;
  /** Corresponding Supporting Document Purpose Description translation according to accept-language header */
  description: Scalars['String']['output'];
  /** Corresponding Supporting Document Purpose Title translation according to accept-language header */
  label: Scalars['String']['output'];
  /** Technical name of the purpose */
  name: SupportingDocumentPurposeEnum;
};

/** Supporting document purpose */
export type SupportingDocumentPurposeEnum =
  /** Decision of appointment of Administrator */
  | 'AdministratorDecisionOfAppointment'
  /** Proof of association registration */
  | 'AssociationRegistration'
  /** Banking */
  | 'Banking'
  /** Proof of the company creation process */
  | 'CompanyFormationRegistration'
  /** Company Obligations */
  | 'CompanyObligations'
  /** Proof of company registration */
  | 'CompanyRegistration'
  /** Company Treasury */
  | 'CompanyTreasury'
  /** Donation */
  | 'Donation'
  /** Financial Statements */
  | 'FinancialStatements'
  /** Gambling Prize Winnings */
  | 'GamblingPrizeWinnings'
  /** Minutes Of The General Assembly */
  | 'GeneralAssemblyMinutes'
  /** Inheritance */
  | 'Inheritance'
  /** Investment */
  | 'Investment'
  /** Proof of identity of the legal representative */
  | 'LegalRepresentativeProofOfIdentity'
  /** NIF Accreditation Card */
  | 'NIFAccreditationCard'
  /** Other */
  | 'Other'
  /** Politically exposed person declaration */
  | 'PepDeclaration'
  /** Personal Income */
  | 'PersonalIncome'
  /** Personal Savings */
  | 'PersonalSavings'
  /** Signed power of attorney document to give the power to act on behalf. */
  | 'PowerOfAttorney'
  /** Decision of appointment of the President */
  | 'PresidentDecisionOfAppointment'
  /** Proof of company address */
  | 'ProofOfCompanyAddress'
  /** Proof of company income */
  | 'ProofOfCompanyIncome'
  /** Proof of identity */
  | 'ProofOfIdentity'
  /** Proof of individual address */
  | 'ProofOfIndividualAddress'
  /** Proof of individual income */
  | 'ProofOfIndividualIncome'
  /** Proof of origin of funds */
  | 'ProofOfOriginOfFunds'
  /** Real Estate Income */
  | 'RealEstateIncome'
  /** Signed status */
  | 'SignedStatus'
  /** Sworn statement */
  | 'SwornStatement'
  /** Trade */
  | 'Trade'
  /** UBO Declaration */
  | 'UBODeclaration'
  /** Proof of address of the Ultimate Beneficial Owner */
  | 'UltimateBeneficialOwnerProofOfAddress'
  /** Proof of identity of the Ultimate Beneficial Owner */
  | 'UltimateBeneficialOwnerProofOfIdentity';

/** Refused supporting document reason code */
export type SupportingDocumentReasonCode =
  /** The quality of the document is really low. */
  | 'BadDocumentQuality'
  /** The company name in document doesn’t match our records. */
  | 'CompanyNameMismatch'
  /** The document must be dated less than 3 months ago. */
  | 'ExpiredDocument'
  /** Full Document required. */
  | 'FullDocumentRequired'
  /** The beneficiary IBAN on the document we received does not match the information requested for the transaction. */
  | 'IbanMismatch'
  /** The address in document doesn’t match our records. */
  | 'InvalidAddress'
  /** The document is not valid. */
  | 'InvalidDocument'
  /** The name of shareholder is not clearly visible or some fields are not duely completed. */
  | 'InvalidOrMissingData'
  /** The document appears to be inconsistent with the specified transaction. */
  | 'InvalidTransaction'
  /** The document provided is missing essential details required to comprehend the transaction's nature. Please submit an additional supporting document to supplement the initial one. */
  | 'MissingDescription'
  /** Documents are not signed or dated. */
  | 'MissingSignature'
  /** Other */
  | 'Other'
  /** The document must be in color. */
  | 'ProviderColorIdDocumentRequired'
  /** The amount on the document we received does not match the information requested for the transaction. */
  | 'TransactionAmountMismatch'
  /** The date on the document we received does not match the information requested for the transaction. */
  | 'TransactionDateMismatch'
  /** The issuer or beneficiary name on the document we received does not match the information requested for the transaction. */
  | 'TransactionNameMismatch'
  /** Document cannot be accepted for the requested document type. */
  | 'UnacceptableDocument';

/** Supporting document with Refused status */
export type SupportingDocumentRefusedStatusInfo = SupportingDocumentStatusInfo & {
  __typename?: 'SupportingDocumentRefusedStatusInfo';
  /** Original file name */
  filename: Scalars['String']['output'];
  /** Reason why the supporting document has been refused */
  reason: Scalars['String']['output'];
  /** Reason code why the supporting document has been refused */
  reasonCode: SupportingDocumentReasonCode;
  /** Date on which the supporting document collection has been refused */
  refusedAt: Scalars['DateTime']['output'];
  /** When the document has been refused by Swan */
  status: SupportingDocumentStatus;
};

export type SupportingDocumentSettings = {
  __typename?: 'SupportingDocumentSettings';
  collectMode: SupportingDocumentCollectMode;
  communicationLanguage: Maybe<SupportingDocumentCommunicationLanguageSettings>;
  emailContact: Maybe<Scalars['String']['output']>;
};

/** Verification status of a document */
export type SupportingDocumentStatus =
  /** Document has not been uploaded on time. */
  | 'NotUploaded'
  /** Document has been refused by Swan. */
  | 'Refused'
  /** Document has been uploaded but not verified by Swan yet. */
  | 'Uploaded'
  /** Document has been uploaded and verified by Swan. */
  | 'Validated'
  /** Document is not uploaded yet. */
  | 'WaitingForUpload';

/** Rejection returned if supporting document cannot be deleted because of its status */
export type SupportingDocumentStatusDoesNotAllowDeletionRejection = Rejection & {
  __typename?: 'SupportingDocumentStatusDoesNotAllowDeletionRejection';
  message: Scalars['String']['output'];
  status: SupportingDocumentStatus;
  supportingDocument: SupportingDocument;
};

/** Rejection returned if supporting document cannot be updated because of its status */
export type SupportingDocumentStatusDoesNotAllowUpdateRejection = Rejection & {
  __typename?: 'SupportingDocumentStatusDoesNotAllowUpdateRejection';
  message: Scalars['String']['output'];
  status: SupportingDocumentStatus;
  supportingDocument: SupportingDocument;
};

export type SupportingDocumentStatusInfo = {
  /** Status of the supporting document */
  status: SupportingDocumentStatus;
};

/** Rejection returned if the status transition is not allowed */
export type SupportingDocumentStatusNotAllowedRejection = Rejection & {
  __typename?: 'SupportingDocumentStatusNotAllowedRejection';
  message: Scalars['String']['output'];
  newStatus: SupportingDocumentStatus;
  oldStatus: SupportingDocumentStatus;
};

export type SupportingDocumentTransaction = {
  __typename?: 'SupportingDocumentTransaction';
  id: Maybe<Scalars['ID']['output']>;
};

/** Specific type for document */
export type SupportingDocumentType =
  /** Account statement */
  | 'AccountStatement'
  /** Legal document required for company’s formation */
  | 'ArticlesOfIncorporation'
  /** Document with details such as bank name, address, account number and account holder */
  | 'BankAccountDetails'
  /** Bank Statement */
  | 'BankStatement'
  /** By Laws */
  | 'ByLaws'
  /** Share Deposit Certificate */
  | 'CapitalShareDepositCertificate'
  /** Lease agreement in the name of the business or Proof of Individual Address if the company is hosted by one of the legal representative */
  | 'CompanyLeaseAgreement'
  /** Document submitted to your tax bureau at the end of the last business period */
  | 'CorporateIncomeTaxReturn'
  /** Decision of appointment */
  | 'DecisionOfAppointment'
  /** Deed of donation */
  | 'DeedOfDonation'
  /** Deed of sale */
  | 'DeedOfSale'
  /** Deed of succession */
  | 'DeedOfSuccession'
  /** Driving license */
  | 'DrivingLicense'
  /** Financial Statements */
  | 'FinancialStatements'
  /** Home Insurance contract */
  | 'HomeInsurance'
  /** Income Tax return or tax-exemption certificate dating less than 2 years */
  | 'IncomeTaxReturn'
  /** Invoice */
  | 'Invoice'
  /** Association registration proof for french association */
  | 'JOAFFEExtract'
  /** Loan contract */
  | 'LoanContract'
  /** Meeting's minutes */
  | 'MeetingMinutes'
  /** NIF Accreditation Card */
  | 'NIFAccreditationCard'
  /** NationalIdCard */
  | 'NationalIdCard'
  /** Notarial deed */
  | 'NotarialDeed'
  /** Other */
  | 'Other'
  /** Passport */
  | 'Passport'
  /** A pay slip dating less than 3 months */
  | 'PaySlip'
  /** Politically exposed person declaration */
  | 'PepDeclaration'
  /** Telephone Bill issued within the last 3 months */
  | 'PhoneBill'
  /** Signed power of attorney document to give the power to act on behalf */
  | 'PowerOfAttorney'
  /** Commercial registry extract issued within the last 3 months */
  | 'RegisterExtract'
  /** Rental Receipt issued within the last 3 months */
  | 'RentReceipt'
  /** Resident permit */
  | 'ResidentPermit'
  /** Selfie */
  | 'Selfie'
  /** Sworn statement */
  | 'SwornStatement'
  /** Ultimate Beneficial Owner Declaration */
  | 'UBODeclaration'
  /** Water, Electricity or Gas Bill issued within the last 3 months */
  | 'UtilityBill'
  /** Winnings Certificate */
  | 'WinningsCertificate';

export type SupportingDocumentUploadInfo = {
  __typename?: 'SupportingDocumentUploadInfo';
  fields: Array<SupportingDocumentPostField>;
  url: Scalars['String']['output'];
};

/** Rejection returned if the supporting document collection cannot receive supporting documents anymore */
export type SupportingDocumentUploadNotAllowedRejection = Rejection & {
  __typename?: 'SupportingDocumentUploadNotAllowedRejection';
  message: Scalars['String']['output'];
  supportingDocumentCollectionStatus: SupportingDocumentCollectionStatus;
};

/** Supporting document with Uploaded status */
export type SupportingDocumentUploadedStatusInfo = SupportingDocumentStatusInfo & {
  __typename?: 'SupportingDocumentUploadedStatusInfo';
  /** Original file name */
  filename: Scalars['String']['output'];
  /** When the document has been uploaded but not verified by Swan yet */
  status: SupportingDocumentStatus;
};

/** Supporting document with Validated status */
export type SupportingDocumentValidatedStatusInfo = SupportingDocumentStatusInfo & {
  __typename?: 'SupportingDocumentValidatedStatusInfo';
  /** Original file name */
  filename: Scalars['String']['output'];
  /** Reason why the supporting document has been validated */
  reason: Scalars['String']['output'];
  /** When the document has been uploaded and verified by Swan */
  status: SupportingDocumentStatus;
  /** Date on which the supporting document has been validated */
  validatedAt: Scalars['DateTime']['output'];
};

/** Supporting document with WaitingForUpload status */
export type SupportingDocumentWaitingForUploadStatusInfo = SupportingDocumentStatusInfo & {
  __typename?: 'SupportingDocumentWaitingForUploadStatusInfo';
  /** When the document is not uploaded yet */
  status: SupportingDocumentStatus;
  /** Info to upload the document : url and fields to add along file in form (POST) */
  upload: SupportingDocumentUploadInfo;
};

/** Define a reason with a message and a specific type for suspend account action */
export type SuspendAccountReason = Reason & {
  __typename?: 'SuspendAccountReason';
  message: Maybe<Scalars['String']['output']>;
  type: SuspendAccountReasonType;
};

/** Input version */
export type SuspendAccountReasonInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  type: SuspendAccountReasonType;
};

/** Specific type for suspend account action */
export type SuspendAccountReasonType =
  /** Simple suspend request */
  | 'SuspendRequested';

/** SuspendAccountStatusReason */
export type SuspendAccountStatusReason = SuspendAccountReason;

/** SuspendedMerchantPaymentMethodStatusInfo */
export type SuspendedMerchantPaymentMethodStatusInfo = MerchantPaymentMethodStatusInfo & {
  __typename?: 'SuspendedMerchantPaymentMethodStatusInfo';
  status: MerchantPaymentMethodStatus;
  /** Merchant Payment Method suspended date */
  suspendedAt: Scalars['Date']['output'];
};

/** SuspendedMerchantProfileStatusInfo */
export type SuspendedMerchantProfileStatusInfo = MerchantProfileStatusInfo & {
  __typename?: 'SuspendedMerchantProfileStatusInfo';
  status: MerchantProfileStatus;
  suspendedAt: Scalars['Date']['output'];
};

/** The details of the 3DS challenge associated to the payment. */
export type ThreeDs = {
  __typename?: 'ThreeDS';
  /** `true` if a 3DS challenge has been requested from the card holder */
  requested: Scalars['Boolean']['output'];
  /** The status of the 3DS challenge */
  statusInfo: ThreeDsStatusInfo;
};

export type ThreeDsStatus =
  | 'Failed'
  | 'Successful';

export type ThreeDsStatusInfo = {
  status: ThreeDsStatus;
};

/** Individual ultimate beneficial owner title (Mr/Ms) */
export type TitleEnum =
  /** Identified as a man */
  | 'Mr'
  /** Identified as a woman */
  | 'Ms';

/** Rejection returned if too many items are given */
export type TooManyItemsRejection = Rejection & {
  __typename?: 'TooManyItemsRejection';
  message: Scalars['String']['output'];
};

/** Rejection returned if the transaction was not found */
export type TransactionNotFoundRejection = Rejection & {
  __typename?: 'TransactionNotFoundRejection';
  message: Scalars['String']['output'];
  transactionId: Scalars['ID']['output'];
};

/** Quality of the account holder doing the onboarding */
export type TypeOfRepresentation =
  /** The account holder is the legal representative */
  | 'LegalRepresentative'
  /** The account holder has a power of attorney */
  | 'PowerOfAttorney';

export type UboIdentityDocumentDetails = {
  __typename?: 'UBOIdentityDocumentDetails';
  /** Expiry date of the identity document */
  expiryDate: Maybe<Scalars['String']['output']>;
  /** Issue date of the identity document */
  issueDate: Maybe<Scalars['String']['output']>;
  /** Issuing authority of the identity document */
  issuingAuthority: Maybe<Scalars['String']['output']>;
  /** Number of the identity document */
  number: Maybe<Scalars['String']['output']>;
  /** Type of identity document */
  type: Maybe<UboIdentityDocumentType>;
};

export type UboIdentityDocumentDetailsInput = {
  /** Expiry date of the identity document */
  expiryDate?: InputMaybe<Scalars['String']['input']>;
  /** Issue date of the identity document */
  issueDate?: InputMaybe<Scalars['String']['input']>;
  /** Issuing authority of the identity document */
  issuingAuthority?: InputMaybe<Scalars['String']['input']>;
  /** Number of the identity document */
  number?: InputMaybe<Scalars['String']['input']>;
  /** Type of identity document */
  type?: InputMaybe<UboIdentityDocumentType>;
};

export type UboIdentityDocumentType =
  | 'IdCard'
  | 'Passport';

/** Ultimate beneficial Direct Owner company info. */
export type UltimateBeneficialDirectOwnerCompanyInfo = UltimateBeneficialOwnerInfo & {
  __typename?: 'UltimateBeneficialDirectOwnerCompanyInfo';
  /** Ultimate Beneficial Owner Unique Identifier . */
  id: Scalars['ID']['output'];
  /** Name of the company. */
  name: Scalars['String']['output'];
  /** Shares ratio of the parent company. Example: 50 if the share ratio is 50%. */
  parentCompanyShareRatio: Scalars['Float']['output'];
  /**
   * Registration number of the company (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber: Scalars['String']['output'];
  /** Ultimate beneficial Direct Owner Company type. */
  type: UltimateBeneficialOwnerType;
};

/** Ultimate beneficial Direct Owner individual info. */
export type UltimateBeneficialDirectOwnerIndividualInfo = UltimateBeneficialOwnerInfo & {
  __typename?: 'UltimateBeneficialDirectOwnerIndividualInfo';
  /** Birth date. */
  birthDate: Scalars['Date']['output'];
  /** First name. */
  firstName: Scalars['String']['output'];
  /** Ultimate Beneficial Owner Unique Identifier . */
  id: Scalars['ID']['output'];
  /** Last name. */
  lastName: Scalars['String']['output'];
  /** Shares ratio of the parent company. Example: 50 if the share ratio is 50%. */
  parentCompanyShareRatio: Scalars['Float']['output'];
  /** Ultimate beneficial Direct owner Individual type . */
  type: UltimateBeneficialOwnerType;
};

/** Ultimate beneficial owner company info. */
export type UltimateBeneficialIndirectOwnerCompanyInfo = UltimateBeneficialOwnerInfo & {
  __typename?: 'UltimateBeneficialIndirectOwnerCompanyInfo';
  /** Ultimate Beneficial Owner Unique Identifier . */
  id: Scalars['ID']['output'];
  /** Name of the company. */
  name: Scalars['String']['output'];
  /** Unique Reference of the Parent Company. */
  parentCompanyReference: Scalars['String']['output'];
  /** Shares ratio of the parent company. Example: 50 if the share ratio is 50%. */
  parentCompanyShareRatio: Scalars['Float']['output'];
  /**
   * Registration number of the company (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber: Scalars['String']['output'];
  /** Ultimate beneficial Indirect Owner Company type. */
  type: UltimateBeneficialOwnerType;
};

/** Ultimate beneficial Indirect Owner individual info. */
export type UltimateBeneficialIndirectOwnerIndividualInfo = UltimateBeneficialOwnerInfo & {
  __typename?: 'UltimateBeneficialIndirectOwnerIndividualInfo';
  /** Birth date. */
  birthDate: Scalars['Date']['output'];
  /** First name. */
  firstName: Scalars['String']['output'];
  /** Ultimate Beneficial Owner Unique Identifier. */
  id: Scalars['ID']['output'];
  /** Last name. */
  lastName: Scalars['String']['output'];
  /** Unique Reference of the Parent Company. */
  parentCompanyReference: Scalars['String']['output'];
  /** Shares ratio of the parent company. Example: 50 if the share ratio is 50%. */
  parentCompanyShareRatio: Scalars['Float']['output'];
  /** Ultimate beneficial Indirect Owner Individual type . */
  type: UltimateBeneficialOwnerType;
};

/** The Ultimate Beneficial Owner could be for an Individual or a Company and these can Direct or Indirect */
export type UltimateBeneficialOwnerInfo = {
  /** Ultimate Beneficial Owner Unique Identifier . */
  id: Scalars['ID']['output'];
  /** Shares ratio of the parent company. Example: 50 if the share ratio is 50%. */
  parentCompanyShareRatio: Scalars['Float']['output'];
  /** Ultimate beneficial owner type. */
  type: UltimateBeneficialOwnerType;
};

/** Ultimate Beneficial Owner type. */
export type UltimateBeneficialOwnerType =
  /** Direct Company Owner (Legal person). */
  | 'DirectCompany'
  /** Direct Individual Owner (Natural person) . */
  | 'DirectIndividual'
  /** Indirect Company Owner (Legal person). */
  | 'IndirectCompany'
  /** Indirect Individual Owner (Natural person). */
  | 'IndirectIndividual';

export type UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkInput = {
  /** Payment Mandate ID generated by Swan */
  cardPaymentMandateId: Scalars['ID']['input'];
  /** Payment Link related to the Card Payment Mandate */
  paymentLinkId: Scalars['ID']['input'];
};

export type UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkPayload = ForbiddenRejection | InternalErrorRejection | MerchantCardPaymentDeclinedRejection | NotFoundRejection | UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload | ValidationRejection;

export type UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload = {
  __typename?: 'UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload';
  paymentId: Scalars['ID']['output'];
  redirectUrl: Scalars['URL']['output'];
};

export type UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput = {
  /** Payment Mandate ID generated by Swan */
  mandateId: Scalars['ID']['input'];
  /** Payment Link related to the SEPA Direct Debit Payment Mandate */
  paymentLinkId: Scalars['ID']['input'];
};

/** Union type return by the addSepaDirectDebitPaymentMandate mutation */
export type UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkPayload = ForbiddenRejection | InternalErrorRejection | NotFoundRejection | UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkSuccessPayload | ValidationRejection;

/** Return type in case of a successful response of the initiateMerchantSddPaymentCollectionFromPaymentLink mutation */
export type UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkSuccessPayload = {
  __typename?: 'UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkSuccessPayload';
  merchantPaymentCollection: Payment;
};

export type UnauthenticatedOnboardPublicCompanyAccountHolderInput = {
  /** Country of the account created at the end of onboarding. */
  accountCountry?: InputMaybe<AccountCountry>;
  /** ID of the project. */
  projectId: Scalars['ID']['input'];
  /**
   * Verification Flow.
   * - Default value to 'Upfront' if not provided.
   */
  verificationFlow: VerificationFlow;
};

export type UnauthenticatedOnboardPublicCompanyAccountHolderPayload = PublicOnboardingDisabledRejection | UnauthenticatedOnboardPublicCompanyAccountHolderSuccessPayload | ValidationRejection;

export type UnauthenticatedOnboardPublicCompanyAccountHolderSuccessPayload = {
  __typename?: 'UnauthenticatedOnboardPublicCompanyAccountHolderSuccessPayload';
  onboarding: OnboardingInfo;
};

export type UnauthenticatedOnboardPublicIndividualAccountHolderInput = {
  /** Country of the account created at the end of onboarding. */
  accountCountry?: InputMaybe<AccountCountry>;
  /** ID of the project. */
  projectId: Scalars['ID']['input'];
  /**
   * Verification Flow.
   * - Default value to 'Upfront' if not provided.
   */
  verificationFlow: VerificationFlow;
};

export type UnauthenticatedOnboardPublicIndividualAccountHolderPayload = PublicOnboardingDisabledRejection | UnauthenticatedOnboardPublicIndividualAccountHolderSuccessPayload | ValidationRejection;

export type UnauthenticatedOnboardPublicIndividualAccountHolderSuccessPayload = {
  __typename?: 'UnauthenticatedOnboardPublicIndividualAccountHolderSuccessPayload';
  onboarding: OnboardingInfo;
};

export type UnauthenticatedUpdateCompanyOnboardingInput = {
  /** Country of the account created at the end of onboarding. */
  accountCountry?: InputMaybe<AccountCountry>;
  /**
   * Account name of the company account holder.
   * - Length must be from 0 to 100 characters.
   */
  accountName?: InputMaybe<Scalars['String']['input']>;
  /** Business activity. */
  businessActivity?: InputMaybe<BusinessActivity>;
  /**
   * Description of the business activity.
   * - Length must be from 0 to 1024 characters.
   */
  businessActivityDescription?: InputMaybe<Scalars['String']['input']>;
  /** Type of the company (Association ...). */
  companyType?: InputMaybe<CompanyType>;
  /**
   * Email of the legal representative.
   * - Length must be from 0 to 255 characters.
   * - Valid format (regex):
   *   ```
   *   /^[A-Z0-9_+.-]*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i
   *   ```
   * - Some email providers are not accepted by our system.
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /**
   * The ultimate beneficial owner is defined as the natural person (s) who own or control, directly and/or indirectly, the reporting company.
   *
   * The ultimate beneficial owner is :
   * - either the natural person (s) who hold, directly or indirectly, more than 25% of the capital or the rights of vote of the reporting company;
   * - either the natural person (s) who exercise, by other means, a power of control of the company;
   */
  individualUltimateBeneficialOwners?: InputMaybe<Array<IndividualUltimateBeneficialOwnerInput>>;
  /** Is the company registered with their country's national register (for example, Registre du Commerce et des Sociétés [RCS] in France). */
  isRegistered?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Language of the onboarding process.
   * - Accepted languages: `["en", "fr", "nl", "de", "it", "es", "pt", "fi"]`
   */
  language?: InputMaybe<Scalars['String']['input']>;
  /** Legal representative personal address. */
  legalRepresentativePersonalAddress?: InputMaybe<AddressInformationInput>;
  /** Estimated monthly payment volume (euro). */
  monthlyPaymentVolume?: InputMaybe<MonthlyPaymentVolume>;
  /**
   * Company name.
   * - Length must be from 0 to 100 characters.
   * - Valid format (regex):
   *   ```
   *   /^(?:(?<!http(s)*:\/\/|www\.|&lt;|&gt;)[!-.\/-;A-Z[-`a-zÀ-ÖÙ-öº-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ/]|¿|¡| |'|-|Ά|Ό|=|\?|@|\[|]|\||‘|’)*$/
   *   ```
   */
  name?: InputMaybe<Scalars['String']['input']>;
  /** ID of the onboarding to update. */
  onboardingId: Scalars['ID']['input'];
  /**
   * Registration number of the company (for example, Système d'Identification du Répertoire des ENtreprises [SIREN] in France, ...).
   * - Length must be from 0 to 50 characters.
   */
  registrationNumber?: InputMaybe<Scalars['String']['input']>;
  /**
   * Residency address of the head office.
   * - Must be in a European country.
   */
  residencyAddress?: InputMaybe<ResidencyAddressInput>;
  /**
   *   Tax Identification Number.
   * - Must be from 0 to 16 characters.
   */
  taxIdentificationNumber?: InputMaybe<Scalars['String']['input']>;
  /** Type of representation (legal representative or power of attorney). */
  typeOfRepresentation?: InputMaybe<TypeOfRepresentation>;
  /**
   * VAT number of the company.
   * - (AT)?U[0-9]{8} |                              # Austria
   * - (BE)?0[0-9]{9} |                              # Belgium
   * - (BG)?[0-9]{9,10} |                            # Bulgaria
   * - (CY)?[0-9]{8}L |                              # Cyprus
   * - (CZ)?[0-9]{8,10} |                            # Czech Republic
   * - (DE)?[0-9]{9} |                               # Germany
   * - (DK)?[0-9]{8} |                               # Denmark
   * - (EE)?[0-9]{9} |                               # Estonia
   * - (EL|GR)?[0-9]{9} |                            # Greece
   * - (ES)?[0-9A-Z][0-9]{7}[0-9A-Z] |               # Spain
   * - (FI)?[0-9]{8} |                               # Finland
   * - (FR)?[0-9A-Z]{2}[0-9]{9} |                    # France
   * - (GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3}) | # United Kingdom
   * - (HU)?[0-9]{8} |                               # Hungary
   * - (IE)?[0-9]S[0-9]{5}L |                        # Ireland
   * - (IT)?[0-9]{11} |                              # Italy
   * - (LT)?([0-9]{9}|[0-9]{12}) |                   # Lithuania
   * - (LU)?[0-9]{8} |                               # Luxembourg
   * - (LV)?[0-9]{11} |                              # Latvia
   * - (MT)?[0-9]{8} |                               # Malta
   * - (NL)?[0-9]{9}B[0-9]{2} |                      # Netherlands
   * - (PL)?[0-9]{10} |                              # Poland
   * - (PT)?[0-9]{9} |                               # Portugal
   * - (RO)?[0-9]{2,10} |                            # Romania
   * - (SE)?[0-9]{12} |                              # Sweden
   * - (SI)?[0-9]{8} |                               # Slovenia
   * - (SK)?[0-9]{10}                                # Slovakia
   */
  vatNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UnauthenticatedUpdateCompanyOnboardingPayload = ForbiddenRejection | InternalErrorRejection | UnauthenticatedUpdateCompanyOnboardingSuccessPayload | ValidationRejection;

export type UnauthenticatedUpdateCompanyOnboardingSuccessPayload = {
  __typename?: 'UnauthenticatedUpdateCompanyOnboardingSuccessPayload';
  onboarding: OnboardingInfo;
};

export type UnauthenticatedUpdateIndividualOnboardingInput = {
  /** Country of the account created at the end of onboarding. */
  accountCountry?: InputMaybe<AccountCountry>;
  /**
   * Account name of the individual account holder.
   * - Length must be from 0 to 100 characters.
   */
  accountName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Email of the legal representative.
   * - Length must be from 0 to 255 characters.
   * - Valid format (regex):
   *   ```
   *   /^[A-Z0-9_+.-]*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i
   *   ```
   * - Some email providers are not accepted by our system.
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Employment status of the individual account holder. */
  employmentStatus?: InputMaybe<EmploymentStatus>;
  /**
   * Language of the onboarding process.
   * - Accepted languages: `["en", "fr", "nl", "de", "it", "es", "pt", "fi"]`
   */
  language?: InputMaybe<Scalars['String']['input']>;
  /** Monthly income of the individual account holder (euro). */
  monthlyIncome?: InputMaybe<MonthlyIncome>;
  /** ID of the onboarding to update. */
  onboardingId: Scalars['ID']['input'];
  /**
   * Residency address of the individual account holder.
   * - Must be in a European country.
   */
  residencyAddress?: InputMaybe<ResidencyAddressInput>;
  /**
   *   Tax Identification Number.
   * - Must be from 0 to 16 characters.
   */
  taxIdentificationNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UnauthenticatedUpdateIndividualOnboardingPayload = ForbiddenRejection | InternalErrorRejection | UnauthenticatedUpdateIndividualOnboardingSuccessPayload | ValidationRejection;

export type UnauthenticatedUpdateIndividualOnboardingSuccessPayload = {
  __typename?: 'UnauthenticatedUpdateIndividualOnboardingSuccessPayload';
  onboarding: OnboardingInfo;
};

export type UpdateRequestNotPendingReviewRejection = Rejection & {
  __typename?: 'UpdateRequestNotPendingReviewRejection';
  message: Scalars['String']['output'];
  requestUpdateId: Maybe<Scalars['ID']['output']>;
};

/** The User is the unique user, natural person, of the Swan app. */
export type User = {
  __typename?: 'User';
  /**
   * The list of account memberships
   *
   * Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination))
   */
  accountMemberships: AccountMembershipConnection;
  /** list of first names */
  allFirstNames: Maybe<Array<Scalars['String']['output']>>;
  /** the methods used to authenticate this user */
  authenticators: Maybe<Array<Authenticator>>;
  /** birth city */
  birthCity: Maybe<Scalars['String']['output']>;
  /** birth date */
  birthDate: Maybe<Scalars['Date']['output']>;
  /** Birth last name */
  birthLastName: Maybe<Scalars['String']['output']>;
  /** Creation date of the user */
  createdAt: Scalars['DateTime']['output'];
  /** first name */
  firstName: Maybe<Scalars['String']['output']>;
  /** full name : concatenation of firstName + [ birthLastName | lastName ] depending on preferredLastName setting */
  fullName: Maybe<Scalars['String']['output']>;
  /** unique identifier of the user */
  id: Scalars['ID']['output'];
  /**
   * `true` if Swan has verified the user's identity
   * @deprecated Use the equivalent identificationLevels.expert field instead
   * @deprecated Use the equivalent `identificationLevels.expert` field instead
   */
  idVerified: Scalars['Boolean']['output'];
  /**
   * List of identification levels available for the user.
   *
   * Whenever TRUE, it means the identification was successful for the associated level.
   */
  identificationLevels: Maybe<IdentificationLevels>;
  /** last name */
  lastName: Maybe<Scalars['String']['output']>;
  /** mobile phone number with the international format (Example: +33689788967) */
  mobilePhoneNumber: Maybe<Scalars['PhoneNumber']['output']>;
  /** nationality */
  nationalityCCA3: Maybe<Scalars['CCA3']['output']>;
  /** The last name that the user prefers to use */
  preferredLastName: Maybe<Scalars['String']['output']>;
  /**
   * Preferred notification channel
   *
   * When it is "null" it means that the preferences have not been updated. Default SMS in use
   */
  preferredNotificationChannel: Maybe<PreferredNotificationChannel>;
  /** Status of the user */
  status: Maybe<UserStatus>;
  /** Last update date of the user */
  updatedAt: Scalars['DateTime']['output'];
};


/** The User is the unique user, natural person, of the Swan app. */
export type UserAccountMembershipsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  filters: InputMaybe<AccountMembershipsFilterInput>;
  first?: Scalars['Int']['input'];
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type UserConnection = Connection & {
  __typename?: 'UserConnection';
  /** UserEdge list */
  edges: Array<UserEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type UserEdge = Edge & {
  __typename?: 'UserEdge';
  /** Opaque identifier pointing to this consent node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The user */
  node: User;
};

export type UserNotAllowedToDisableItsOwnAccountMembershipRejection = Rejection & {
  __typename?: 'UserNotAllowedToDisableItsOwnAccountMembershipRejection';
  accountMembershipId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Rejection returned if a identity does not have enough permission to manage account membership */
export type UserNotAllowedToManageAccountMembershipRejection = Rejection & {
  __typename?: 'UserNotAllowedToManageAccountMembershipRejection';
  message: Scalars['String']['output'];
};

export type UserNotAllowedToSuspendItsOwnAccountMembershipRejection = Rejection & {
  __typename?: 'UserNotAllowedToSuspendItsOwnAccountMembershipRejection';
  accountMembershipId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Rejection returned when the User is not the Card Holder */
export type UserNotCardHolderRejection = Rejection & {
  __typename?: 'UserNotCardHolderRejection';
  message: Scalars['String']['output'];
};

export type UserStatus =
  /** Users with Active status are able to login & use Swan. */
  | 'Active'
  /** Users in Blocked status are not able to login for security reason. Their phone number can't be reused. */
  | 'Blocked'
  /** Users in Deactivated status don't use Swan anymore and won't ever be able to login. Their phone number can be reused as a new number. */
  | 'Deactivated';

/** A detail of a validation error : what field is errored and why */
export type ValidationError = {
  __typename?: 'ValidationError';
  /** Constraints that are not matched on the Onboarding property */
  errors: Maybe<Array<FieldValidationError>>;
  /** Onboarding property that is not matching requirements to allow a finalization */
  field: Scalars['String']['output'];
};

export type ValidationFieldError = {
  __typename?: 'ValidationFieldError';
  code: ValidationFieldErrorCode;
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type ValidationFieldErrorCode =
  | 'InvalidString'
  | 'InvalidType'
  | 'TooLong'
  | 'TooShort'
  | 'UnrecognizedKeys';

/** Rejection returned if an input contains invalid data */
export type ValidationRejection = Rejection & {
  __typename?: 'ValidationRejection';
  fields: Array<ValidationFieldError>;
  message: Scalars['String']['output'];
};

/** Verification Flow. */
export type VerificationFlow =
  /** When you ask the account holder the minimum required to comply the law at the beginning of the relationship. */
  | 'Progressive'
  /** When you ask the account holder to start the verification process at the beginning of the relationship to get an unlimited account. */
  | 'Upfront';

export type VerificationRenewal = {
  __typename?: 'VerificationRenewal';
  verificationRenewalId: Maybe<Scalars['ID']['output']>;
};

/**
 * Account Holder Verification Requirement
 *
 * It is a sub status for the Account Holder when his verification status is WaitingForInformation
 */
export type VerificationRequirement = {
  __typename?: 'VerificationRequirement';
  id: Scalars['ID']['output'];
  type: VerificationRequirementType;
};

export type VerificationRequirementType =
  /** Swan is requesting for a 1st transfer */
  | 'FirstTransferRequired'
  /** Swan is requesting some clarification on the legal representative or on the account member with legal representative permissions */
  | 'LegalRepresentativeDetailsRequired'
  /** Swan is requesting some clarification on the organization */
  | 'OrganizationDetailsRequired'
  /** Swan is requesting more information on the account holders */
  | 'Other'
  /** Swan is requesting some Supporting Documents */
  | 'SupportingDocumentsRequired'
  /** Swan is requesting some tax identifier */
  | 'TaxIdRequired'
  /** Swan is requesting some clarification on the UBO */
  | 'UboDetailsRequired';

export type VerificationRequirementsNotUpdatableRejection = Rejection & {
  __typename?: 'VerificationRequirementsNotUpdatableRejection';
  accountHolderId: Scalars['String']['output'];
  accountHolderVerificationStatus: VerificationStatus;
  message: Scalars['String']['output'];
};

/** Verification status of an account holder */
export type VerificationStatus =
  /** When the account holder has not started to answer the verification process. */
  | 'NotStarted'
  /** When the verification process is pending. */
  | 'Pending'
  /** When the account holder is refused. */
  | 'Refused'
  /** When the account holder is verified. */
  | 'Verified'
  /** When Swan is waiting for information about the account holder to continue the verification process. */
  | 'WaitingForInformation';

/** Virtual IBAN can be used by the account holder to receive SCT (Sepa Credit Transfer) or to be debited by SDD (Sepa Direct Debit). */
export type VirtualIbanEntry = {
  __typename?: 'VirtualIBANEntry';
  /** Bank Identifier Code */
  BIC: Scalars['BIC']['output'];
  /** International Bank Account Number */
  IBAN: Scalars['IBAN']['output'];
  /** `true` if the Virtual IBAN refuses all Sepa Direct Debit received */
  blockSDD: Scalars['Boolean']['output'];
  /** Unique identifier of a Virtual IBAN entry */
  id: Scalars['ID']['output'];
  /** Label (could be used to identify) */
  label: Maybe<Scalars['String']['output']>;
  /** Status of the Iban */
  status: IbanStatus;
};

/** Implements the Relay Connection interface, used to paginate list of element ([Learn More](https://docs.swan.io/api/pagination)) */
export type VirtualIbanEntryConnection = Connection & {
  __typename?: 'VirtualIBANEntryConnection';
  /** VirtualIBANEntryEdge list */
  edges: Array<VirtualIbanEntryEdge>;
  /** Information about the current, the previous and the next page */
  pageInfo: PageInfo;
  /** Total number of element in the list */
  totalCount: Scalars['Int']['output'];
};

/** Implements the Relay Edge interface */
export type VirtualIbanEntryEdge = Edge & {
  __typename?: 'VirtualIBANEntryEdge';
  /** Opaque identifier pointing to this node in the pagination mechanism */
  cursor: Scalars['String']['output'];
  /** The virtual iban entry */
  node: VirtualIbanEntry;
};

/** Wallet Provider (ApplePay, GooglePay ...) */
export type WalletProvider = {
  __typename?: 'WalletProvider';
  /** id of the Wallet Provider */
  id: Scalars['String']['output'];
  /** name of the Wallet Provider (Apple / Google / Amazon or Unknown) */
  name: Scalars['String']['output'];
};

export type WebBankingSettings = {
  __typename?: 'WebBankingSettings';
  canAddNewMembers: Maybe<Scalars['Boolean']['output']>;
  canCreateMerchantPaymentLinks: Maybe<Scalars['Boolean']['output']>;
  canCreateMerchantProfile: Maybe<Scalars['Boolean']['output']>;
  canInitiateCheckMerchantPayments: Maybe<Scalars['Boolean']['output']>;
  canInitiatePaymentsToNewBeneficiaries: Maybe<Scalars['Boolean']['output']>;
  canManageVirtualIbans: Maybe<Scalars['Boolean']['output']>;
  canOrderPhysicalCards: Maybe<Scalars['Boolean']['output']>;
  canOrderVirtualCards: Maybe<Scalars['Boolean']['output']>;
  canRequestChecksPaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canRequestInternalDirectDebitB2BPaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canRequestInternalDirectDebitCorePaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canRequestOnlineCardsPaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canRequestSepaDirectDebitB2BPaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canRequestSepaDirectDebitCorePaymentMethod: Maybe<Scalars['Boolean']['output']>;
  canViewAccountDetails: Maybe<Scalars['Boolean']['output']>;
  canViewAccountStatement: Maybe<Scalars['Boolean']['output']>;
  canViewMembers: Maybe<Scalars['Boolean']['output']>;
  canViewPaymentList: Maybe<Scalars['Boolean']['output']>;
};

export type OnboardingInfoQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  language: Scalars['String']['input'];
}>;


export type OnboardingInfoQuery = { __typename?: 'Query', onboardingInfo: (
    { __typename?: 'OnboardingInfo', id: string, accountCountry: AccountCountry | null, language: string | null, onboardingState: OnboardingState | null, redirectUrl: string, oAuthRedirectParameters: { __typename?: 'OAuthRedirectParameters', redirectUrl: string | null } | null, projectInfo: { __typename?: 'ProjectInfo', id: string, accentColor: string | null, name: string } | null, info: (
      { __typename: 'OnboardingCompanyAccountHolderInfo' }
      & { ' $fragmentRefs'?: { 'OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment } }
    ) | (
      { __typename: 'OnboardingIndividualAccountHolderInfo' }
      & { ' $fragmentRefs'?: { 'OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment': OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment } }
    ) }
    & { ' $fragmentRefs'?: { 'OnboardingCompanyWizard_OnboardingInfoFragment': OnboardingCompanyWizard_OnboardingInfoFragment;'OnboardingIndividualWizard_OnboardingInfoFragment': OnboardingIndividualWizard_OnboardingInfoFragment } }
  ) | null };

export type OnboardingHeader_ProjectInfoFragment = { __typename?: 'ProjectInfo', id: string, name: string, logoUri: string | null } & { ' $fragmentName'?: 'OnboardingHeader_ProjectInfoFragment' };

export type SupportingDocumentCollectionQueryVariables = Exact<{
  supportingDocumentCollectionId: Scalars['ID']['input'];
}>;


export type SupportingDocumentCollectionQuery = { __typename?: 'Query', supportingDocumentCollection: { __typename?: 'SupportingDocumentCollection', id: string, accountHolder: { __typename?: 'SupportingDocumentAccountHolder', id: string | null, name: string | null }, requiredSupportingDocumentPurposes: Array<{ __typename?: 'SupportingDocumentPurpose', name: SupportingDocumentPurposeEnum }>, statusInfo: { __typename?: 'SupportingDocumentCollectionApprovedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionCanceledStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionPendingReviewStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionRejectedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionWaitingForDocumentStatusInfo', status: SupportingDocumentCollectionStatus }, supportingDocuments: Array<{ __typename?: 'SupportingDocument', id: string, supportingDocumentPurpose: SupportingDocumentPurposeEnum, supportingDocumentType: SupportingDocumentType | null, updatedAt: string, statusInfo: { __typename: 'SupportingDocumentNotUploadedStatusInfo', status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentRefusedStatusInfo', reason: string, filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentUploadedStatusInfo', filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentValidatedStatusInfo', filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentWaitingForUploadStatusInfo', status: SupportingDocumentStatus } } | null>, projectInfo: (
      { __typename?: 'ProjectInfo', id: string, accentColor: string | null }
      & { ' $fragmentRefs'?: { 'OnboardingHeader_ProjectInfoFragment': OnboardingHeader_ProjectInfoFragment } }
    ) } | null };

export type RequestSupportingDocumentCollectionReviewMutationVariables = Exact<{
  input: RequestSupportingDocumentCollectionReviewInput;
}>;


export type RequestSupportingDocumentCollectionReviewMutation = { __typename?: 'Mutation', requestSupportingDocumentCollectionReview: { __typename: 'ForbiddenRejection', message: string } | { __typename: 'RequestSupportingDocumentCollectionReviewSuccessPayload', supportingDocumentCollection: { __typename?: 'SupportingDocumentCollection', id: string } } | { __typename: 'SupportingDocumentCollectionNotFoundRejection', message: string } | { __typename: 'SupportingDocumentCollectionStatusNotAllowedRejection', message: string } | { __typename: 'ValidationRejection', message: string } };

export type DeleteSupportingDocumentMutationVariables = Exact<{
  input: DeleteSupportingDocumentInput;
}>;


export type DeleteSupportingDocumentMutation = { __typename?: 'Mutation', deleteSupportingDocument: { __typename: 'DeleteSupportingDocumentSuccessPayload', id: string } | { __typename: 'ForbiddenRejection', message: string } | { __typename: 'InternalErrorRejection', message: string } | { __typename: 'SupportingDocumentCollectionNotFoundRejection', message: string } | { __typename: 'SupportingDocumentCollectionStatusDoesNotAllowDeletionRejection', message: string } | { __typename: 'SupportingDocumentNotFoundRejection', message: string } | { __typename: 'SupportingDocumentStatusDoesNotAllowDeletionRejection', message: string } | { __typename: 'ValidationRejection', message: string } };

export type GenerateSupportingDocumentUploadUrlMutationVariables = Exact<{
  input: GenerateSupportingDocumentUploadUrlInput;
}>;


export type GenerateSupportingDocumentUploadUrlMutation = { __typename?: 'Mutation', generateSupportingDocumentUploadUrl: { __typename: 'ForbiddenRejection' } | { __typename: 'GenerateSupportingDocumentUploadUrlSuccessPayload', supportingDocumentId: string, upload: { __typename?: 'SupportingDocumentUploadInfo', url: string, fields: Array<{ __typename?: 'SupportingDocumentPostField', key: string, value: string }> } } | { __typename: 'InternalErrorRejection' } | { __typename: 'SupportingDocumentCollectionNotFoundRejection' } | { __typename: 'SupportingDocumentUploadNotAllowedRejection' } | { __typename: 'ValidationRejection' } };

export type UpdateCompanyOnboardingMutationVariables = Exact<{
  input: UnauthenticatedUpdateCompanyOnboardingInput;
  language: Scalars['String']['input'];
}>;


export type UpdateCompanyOnboardingMutation = { __typename?: 'Mutation', unauthenticatedUpdateCompanyOnboarding: { __typename: 'ForbiddenRejection' } | { __typename: 'InternalErrorRejection' } | { __typename: 'UnauthenticatedUpdateCompanyOnboardingSuccessPayload', onboarding: (
      { __typename?: 'OnboardingInfo', id: string, info: (
        { __typename: 'OnboardingCompanyAccountHolderInfo' }
        & { ' $fragmentRefs'?: { 'OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment } }
      ) | { __typename: 'OnboardingIndividualAccountHolderInfo' } }
      & { ' $fragmentRefs'?: { 'OnboardingCompanyWizard_OnboardingInfoFragment': OnboardingCompanyWizard_OnboardingInfoFragment } }
    ) } | { __typename: 'ValidationRejection', fields: Array<{ __typename?: 'ValidationFieldError', path: Array<string>, code: ValidationFieldErrorCode, message: string }> } };

export type UpdateIndividualOnboardingMutationVariables = Exact<{
  input: UnauthenticatedUpdateIndividualOnboardingInput;
  language: Scalars['String']['input'];
}>;


export type UpdateIndividualOnboardingMutation = { __typename?: 'Mutation', unauthenticatedUpdateIndividualOnboarding: { __typename: 'ForbiddenRejection' } | { __typename: 'InternalErrorRejection' } | { __typename: 'UnauthenticatedUpdateIndividualOnboardingSuccessPayload', onboarding: (
      { __typename?: 'OnboardingInfo', id: string, info: { __typename: 'OnboardingCompanyAccountHolderInfo' } | (
        { __typename: 'OnboardingIndividualAccountHolderInfo' }
        & { ' $fragmentRefs'?: { 'OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment': OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment } }
      ) }
      & { ' $fragmentRefs'?: { 'OnboardingIndividualWizard_OnboardingInfoFragment': OnboardingIndividualWizard_OnboardingInfoFragment } }
    ) } | { __typename: 'ValidationRejection', fields: Array<{ __typename?: 'ValidationFieldError', path: Array<string>, code: ValidationFieldErrorCode, message: string }> } };

export type OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragment = { __typename?: 'OnboardingCompanyAccountHolderInfo', typeOfRepresentation: TypeOfRepresentation | null, companyType: CompanyType | null, residencyAddress: { __typename?: 'AddressInfo', country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragment' };

export type OnboardingCompanyBasicInfo_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null } & { ' $fragmentName'?: 'OnboardingCompanyBasicInfo_OnboardingInfoFragment' };

export type OnboardingCompanyDocuments_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', language: string | null, supportingDocumentCollection: { __typename?: 'SupportingDocumentCollection', id: string, statusInfo: { __typename?: 'SupportingDocumentCollectionApprovedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionCanceledStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionPendingReviewStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionRejectedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionWaitingForDocumentStatusInfo', status: SupportingDocumentCollectionStatus }, requiredSupportingDocumentPurposes: Array<{ __typename?: 'SupportingDocumentPurpose', name: SupportingDocumentPurposeEnum }>, supportingDocuments: Array<{ __typename?: 'SupportingDocument', id: string, supportingDocumentPurpose: SupportingDocumentPurposeEnum, supportingDocumentType: SupportingDocumentType | null, updatedAt: string, statusInfo: { __typename: 'SupportingDocumentNotUploadedStatusInfo', status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentRefusedStatusInfo', reason: string, filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentUploadedStatusInfo', filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentValidatedStatusInfo', filename: string, status: SupportingDocumentStatus } | { __typename: 'SupportingDocumentWaitingForUploadStatusInfo', status: SupportingDocumentStatus } } | null> } } & { ' $fragmentName'?: 'OnboardingCompanyDocuments_OnboardingInfoFragment' };

export type OnboardingCompanyOrganisation1_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null } & { ' $fragmentName'?: 'OnboardingCompanyOrganisation1_OnboardingInfoFragment' };

export type OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragment = { __typename?: 'OnboardingCompanyAccountHolderInfo', companyType: CompanyType | null, isRegistered: boolean | null, name: string | null, registrationNumber: string | null, vatNumber: string | null, taxIdentificationNumber: string | null, residencyAddress: { __typename?: 'AddressInfo', addressLine1: string | null, city: string | null, postalCode: string | null, country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragment' };

export type CompanyInfoBySirenQueryVariables = Exact<{
  siren: Scalars['String']['input'];
}>;


export type CompanyInfoBySirenQuery = { __typename?: 'Query', companyInfoBySiren: { __typename: 'CompanyInfoBySirenSuccessPayload', companyInfo: { __typename?: 'CompanyInfo', siren: string, companyName: string, vatNumber: string | null, headquarters: { __typename?: 'Headquarters', address: string, town: string, zipCode: string } } } | { __typename: 'InternalErrorRejection' } | { __typename: 'InvalidSirenNumberRejection' } | { __typename: 'NotSupportedCountryRejection' } };

export type OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragment = { __typename?: 'OnboardingCompanyAccountHolderInfo', businessActivity: BusinessActivity | null, businessActivityDescription: string | null, monthlyPaymentVolume: MonthlyPaymentVolume | null } & { ' $fragmentName'?: 'OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragment' };

export type OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragment = { __typename: 'IndividualUltimateBeneficialOwner', firstName: string | null, lastName: string | null, birthDate: string | null, birthCountryCode: CountryCCA3 | null, birthCity: string | null, birthCityPostalCode: string | null, taxIdentificationNumber: string | null, info: { __typename: 'IndividualUltimateBeneficialOwnerTypeHasCapital', indirect: boolean | null, direct: boolean | null, totalCapitalPercentage: number | null, type: IndividualUltimateBeneficialOwnerTypeEnum } | { __typename: 'IndividualUltimateBeneficialOwnerTypeLegalRepresentative', type: IndividualUltimateBeneficialOwnerTypeEnum } | { __typename: 'IndividualUltimateBeneficialOwnerTypeOther', type: IndividualUltimateBeneficialOwnerTypeEnum }, residencyAddress: { __typename?: 'AddressInformation', addressLine1: string, addressLine2: string | null, city: string, country: CountryCCA3, postalCode: string, state: string | null } | null, identityDocumentDetails: { __typename?: 'UBOIdentityDocumentDetails', type: UboIdentityDocumentType | null, issueDate: string | null, issuingAuthority: string | null, expiryDate: string | null, number: string | null } | null } & { ' $fragmentName'?: 'OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragment' };

export type OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragment = { __typename?: 'OnboardingCompanyAccountHolderInfo', name: string | null, individualUltimateBeneficialOwners: Array<(
    { __typename?: 'IndividualUltimateBeneficialOwner' }
    & { ' $fragmentRefs'?: { 'OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragment': OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragment } }
  )> | null, residencyAddress: { __typename?: 'AddressInfo', country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragment' };

export type OnboardingCompanyOwnership_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null } & { ' $fragmentName'?: 'OnboardingCompanyOwnership_OnboardingInfoFragment' };

export type OnboardingCompanyRegistration_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', email: string | null, accountCountry: AccountCountry | null, tcuUrl: string, projectInfo: { __typename?: 'ProjectInfo', id: string, name: string, tcuDocumentUri: string } | null } & { ' $fragmentName'?: 'OnboardingCompanyRegistration_OnboardingInfoFragment' };

export type OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragment = { __typename?: 'OnboardingCompanyAccountHolderInfo', residencyAddress: { __typename?: 'AddressInfo', addressLine1: string | null, city: string | null, postalCode: string | null, country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragment' };

export type OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment = (
  { __typename?: 'OnboardingCompanyAccountHolderInfo', companyType: CompanyType | null, residencyAddress: { __typename?: 'AddressInfo', country: CountryCCA3 | null } | null, individualUltimateBeneficialOwners: Array<{ __typename: 'IndividualUltimateBeneficialOwner' }> | null }
  & { ' $fragmentRefs'?: { 'OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragment;'OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragment;'OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragment;'OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragment;'OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragment': OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragment } }
) & { ' $fragmentName'?: 'OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment' };

export type OnboardingCompanyWizard_OnboardingInfoFragment = (
  { __typename?: 'OnboardingInfo', id: string, legalRepresentativeRecommendedIdentificationLevel: IdentificationLevel, accountCountry: AccountCountry | null, statusInfo: { __typename: 'OnboardingFinalizedStatusInfo' } | { __typename: 'OnboardingInvalidStatusInfo', errors: Array<{ __typename?: 'ValidationError', field: string, errors: Array<FieldValidationError> | null }> } | { __typename: 'OnboardingValidStatusInfo' }, projectInfo: (
    { __typename?: 'ProjectInfo', id: string }
    & { ' $fragmentRefs'?: { 'OnboardingHeader_ProjectInfoFragment': OnboardingHeader_ProjectInfoFragment } }
  ) | null, supportingDocumentCollection: { __typename?: 'SupportingDocumentCollection', id: string, requiredSupportingDocumentPurposes: Array<{ __typename?: 'SupportingDocumentPurpose', name: SupportingDocumentPurposeEnum }>, statusInfo: { __typename?: 'SupportingDocumentCollectionApprovedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionCanceledStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionPendingReviewStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionRejectedStatusInfo', status: SupportingDocumentCollectionStatus } | { __typename?: 'SupportingDocumentCollectionWaitingForDocumentStatusInfo', status: SupportingDocumentCollectionStatus } } }
  & { ' $fragmentRefs'?: { 'OnboardingCompanyBasicInfo_OnboardingInfoFragment': OnboardingCompanyBasicInfo_OnboardingInfoFragment;'OnboardingCompanyRegistration_OnboardingInfoFragment': OnboardingCompanyRegistration_OnboardingInfoFragment;'OnboardingCompanyOrganisation1_OnboardingInfoFragment': OnboardingCompanyOrganisation1_OnboardingInfoFragment;'OnboardingCompanyOwnership_OnboardingInfoFragment': OnboardingCompanyOwnership_OnboardingInfoFragment;'OnboardingCompanyDocuments_OnboardingInfoFragment': OnboardingCompanyDocuments_OnboardingInfoFragment } }
) & { ' $fragmentName'?: 'OnboardingCompanyWizard_OnboardingInfoFragment' };

export type OnboardingIndividualDetails_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null } & { ' $fragmentName'?: 'OnboardingIndividualDetails_OnboardingInfoFragment' };

export type OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragment = { __typename?: 'OnboardingIndividualAccountHolderInfo', employmentStatus: EmploymentStatus | null, monthlyIncome: MonthlyIncome | null, taxIdentificationNumber: string | null, residencyAddress: { __typename?: 'AddressInfo', country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragment' };

export type OnboardingIndividualEmail_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null, email: string | null, tcuUrl: string, projectInfo: { __typename?: 'ProjectInfo', id: string, name: string, tcuDocumentUri: string } | null } & { ' $fragmentName'?: 'OnboardingIndividualEmail_OnboardingInfoFragment' };

export type OnboardingIndividualLocation_OnboardingInfoFragment = { __typename?: 'OnboardingInfo', accountCountry: AccountCountry | null } & { ' $fragmentName'?: 'OnboardingIndividualLocation_OnboardingInfoFragment' };

export type OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragment = { __typename?: 'OnboardingIndividualAccountHolderInfo', residencyAddress: { __typename?: 'AddressInfo', addressLine1: string | null, city: string | null, postalCode: string | null, country: CountryCCA3 | null } | null } & { ' $fragmentName'?: 'OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragment' };

export type OnboardingIndividualWizard_OnboardingInfoFragment = (
  { __typename?: 'OnboardingInfo', id: string, legalRepresentativeRecommendedIdentificationLevel: IdentificationLevel, statusInfo: { __typename: 'OnboardingFinalizedStatusInfo' } | { __typename: 'OnboardingInvalidStatusInfo', errors: Array<{ __typename?: 'ValidationError', field: string, errors: Array<FieldValidationError> | null }> } | { __typename: 'OnboardingValidStatusInfo' }, projectInfo: (
    { __typename?: 'ProjectInfo', id: string }
    & { ' $fragmentRefs'?: { 'OnboardingHeader_ProjectInfoFragment': OnboardingHeader_ProjectInfoFragment } }
  ) | null }
  & { ' $fragmentRefs'?: { 'OnboardingIndividualEmail_OnboardingInfoFragment': OnboardingIndividualEmail_OnboardingInfoFragment;'OnboardingIndividualLocation_OnboardingInfoFragment': OnboardingIndividualLocation_OnboardingInfoFragment;'OnboardingIndividualDetails_OnboardingInfoFragment': OnboardingIndividualDetails_OnboardingInfoFragment } }
) & { ' $fragmentName'?: 'OnboardingIndividualWizard_OnboardingInfoFragment' };

export type OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment = (
  { __typename?: 'OnboardingIndividualAccountHolderInfo' }
  & { ' $fragmentRefs'?: { 'OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragment': OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragment;'OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragment': OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragment } }
) & { ' $fragmentName'?: 'OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment' };

export const OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"typeOfRepresentation"}},{"kind":"Field","name":{"kind":"Name","value":"companyType"}}]}}]} as unknown as DocumentNode<OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"isRegistered"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"registrationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"vatNumber"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"businessActivity"}},{"kind":"Field","name":{"kind":"Name","value":"businessActivityDescription"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyPaymentVolume"}}]}}]} as unknown as DocumentNode<OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"birthCountryCode"}},{"kind":"Field","name":{"kind":"Name","value":"birthCity"}},{"kind":"Field","name":{"kind":"Name","value":"birthCityPostalCode"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwnerTypeHasCapital"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"indirect"}},{"kind":"Field","name":{"kind":"Name","value":"direct"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapitalPercentage"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"identityDocumentDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"issuingAuthority"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}}]} as unknown as DocumentNode<OnboardingCompanyOwnership_IndividualUltimateBeneficialOwnerFragment, unknown>;
export const OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"}}]}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"birthCountryCode"}},{"kind":"Field","name":{"kind":"Name","value":"birthCity"}},{"kind":"Field","name":{"kind":"Name","value":"birthCityPostalCode"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwnerTypeHasCapital"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"indirect"}},{"kind":"Field","name":{"kind":"Name","value":"direct"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapitalPercentage"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"identityDocumentDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"issuingAuthority"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}}]} as unknown as DocumentNode<OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"birthCountryCode"}},{"kind":"Field","name":{"kind":"Name","value":"birthCity"}},{"kind":"Field","name":{"kind":"Name","value":"birthCityPostalCode"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwnerTypeHasCapital"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"indirect"}},{"kind":"Field","name":{"kind":"Name","value":"direct"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapitalPercentage"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"identityDocumentDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"issuingAuthority"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"typeOfRepresentation"}},{"kind":"Field","name":{"kind":"Name","value":"companyType"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"isRegistered"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"registrationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"vatNumber"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"businessActivity"}},{"kind":"Field","name":{"kind":"Name","value":"businessActivityDescription"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyPaymentVolume"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"}}]}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfoFragment, unknown>;
export const OnboardingHeader_ProjectInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}}]} as unknown as DocumentNode<OnboardingHeader_ProjectInfoFragment, unknown>;
export const OnboardingCompanyBasicInfo_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingCompanyBasicInfo_OnboardingInfoFragment, unknown>;
export const OnboardingCompanyRegistration_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}}]} as unknown as DocumentNode<OnboardingCompanyRegistration_OnboardingInfoFragment, unknown>;
export const OnboardingCompanyOrganisation1_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingCompanyOrganisation1_OnboardingInfoFragment, unknown>;
export const OnboardingCompanyOwnership_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingCompanyOwnership_OnboardingInfoFragment, unknown>;
export const OnboardingCompanyDocuments_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentPurpose"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentType"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentUploadedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentValidatedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentRefusedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}}]} as unknown as DocumentNode<OnboardingCompanyDocuments_OnboardingInfoFragment, unknown>;
export const OnboardingCompanyWizard_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentPurpose"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentType"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentUploadedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentValidatedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentRefusedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}}]} as unknown as DocumentNode<OnboardingCompanyWizard_OnboardingInfoFragment, unknown>;
export const OnboardingIndividualEmail_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}}]} as unknown as DocumentNode<OnboardingIndividualEmail_OnboardingInfoFragment, unknown>;
export const OnboardingIndividualLocation_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingIndividualLocation_OnboardingInfoFragment, unknown>;
export const OnboardingIndividualDetails_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingIndividualDetails_OnboardingInfoFragment, unknown>;
export const OnboardingIndividualWizard_OnboardingInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}}]} as unknown as DocumentNode<OnboardingIndividualWizard_OnboardingInfoFragment, unknown>;
export const OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfoFragment, unknown>;
export const OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfoFragment, unknown>;
export const OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}}]} as unknown as DocumentNode<OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfoFragment, unknown>;
export const OnboardingInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingState"}},{"kind":"Field","name":{"kind":"Name","value":"oAuthRedirectParameters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accentColor"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingInfo"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentPurpose"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentType"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentUploadedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentValidatedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentRefusedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"typeOfRepresentation"}},{"kind":"Field","name":{"kind":"Name","value":"companyType"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"isRegistered"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"registrationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"vatNumber"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"businessActivity"}},{"kind":"Field","name":{"kind":"Name","value":"businessActivityDescription"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyPaymentVolume"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"birthCountryCode"}},{"kind":"Field","name":{"kind":"Name","value":"birthCity"}},{"kind":"Field","name":{"kind":"Name","value":"birthCityPostalCode"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwnerTypeHasCapital"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"indirect"}},{"kind":"Field","name":{"kind":"Name","value":"direct"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapitalPercentage"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"identityDocumentDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"issuingAuthority"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"}}]}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"}}]}}]} as unknown as DocumentNode<OnboardingInfoQuery, OnboardingInfoQueryVariables>;
export const SupportingDocumentCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SupportingDocumentCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"supportingDocumentCollectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"supportingDocumentCollectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accountHolder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentPurpose"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentType"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentUploadedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentValidatedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentRefusedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accentColor"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}}]} as unknown as DocumentNode<SupportingDocumentCollectionQuery, SupportingDocumentCollectionQueryVariables>;
export const RequestSupportingDocumentCollectionReviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestSupportingDocumentCollectionReview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestSupportingDocumentCollectionReviewInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestSupportingDocumentCollectionReview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestSupportingDocumentCollectionReviewSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Rejection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<RequestSupportingDocumentCollectionReviewMutation, RequestSupportingDocumentCollectionReviewMutationVariables>;
export const DeleteSupportingDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSupportingDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteSupportingDocumentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSupportingDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteSupportingDocumentSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Rejection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteSupportingDocumentMutation, DeleteSupportingDocumentMutationVariables>;
export const GenerateSupportingDocumentUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateSupportingDocumentUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateSupportingDocumentUploadUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateSupportingDocumentUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateSupportingDocumentUploadUrlSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentId"}},{"kind":"Field","name":{"kind":"Name","value":"upload"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GenerateSupportingDocumentUploadUrlMutation, GenerateSupportingDocumentUploadUrlMutationVariables>;
export const UpdateCompanyOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCompanyOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnauthenticatedUpdateCompanyOnboardingInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unauthenticatedUpdateCompanyOnboarding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnauthenticatedUpdateCompanyOnboardingSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingInfo"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo"}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationRejection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentPurpose"}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentType"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentUploadedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentValidatedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportingDocumentRefusedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"typeOfRepresentation"}},{"kind":"Field","name":{"kind":"Name","value":"companyType"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"isRegistered"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"registrationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"vatNumber"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"businessActivity"}},{"kind":"Field","name":{"kind":"Name","value":"businessActivityDescription"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyPaymentVolume"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"birthCountryCode"}},{"kind":"Field","name":{"kind":"Name","value":"birthCity"}},{"kind":"Field","name":{"kind":"Name","value":"birthCityPostalCode"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndividualUltimateBeneficialOwnerTypeHasCapital"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"indirect"}},{"kind":"Field","name":{"kind":"Name","value":"direct"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapitalPercentage"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"identityDocumentDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"issuingAuthority"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_IndividualUltimateBeneficialOwner"}}]}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingDocumentCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requiredSupportingDocumentPurposes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation1_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyDocuments_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompanyAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyType"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"individualUltimateBeneficialOwners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo"}}]}}]} as unknown as DocumentNode<UpdateCompanyOnboardingMutation, UpdateCompanyOnboardingMutationVariables>;
export const UpdateIndividualOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateIndividualOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnauthenticatedUpdateIndividualOnboardingInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unauthenticatedUpdateIndividualOnboarding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnauthenticatedUpdateIndividualOnboardingSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingInfo"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo"}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationRejection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUri"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tcuDocumentUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tcuUrl"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCountry"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addressLine1"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"taxIdentificationNumber"}},{"kind":"Field","name":{"kind":"Name","value":"residencyAddress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingInvalidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingFinalizedStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingValidStatusInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingHeader_ProjectInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"legalRepresentativeRecommendedIdentificationLevel"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualEmail_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingInfo"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingIndividualAccountHolderInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo"}}]}}]} as unknown as DocumentNode<UpdateIndividualOnboardingMutation, UpdateIndividualOnboardingMutationVariables>;
export const CompanyInfoBySirenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CompanyInfoBySiren"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siren"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyInfoBySiren"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"headquarterCountry"},"value":{"kind":"StringValue","value":"FR","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"siren"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siren"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CompanyInfoBySirenSuccessPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"companyInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siren"}},{"kind":"Field","name":{"kind":"Name","value":"companyName"}},{"kind":"Field","name":{"kind":"Name","value":"vatNumber"}},{"kind":"Field","name":{"kind":"Name","value":"headquarters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"town"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CompanyInfoBySirenQuery, CompanyInfoBySirenQueryVariables>;