declare const __env: {
  // Server provided
  VERSION: string;
  SWAN_PROJECT_ID?: string;
  SWAN_ENVIRONMENT: "SANDBOX" | "LIVE";
  ACCOUNT_MEMBERSHIP_INVITATION_MODE: "LINK" | "SWAN_EMAIL" | "CUSTOM_EMAIL";
  BANKING_URL: string;
  PAYMENT_URL: string;
  IS_SWAN_MODE: boolean;
  DEPLOYMENT_ENVIRONMENT_NAME?: string;
  BANKING_FARO_URL?: string;
  ONBOARDING_FARO_URL?: string;
  PAYMENT_FARO_URL?: string;
  // Client
  CLIENT_PLACEKIT_API_KEY: string;
  CLIENT_CHECKOUT_API_KEY: string;
};
