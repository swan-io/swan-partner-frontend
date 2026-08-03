import { Result } from "@swan-io/boxed";
import { Country } from "@swan-io/shared-business/src/constants/countries";
import { E164Number, parsePhoneNumberWithError } from "libphonenumber-js";

export const prefixPhoneNumber = (country: Country, nationalNumber: string) => {
  const sanitized = nationalNumber.replace(/[^+0-9]/g, "");

  return Result.fromExecution<{ valid: true; e164: E164Number } | { valid: false }>(() => {
    const phoneNumber = parsePhoneNumberWithError(sanitized, { defaultCallingCode: country.idd });

    return phoneNumber.isValid() ? { valid: true, e164: phoneNumber.number } : { valid: false };
  }).getOr({ valid: false });
};
