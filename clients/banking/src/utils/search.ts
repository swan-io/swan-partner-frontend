import { pick } from "@swan-io/lake/src/utils/object";
import { deburr, words } from "@swan-io/lake/src/utils/string";

const normalizeText = (text: string) => deburr(text.toLowerCase().trim());

export const searchInProperties = <T extends Record<string, unknown>>(
  data: T[],
  keys: (keyof T)[],
  search: string,
): T[] => {
  const searchWords = words(normalizeText(search));

  return data.filter(item => {
    const searchTarget = Object.values(pick(item, keys))
      .map(elem => (typeof elem !== "string" ? "" : normalizeText(elem)))
      .filter(elem => elem !== "")
      .join(" ");

    return searchWords.every(word => searchTarget.includes(word));
  });
};
