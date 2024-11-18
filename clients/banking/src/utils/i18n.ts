import { createIntl, createIntlCache } from "@formatjs/intl";
import { Dict } from "@swan-io/boxed";
import { deriveUnion, memoize } from "@swan-io/lake/src/utils/function";
import { getRifmProps } from "@swan-io/lake/src/utils/rifm";
import { FlagCode } from "@swan-io/shared-business/src/components/Flag";
import { DateFormat } from "@swan-io/shared-business/src/utils/i18n";
import {
  LANGUAGE_FALLBACK,
  getLanguagesHelpers,
} from "@swan-io/shared-business/src/utils/languages";
import dayjs from "dayjs";
import dayjsLocaleDE from "dayjs/locale/de";
import dayjsLocaleEN from "dayjs/locale/en";
import dayjsLocaleES from "dayjs/locale/es";
import dayjsLocaleFI from "dayjs/locale/fi";
import dayjsLocaleFR from "dayjs/locale/fr";
import dayjsLocaleIT from "dayjs/locale/it";
import dayjsLocaleNL from "dayjs/locale/nl";
import dayjsLocalePT from "dayjs/locale/pt";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import { AccountLanguage } from "../graphql/partner";
import translationDE from "../locales/de.json";
import translationEN from "../locales/en.json";
import translationES from "../locales/es.json";
import translationFI from "../locales/fi.json";
import translationFR from "../locales/fr.json";
import translationIT from "../locales/it.json";
import translationNL from "../locales/nl.json";
import translationPT from "../locales/pt.json";

// https://day.js.org/docs/en/plugin/plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const supportedLanguages = ["en", "es", "de", "fr", "it", "nl", "pt", "fi"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const translationKeys = Dict.keys(translationEN);
export type TranslationKey = (typeof translationKeys)[number];
export type TranslationParams = Record<string, string | number>;

export const isTranslationKey = (value: unknown): value is TranslationKey =>
  typeof value === "string" && translationKeys.includes(value as TranslationKey);

type DateTimeFormat = "LTS" | "LT" | "L" | "LL" | "LLL" | "LLLL" | "l" | "ll" | "lll" | "llll";

type Locale = {
  language: SupportedLanguage;
  translations: Record<string, string>;
  dayjsLocale: ILocale;
  dateFormat: DateFormat;
  datePlaceholder: string;
  timeFormat: string;
  timePlaceholder: string;
  taxIdentificationNumberPlaceholder: string;
  firstWeekday: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
};

const locales: Record<SupportedLanguage, () => Locale> = {
  en: () => ({
    language: "en",
    translations: translationEN,
    dayjsLocale: dayjsLocaleEN,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  de: () => ({
    language: "de",
    translations: translationDE,
    dayjsLocale: dayjsLocaleDE,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  fr: () => ({
    language: "fr",
    translations: translationFR,
    dayjsLocale: dayjsLocaleFR,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "JJ/MM/AAAA",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  it: () => ({
    language: "it",
    translations: translationIT,
    dayjsLocale: dayjsLocaleIT,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  nl: () => ({
    language: "nl",
    translations: translationNL,
    dayjsLocale: dayjsLocaleNL,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  es: () => ({
    language: "es",
    translations: translationES,
    dayjsLocale: dayjsLocaleES,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
  pt: () => ({
    language: "pt",
    translations: translationPT,
    dayjsLocale: dayjsLocalePT,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "sunday",
  }),
  fi: () => ({
    language: "fi",
    translations: translationFI,
    dayjsLocale: dayjsLocaleFI,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
    firstWeekday: "monday",
  }),
};

export const { getBestLocale, getFirstSupportedLanguage, setPreferredLanguage } =
  getLanguagesHelpers(supportedLanguages);

export const locale = getBestLocale(locales);

// https://day.js.org/docs/en/i18n/loading-into-browser
dayjs.locale(locale.dayjsLocale);

// set lang in html tag for accessibility and screen reader accent
document.documentElement.setAttribute("lang", locale.language);

const intl = createIntl(
  {
    defaultLocale: LANGUAGE_FALLBACK,
    fallbackOnEmptyString: false,
    locale: locale.language,
    messages: locale.translations,
  },
  createIntlCache(),
);

export const t = (key: TranslationKey, params?: TranslationParams) =>
  intl.formatMessage({ id: key, defaultMessage: translationEN[key] }, params).toString();

export const formatDateTime = memoize(
  (date: Date | string, format: DateTimeFormat) => dayjs(date).format(format),
  (date: Date | string, format: DateTimeFormat) => `${date.toString()} - ${format}`,
);

export const formatCurrency = (value: number, currency: string) =>
  intl.formatNumber(value, { style: "currency", currency });

export const formatNestedMessage = (
  key: TranslationKey,
  params: Record<string, string | number | ReactElement | ((children: ReactNode) => ReactNode)>,
) => {
  const result = intl.formatMessage(
    { id: key, defaultMessage: translationEN[key] },
    // @ts-expect-error
    params,
  );

  const resultArray: (string | ReactElement)[] = Array.isArray(result) ? result : [result];

  return resultArray.map((item, index) =>
    isValidElement(item) ? cloneElement(item, { key: `t-${key}-${index}` }) : item,
  );
};

export const rifmDateProps = getRifmProps({
  accept: "numeric",
  charMap: { 2: "/", 4: "/" },
  maxLength: 8,
});

export const rifmTimeProps = getRifmProps({
  accept: "numeric",
  charMap: { 2: ":" },
  maxLength: 4,
});

export type Language = {
  name: string;
  native: string;
  id: SupportedLanguage;
  cca3: string;
  flag: string;
};

export const languages: Language[] = [
  {
    name: "English",
    native: "English",
    cca3: "USA",
    id: "en",
    flag: "🇺🇸",
  },
  {
    name: "French",
    native: "Français",
    id: "fr",
    cca3: "FRA",
    flag: "🇫🇷",
  },
  {
    name: "Italian",
    native: "Italiano",
    id: "it",
    cca3: "ITA",
    flag: "🇮🇹",
  },
  {
    name: "Dutch",
    native: "Nederlands",
    id: "nl",
    cca3: "NLD",
    flag: "🇳🇱",
  },
  {
    name: "German",
    native: "Deutsch",
    id: "de",
    cca3: "DEU",
    flag: "🇧🇪",
  },
  {
    name: "Spanish",
    native: "Español",
    id: "es",
    cca3: "ESP",
    flag: "🇪🇸",
  },
  {
    name: "Portuguese",
    native: "Português",
    id: "pt",
    cca3: "PRT",
    flag: "🇵🇹",
  },
  {
    name: "Finnish",
    native: "Suomi",
    id: "fi",
    cca3: "FIN",
    flag: "🇫🇮",
  },
];

const accountLanguageUnion = deriveUnion<AccountLanguage>({
  de: true,
  en: true,
  es: true,
  fr: true,
  it: true,
  nl: true,
  pt: true,
  fi: true,
});

export const accountLanguages = {
  ...accountLanguageUnion,

  items: languages.reduce<{ name: string; value: AccountLanguage }[]>((acc, language) => {
    if (accountLanguageUnion.is(language.id)) {
      acc.push({ name: language.native, value: language.id });
    }

    return acc;
  }, []),
};

const currenciesTuple = [
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "EUR",
  "GBP",
  "HKD",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NZD",
  "SGD",
  "THB",
  "USD",
  "UYU",
  "VND",
] as const;

export type Currency = (typeof currenciesTuple)[number];
export const currencies = currenciesTuple.toSorted();

export const isSupportedCurrency = (value: unknown): value is Currency =>
  typeof value === "string" && currenciesTuple.includes(value as Currency);

export const currencyResolver =
  "Intl" in window && "DisplayNames" in window.Intl
    ? new Intl.DisplayNames([locale.language], { type: "currency" })
    : undefined;

export const currencyFlags: Record<Currency, FlagCode> = {
  AUD: "AU",
  BRL: "BR",
  CAD: "CA",
  CHF: "CH",
  CLP: "CL",
  EUR: "EU",
  GBP: "GB",
  HKD: "HK",
  IDR: "ID",
  ILS: "IL",
  INR: "IN",
  JPY: "JP",
  KRW: "KR",
  MXN: "MX",
  MYR: "MY",
  NZD: "NZ",
  SGD: "SG",
  THB: "TH",
  USD: "US",
  UYU: "UY",
  VND: "VN",
};
