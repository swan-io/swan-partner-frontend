declare const __env: {
  // Server provided
  VERSION: string;
  SWAN_PROJECT_ID?: string;
  SWAN_ENVIRONMENT: "SANDBOX" | "LIVE";
  ACCOUNT_MEMBERSHIP_INVITATION_MODE: "LINK" | "EMAIL";
  BANKING_URL: string;
  PAYMENT_URL: string;
  IS_SWAN_MODE: boolean;
  // Client
  CLIENT_GOOGLE_MAPS_API_KEY: string;
  CLIENT_PLACEKIT_API_KEY: string;
  CLIENT_BANKING_URL: string;
  CLIENT_ONBOARDING_MATOMO_SITE_ID: string;
};
