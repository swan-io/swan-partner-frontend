import { createIntl, createIntlCache } from "@formatjs/intl";
import sharedEN from "@swan-io/shared-business/src/locales/en.json";
import bankingEN from "../../clients/banking/src/locales/en.json";
import onboardingEN from "../../clients/onboarding/src/locales/en.json";
import { mapKeys } from "./functions";

const LANGUAGE_FALLBACK = "en";

const translationEN = {
  ...mapKeys("banking", bankingEN),
  ...mapKeys("onboarding", onboardingEN),
  ...mapKeys("shared", sharedEN),
};

type TranslationKey = keyof typeof translationEN;
type TranslationParams = Record<string, string | number>;

const intl = createIntl(
  {
    defaultLocale: LANGUAGE_FALLBACK,
    fallbackOnEmptyString: false,
    locale: LANGUAGE_FALLBACK,
    messages: translationEN,
  },
  createIntlCache(),
);

export const t = (key: TranslationKey, params?: TranslationParams): string =>
  intl.formatMessage({ id: key, defaultMessage: translationEN[key] }, params).toString();
