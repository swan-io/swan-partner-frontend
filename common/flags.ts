export type FlagContext = {
  environment: "development" | "master" | "preprod" | "prod";
  projectId: string;
  environmentType: "admin" | "live" | "sandbox";
  email: string;
  userId: string;
  accountCountry: "BEL" | "DEU" | "ESP" | "FRA" | "ITA" | "NLD";
};

export const flagDefaults = {
  deferredDebitCard: false,
  merchantWebBanking: false,
  initiate_international_credit_transfer_outgoing: false,
  disableWebBanking: false,
  allowNoCodeOnboardingV1: false,
};

export type Flags = typeof flagDefaults;
