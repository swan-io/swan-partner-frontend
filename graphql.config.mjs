const scalars = {
  AccountNumber: "string",
  AmountValue: "string",
  AuditId: "string",
  AuthorizationId: "string",
  BIC: "string",
  CCA2: "@swan-io/shared-business/src/constants/countries#CountryCCA2",
  CCA3: "@swan-io/shared-business/src/constants/countries#CountryCCA3",
  CardToken: "string",
  Currency: "string",
  Date: "string",
  DateTime: "string",
  EmailAddress: "string",
  HexColorCode: "string",
  IBAN: "string",
  PIN: "string",
  PhoneNumber: "string",
  PostalCode: "string",
  SepaCreditorIdentifier: "string",
  SepaReference: "string",
  TokenRequestorId: "string",
  URL: "string",
  Upload: "unknown",
  WalletToken: "string",
  join__FieldSet: "unknown",
};

const config = {
  scalars,
  enumsAsTypes: true,
  defaultScalarType: "unknown",
  avoidOptionals: {
    field: true,
    object: true,
    inputValue: false,
    defaultValue: true,
    query: true,
    mutation: true,
    subscription: true,
  },
};

export default {
  projects: {
    paymentUnauthenticated: {
      schema: "./scripts/graphql/dist/unauthenticated-schema.gql",
      documents: "./clients/payment/src/**/*.{ts,tsx}",
    },
    onboardingUnauthenticated: {
      schema: "./scripts/graphql/dist/unauthenticated-schema.gql",
      documents: "./clients/onboarding/src/**/*.{ts,tsx}",
    },
  },
};
