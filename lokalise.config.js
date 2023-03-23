const path = require("path");

const bankingProjectId = process.env.LOKALISE_BANKING_PROJECT_ID;
const onboardingProjectId = process.env.LOKALISE_ONBOARDING_PROJECT_ID;

if (!bankingProjectId) {
  throw new Error("Missing LOKALISE_BANKING_PROJECT_ID env variable");
}

if (!onboardingProjectId) {
  throw new Error("Missing LOKALISE_ONBOARDING_PROJECT_ID env variable");
}

module.exports = [
  {
    name: "banking",
    id: bankingProjectId,
    defaultLocale: "en",
    paths: {
      src: path.resolve(__dirname, "clients/banking/src"),
      locales: path.resolve(__dirname, "clients/banking/src/locales"),
    },
  },
  {
    name: "onboarding",
    id: onboardingProjectId,
    defaultLocale: "en",
    paths: {
      src: path.resolve(__dirname, "clients/onboarding/src"),
      locales: path.resolve(__dirname, "clients/onboarding/src/locales"),
    },
  },
];
