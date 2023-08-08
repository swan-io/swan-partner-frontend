import { createIntl, createIntlCache } from "@formatjs/intl";
import { Dict } from "@swan-io/boxed";
import sharedEN from "@swan-io/shared-business/src/locales/en.json";
import bankingEN from "../../clients/banking/src/locales/en.json";
import onboardingEN from "../../clients/onboarding/src/locales/en.json";

const LANGUAGE_FALLBACK = "en";

const mapKeys = <P extends string, K extends string>(prefix: P, object: Record<K, string>) =>
  Object.fromEntries(
    Dict.entries(object).map(([key, value]) => [`${prefix}.${key}`, value] as const),
  ) as {
    [K1 in K as `${P}.${K1}`]: string;
  };

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
    locale: "en",
    messages: translationEN,
  },
  createIntlCache(),
);

export const t = (key: TranslationKey, params?: TranslationParams): string =>
  intl.formatMessage({ id: key, defaultMessage: translationEN[key] }, params).toString();
