// This file was automatically generated by the tggl CLI

import 'tggl-client'

declare module 'tggl-client' {
  export interface TgglContext {
    userId: string
    email: string
    timestamp: string | number
    referer?: string
    ip?: string
    projectId: string
    accountCountry: "FRA" | "NLD" | "DEU" | "ESP" | "ITA"
    environment: "master" | "preprod" | "prod" | "development"
    environmentType: "sandbox" | "live" | "admin"
    serviceName: string
    countryCode: string
  }

  export interface TgglFlags {
    deactivateUser: true
    kycUseNewAmlLevelThreshold: true
    frontendActivateMerchantProfileInWebBanking: true
    sepaGatewayPublishSctInstEventsThroughFastKafkaTopics: true
    use_mailjet_subaccount_for_mass_emailing: true
    incomingForeignTransferScreeningEnabled: true
    isPusherFixed: true
    account_contract_use_swan_templates_for_tcu_notifications: true
    beneficiaries: true
    KYCUseInternalSystemToCollectSupportingDocuments: true
    merchantWebBanking: true
    kycAccountHoldersVerificationsView: true
    merchantPaymentMethodRequestUpdate: true
    monextNewRejectionCodeActivation: true
    choosePINCode: true
    paymentLink: true
    account_contract_choose_pin_code_enabled: true
    bankingBulkTransfer: true
    shouldUseICTV2: true
    teamManagementV2: true
    requestCardPaymentMethod: true
    swan_account_membership_migration: true
    account_contract_use_swan_tcu_templates_for_disabled_projects: true
    billing_v2_account_invoice_updated_event_enabled: boolean
    paymentLedgerCommunicationMode: "kafka" | "kafka_shadow_nats" | "nats_fallback_kafka" | "nats"
    end_customer_billing_enabled: boolean
    enable_transaction_statements: boolean
    dataExportUser: boolean
    handle_triple_webhook: boolean
    use_swan_public_data_s3: boolean
    return_transaction_mutation: boolean
    enable_document_generation_by_document_convertor: boolean
    mutationAddSepaTrustedBeneficiary: boolean
    use_enriched_transaction_data: boolean
    incomingTransferInstScreeningEnabled: boolean
    company_onboarding_requires_ubo_residency_address: boolean
    notificationServiceUsageRatio: 0.8 | 1 | 0.5 | 0 | 0.2
    incomingTransferScreeningDualRunEnabled: boolean
    enableSandboxMutations: boolean
    card_management_system_schedules_enabled: boolean
    billing_v2_enabled: boolean
    card_management_system_outboxer_enabled: boolean
    addInternationalBeneficiary: boolean
    isCheckRedirectVerificationCodeCalled: boolean
    isPhoneNumberCountryCodeBlocked: boolean
    lago_end_customer_enabled: boolean
    testFrontEnd: boolean
    account_contract_monext_openapi_enabled: boolean
    isNotificationsServiceEnabled: boolean
    send_transaction_enriched_webhook: boolean
    closure_subscription_enabled: boolean
    incomingTransferScreeningEnabled: boolean
    sandboxIdentification: boolean
    renewVirtualCardFeature: boolean
    account_contract_card_services_activated: boolean
    addSepaBeneficiary: boolean
    account_contract_card_jobs_activated: boolean
    renewPhysicalCardFeature: boolean
    swan_supports_local_italian_iban: true
    mutationAddInternationalTrustedBeneficiary: boolean
    card_management_system_create_default_card_product_when_new_project: boolean
    end_customer_usage_payment_v2_enabled: boolean
    account_contract_enable_maestro_provider: boolean
    kycUseKycServiceForCompanyWorkflow: boolean
    card_management_system_activate_finalize_saga_use_case: boolean
    cancelPhysicalCardAtExpirationFeature: boolean
    end_customer_ict_billing_enabled: boolean
    testScalaFeatureFlag: "ASBABSBSDBAA"
    new_physical_card_model_enabled: boolean
    account_contract_send_tcu_notifications: true | null
    use_optimized_count_in_paginate: boolean
    toRenewPhysicalCardFeatureEnabled: boolean
    initiate_international_credit_transfer_outgoing: boolean
    useInternationalBeneficiary: boolean
    international_credit_transfer_outgoing_remittance_settlement_enabled: boolean
    isCallToFeatureFlagProviderInBackground: boolean
    ciao_es_enabled: boolean
    incomingForeignTransferScreeningLimit: 50
    switch_simulate_to_invoice_v2: boolean
    account_contract_enable_maestro_provider_in_print_physical_card: boolean
    international_credit_transfer_swift_markup_enabled: boolean
    setIssuingProcessorCardProductOnRenewFeature: boolean
    incomingTransferScreeningLimit: 50
    name_matching_use_valid_names_enabled: boolean
    isScaDelegationEnabled: boolean
    twilioRatio: 0.8 | 1 | 0.5 | 0 | 0.95 | 0.6
  }
}