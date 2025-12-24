import { Lazy, Result } from "@swan-io/boxed";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { Country, countries } from "@swan-io/shared-business/src/constants/countries";
import { getMostLikelyUserCountry } from "@swan-io/shared-business/src/utils/localization";
import { E164Number, parsePhoneNumberWithError } from "libphonenumber-js";

export const parsePhoneNumber = (value?: string): { country: Country; nationalNumber: string } => {
  const fallback = Lazy(() => ({ country: getMostLikelyUserCountry(), nationalNumber: "" }));

  if (isNullish(value) || value.trim() === "") {
    return fallback.get();
  }

  try {
    const phoneNumber = parsePhoneNumberWithError(value);
    const { countryCallingCode, nationalNumber } = phoneNumber;

    if (!phoneNumber.isValid()) {
      return fallback.get();
    }

    const country = countries.find(
      ({ cca2, idd }) => countryCallingCode === idd && phoneNumber.country === cca2,
    );

    return isNullish(country)
      ? fallback.get()
      : { country, nationalNumber: String(nationalNumber).replace(/[^0-9]/g, "") };
  } catch {
    return fallback.get();
  }
};

export const prefixPhoneNumber = (country: Country, nationalNumber: string) => {
  const sanitized = nationalNumber.replace(/[^+0-9]/g, "");

  return Result.fromExecution<{ valid: true; e164: E164Number } | { valid: false }>(() => {
    const phoneNumber = parsePhoneNumberWithError(sanitized, { defaultCallingCode: country.idd });

    return phoneNumber.isValid() ? { valid: true, e164: phoneNumber.number } : { valid: false };
  }).getOr({ valid: false });
};

export const maskPhoneNumber = (value: string) =>
  value.replace(
    /(\d{3})(\d+)(\d{3})/,
    (_, $1: string, $2: string, $3: string) => `${$1}${"*".repeat($2.length)}${$3}`,
  );
