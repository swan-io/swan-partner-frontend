// This file was automatically generated by the tggl CLI

import "tggl-client";

declare module "tggl-client" {
  export interface TgglContext {
    accountCountry: "DEU" | "ESP" | "FRA" | "ITA" | "NLD";
    capitalDepositCaseId: string;
    cardToken: string;
    carrierCountryIsoCode: string;
    carrierName: string;
    carrierNetworkIdentifier: string;
    carriersCountryCode: string;
    countryCode: string;
    email: string;
    environment: "development" | "master" | "preprod" | "prod";
    environmentType: "admin" | "live" | "sandbox";
    iban: string;
    ip?: string;
    label: string;
    projectId: string;
    reference: string;
    referer?: string;
    serviceName: string;
    timestamp: string | number;
    userId: string;
  }

  export interface TgglFlags {
    account_contract_enable_maestro_provider: boolean;
    account_contract_enable_maestro_provider_in_print_physical_card: boolean;
    account_contract_monext_openapi_enabled: boolean;
    account_contract_send_tcu_notifications: null | true;
    account_contract_use_swan_tcu_templates_for_disabled_projects: true;
    account_contract_use_swan_templates_for_tcu_notifications: true;
    accountContractDisableOldConsentPendingAccountMemberships: boolean;
    accountContractQueryAccountMembershipsNotReturnSelf: boolean;
    activate_digital_card_use_case: boolean;
    activateCardPaymentMethod: true;
    addInternationalBeneficiary: boolean;
    addSepaBeneficiary: boolean;
    aria_enabled: boolean;
    aria_redirect_to_swan_project: boolean;
    asset_freeze_approve_list_enabled: true;
    back_office_bank_verlag_event_generation_improvements: true;
    back_office_domestic_transfers_dual_run: boolean;
    bankingBulkTransfer: true;
    beneficiaries: true;
    bill_card_acquiring_enabled: boolean;
    billing_check_return_enabled: boolean;
    billing_use_case_enabled: boolean;
    billing_v2_enabled: boolean;
    blockOtpRequestIfAntibotTokenIsInvalid: true;
    can_manage_beneficiary_for_untrusted_beneficiary: boolean;
    cancel_card_and_cancel_physical_card_async: true;
    cardInsuranceActivation: boolean;
    checks: true;
    ciao_es_enabled: boolean;
    closure_subscription_enabled: boolean;
    cms_call_cema_carte_for_choose_pin: true;
    cms_choose_pin_token_always_valid: true;
    complete_capital_deposit_case_enabled: boolean;
    create_card_delivery_method_id: boolean;
    create_verification_renewal_cron: boolean;
    dashboardAccountClosingLink: true;
    dashboardBanner: null | {
      text: "Your users may be receiving calls from individuals impersonating advisors. If this happens, tell your users to hang up and contact you directly.";
      title: "Prevent fraud";
    };
    dashboardNotificationSettings: true;
    dashboardProjectMemberToken: true;
    dataExportAccount: boolean;
    dataExportAccountHolder: boolean;
    dataExportCards: boolean;
    dataExportOnboarding: boolean;
    dataExportTransactions: boolean;
    dataExportUser: boolean;
    deactivateUser: true;
    disable_emails_for_capital_deposit_case: boolean;
    display_invoice_v2_graphql: boolean;
    emi_banking_service_cash_segregation_v2: boolean;
    enable_document_generation_by_document_convertor: boolean;
    enable_transaction_statements: boolean;
    enableForestV2: boolean;
    enableFraudPreventionPage: boolean;
    enableIdentityTheftPreventionPage: true;
    end_customer_billing_enabled: boolean;
    end_customer_ict_billing_enabled: boolean;
    end_customer_usage_payment_v2_enabled: boolean;
    forceAllowDesktopAuth: boolean;
    free_units_enabled: boolean;
    frontendActivateMerchantPaymentLinksTabInWebBanking: true;
    frontendActivateMerchantProfileInWebBanking: true;
    full_text_search_feature_enabled: boolean;
    handleLedgerEventTransactionRecordedEnabled: boolean;
    identificationUserInfoCollectionAndReview: boolean;
    identityBirthDataCollection: true;
    ignore_identification_provider_birth_data: true;
    incomingForeignTransferScreeningEnabled: true;
    incomingForeignTransferScreeningLimit: 50;
    incomingTransferInstScreeningEnabled: boolean;
    incomingTransferScreeningDualRunEnabled: boolean;
    incomingTransferScreeningEnabled: boolean;
    incomingTransferScreeningLimit: 50;
    initiate_international_credit_transfer_outgoing: boolean;
    international_credit_transfer_outgoing_remittance_settlement_enabled: boolean;
    international_gateway_nats_consumer_enabled: true;
    isBlockRequestIfUserIsBlocked: true;
    isCustomerPasswordResetAvailable: true;
    isPhoneNumberCountryCodeBlocked: boolean;
    isPhoneNumberSuspicious: boolean;
    isPusherFixed: true;
    isScaDelegationEnabled: boolean;
    isSilentNetworkAuthenticationEnabled: true;
    isThreeDsPaymentAllowToBeQueried: boolean;
    kycAccountHoldersVerificationsView: true;
    kycActivateComplyAdvantageMonitoredSync: boolean;
    kYCPreventAHToBeVerifiedWithUnresolvedScreenings: boolean;
    lago_end_customer_enabled: boolean;
    lago_revenue_sharing_enabled: boolean;
    lockRecomputeEnableB2B: true;
    merchantDashboard: true;
    merchantWebBanking: boolean;
    mutationAddInternationalTrustedBeneficiary: boolean;
    mutationAddSepaTrustedBeneficiaries: boolean;
    mutationAddSepaTrustedBeneficiary: boolean;
    name_matching_use_valid_names_enabled: boolean;
    new_physical_card_model_enabled: boolean;
    new_reason_codes_capital_deposit_documents: true;
    newGqlGateway: boolean;
    notificationManagerEnableCardExpirationNotification: boolean;
    notificationManagerEnableCardInvalidExpirationDateNotification: boolean;
    notificationManagerEnableCardPinInvalidNotification: boolean;
    partner_billing_v1_5_enabled: boolean;
    paymentLink: true;
    pendingFeesIfInsufficientAvailableBalanceEnabled: boolean;
    processed_identification_requires_valid_redirect_verification_status: boolean;
    refundFeesActivateFixOnInvertedAccountIds: boolean;
    requestCardPaymentMethod: true;
    retry_settlement_fct_out_enabled: boolean;
    return_ict_in_enabled: boolean;
    return_transaction_mutation_ict_in: boolean;
    riskScoringStrategy:
      | "double_run_in_house"
      | "double_run_marble"
      | "double_run_relevant"
      | "in_house_only"
      | "marble_only";
    scaEnablePhoneNumberInsights: boolean;
    scaIAMDailyMaximumNumberOfSignInPerPhoneNumber: 10 | 100 | 1000 | 100000;
    sCAIAMPhoneNumberModificationAttemptsLimit: 10 | 5 | 50;
    scaIsPhoneCountryCodeBlocked: boolean;
    scaPhoneNumberInsightCron: 0 | 1000 | 1200 | 600;
    screeningSctInAndFctInWithNats: boolean;
    send_missing_virtual_bank_details_document_generated_events: boolean;
    sendCreditAndZeroAmountAuthorization: boolean;
    sepaDirectDebitInV2: true;
    SepaDirectDebitV2ActivationFlag: true;
    sepaGatewayPublishSctInstEventsThroughFastKafkaTopics: true;
    setIssuingProcessorCardProductOnRenewFeature: boolean;
    storeMonextAuthenticationRequest: boolean;
    swan_account_membership_migration: true;
    swan_generate_missing_bank_details: true;
    swan_supports_local_italian_iban: true;
    swan_supports_local_italian_iban_dashboard: true;
    testABTesting: "A" | "B";
    transactionVerification: boolean;
    trusted_beneficiary_transfers_consent_free_enabled: boolean;
    twilioRatio: 0 | 0.2 | 0.5 | 0.6 | 0.8 | 0.95 | 1;
    update_account_range_on_business_cards: true;
    use_checkout_identification_api: true;
    use_fourthine_workflow_api: true;
    use_gotenberg_next_account_statements: boolean;
    use_mailjet_subaccount_for_mass_emailing: true;
    useInternationalBeneficiary: boolean;
    useNotificationStackToSendTCUUpdates: boolean;
    useTwilioVerifyServiceSidAlan: true;
    webhookSendWebhookTokenHeader: boolean;
    webhookSubscriptionLimit: boolean;
  }
}
