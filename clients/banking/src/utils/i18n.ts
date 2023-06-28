import { createIntl, createIntlCache } from "@formatjs/intl";
import { DateFormat } from "@swan-io/lake/src/components/DatePicker";
import { memoize } from "@swan-io/lake/src/utils/function";
import { getRifmProps } from "@swan-io/lake/src/utils/rifm";
import {
  LANGUAGE_FALLBACK,
  getLanguagesHelpers,
} from "@swan-io/shared-business/src/utils/languages";
import dayjs from "dayjs";
import dayjsLocaleDE from "dayjs/locale/de";
import dayjsLocaleEN from "dayjs/locale/en";
import dayjsLocaleES from "dayjs/locale/es";
import dayjsLocaleFR from "dayjs/locale/fr";
import dayjsLocaleIT from "dayjs/locale/it";
import dayjsLocaleNL from "dayjs/locale/nl";
import dayjsLocalePT from "dayjs/locale/pt";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import { P, match } from "ts-pattern";
import { CombinedError } from "urql";
import rejectionTranslationDE from "../../../../scripts/graphql/locales/de.json";
import rejectionTranslationEN from "../../../../scripts/graphql/locales/en.json";
import rejectionTranslationES from "../../../../scripts/graphql/locales/es.json";
import rejectionTranslationFR from "../../../../scripts/graphql/locales/fr.json";
import rejectionTranslationIT from "../../../../scripts/graphql/locales/it.json";
import rejectionTranslationNL from "../../../../scripts/graphql/locales/nl.json";
import rejectionTranslationPT from "../../../../scripts/graphql/locales/pt.json";
import translationDE from "../locales/de.json";
import translationEN from "../locales/en.json";
import translationES from "../locales/es.json";
import translationFR from "../locales/fr.json";
import translationIT from "../locales/it.json";
import translationNL from "../locales/nl.json";
import translationPT from "../locales/pt.json";

const allTranslationEN = { ...translationEN, ...rejectionTranslationEN };
const allTranslationDE = { ...translationDE, ...rejectionTranslationDE };
const allTranslationES = { ...translationES, ...rejectionTranslationES };
const allTranslationFR = { ...translationFR, ...rejectionTranslationFR };
const allTranslationIT = { ...translationIT, ...rejectionTranslationIT };
const allTranslationNL = { ...translationNL, ...rejectionTranslationNL };
const allTranslationPT = { ...translationPT, ...rejectionTranslationPT };

// https://day.js.org/docs/en/plugin/plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const supportedLanguages = ["en", "es", "de", "fr", "it", "nl", "pt"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

export type TranslationKey = keyof typeof allTranslationEN;

const translationKeys = Object.keys(translationEN);
const isTranslationKey = (key: string): key is TranslationKey => translationKeys.includes(key);

type Locale = {
  language: SupportedLanguage;
  translations: Record<string, string>;
  dayjsLocale: ILocale;
  dateFormat: DateFormat;
  datePlaceholder: string;
  timeFormat: string;
  timePlaceholder: string;
  taxIdentificationNumberPlaceholder: string;
};

const locales: Record<SupportedLanguage, () => Locale> = {
  en: () => ({
    language: "en",
    translations: allTranslationEN,
    dayjsLocale: dayjsLocaleEN,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  de: () => ({
    language: "de",
    translations: allTranslationDE,
    dayjsLocale: dayjsLocaleDE,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  fr: () => ({
    language: "fr",
    translations: allTranslationFR,
    dayjsLocale: dayjsLocaleFR,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "JJ/MM/AAAA",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  it: () => ({
    language: "it",
    translations: allTranslationIT,
    dayjsLocale: dayjsLocaleIT,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  nl: () => ({
    language: "nl",
    translations: allTranslationNL,
    dayjsLocale: dayjsLocaleNL,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  es: () => ({
    language: "es",
    translations: allTranslationES,
    dayjsLocale: dayjsLocaleES,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
  }),
  pt: () => ({
    language: "pt",
    translations: allTranslationPT,
    dayjsLocale: dayjsLocalePT,
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/YYYY",
    timeFormat: "HH:mm:ss",
    timePlaceholder: "HH:mm:ss",
    taxIdentificationNumberPlaceholder: "XXX/XXXX/XXXX",
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

export const t = (key: TranslationKey, params?: Record<string, string | number>) =>
  intl.formatMessage({ id: key, defaultMessage: allTranslationEN[key] }, params).toString();

export const translateError = (error: unknown) => {
  const key = match(error)
    .with(P.string, __typename => {
      return `rejection.${__typename}`;
    })
    .with({ __typename: P.string }, ({ __typename }) => {
      return `rejection.${__typename}`;
    })
    .with(P.instanceOf(CombinedError), ({ response }: { response?: Partial<Response> }) => {
      const status = response?.status;
      return typeof status === "number" ? `error.network.${status}` : "error.generic";
    })
    .with(P.instanceOf(Error), ({ message }) => {
      return `rejection.${message}`;
    })
    .otherwise(() => "error.generic");

  return t(isTranslationKey(key) ? key : "error.generic");
};

type DateTimeFormat = "LTS" | "LT" | "L" | "LL" | "LLL" | "LLLL" | "l" | "ll" | "lll" | "llll";

export const formatDateTime = memoize(
  (date: Date, format: DateTimeFormat) => dayjs(date).format(format),
  (date: Date, format: DateTimeFormat) => `${date.toString()} - ${format}`,
);

export const formatCurrency = (value: number, currency: string) =>
  intl.formatNumber(value, { style: "currency", currency });

export const formatNestedMessage = (
  key: TranslationKey,
  params: Record<string, string | number | ReactElement | ((children: ReactNode) => ReactNode)>,
) => {
  const result = intl.formatMessage(
    { id: key, defaultMessage: allTranslationEN[key] },
    // @ts-expect-error
    params,
  );

  const resultArray: (string | ReactElement)[] = typeof result === "string" ? [result] : result;

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

type Language = {
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
];
