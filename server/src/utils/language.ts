// From https://github.com/opentable/accept-language-parser
const ACCEPT_LANGUAGE_REGEX = /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g;

const isNotNullish = <T>(value: T | undefined): value is T => value != null;

const parseAcceptLanguageHeader = (acceptLanguage: string | undefined): string[] =>
  acceptLanguage
    ?.match(ACCEPT_LANGUAGE_REGEX)
    ?.map(item => {
      const [tag = "", q] = item.split(";");
      const quality = Number.parseFloat(q?.split("=")[1] ?? "1");

      if (tag !== "" && Number.isFinite(quality)) {
        return { tag, quality };
      }
    }, [])
    .filter(isNotNullish)
    .sort((a, b) => b.quality - a.quality)
    .map(item => {
      const parts = item.tag.split("-");
      const language = parts[0]?.toLowerCase() ?? "";

      if (language !== "") {
        return language;
      }
    })
    .filter(isNotNullish) ?? [];

const supportedLanguages = ["en", "fr"];

export const findBestLanguage = (acceptLanguage: string | undefined): string => {
  const languages = parseAcceptLanguageHeader(acceptLanguage);
  return languages.find(language => supportedLanguages.includes(language)) ?? "en"; // fallback to en if no match
};
