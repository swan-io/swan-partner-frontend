export const MIN_SEARCH_LENGTH = 3;

/**
 * The trimmed value is too short to be sent (an empty value is not, it clears the search)
 */
export const isSearchTooShort = (value: string): boolean => {
  const { length } = value.trim();
  return length > 0 && length < MIN_SEARCH_LENGTH;
};

/**
 * The search to send to the API: the trimmed value, or an empty string when it is too short
 */
export const toSearchQuery = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : "";
};

/**
 * The search to put in the query variables: the trimmed value, or `undefined` when it is empty or too short.
 * Applied where the variables are built, so a short search coming from the URL is not sent either
 */
export const toSearchFilter = (value: string | undefined): string | undefined => {
  const query = toSearchQuery(value ?? "");
  return query === "" ? undefined : query;
};
