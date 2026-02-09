import { isNotNullish } from "@swan-io/lake/src/utils/nullish";

let fallbackStorage: Record<string, string> = {
  PHONE_NUMBER_KEY: "",
};

// Wrappers for Safari in private browsing
export const getLocalStorageItem = (key: string): string | undefined => {
  try {
    const value = localStorage.getItem(key);

    if (isNotNullish(value)) {
      fallbackStorage[key] = value;
    }

    return value ?? fallbackStorage[key] ?? undefined;
  } catch {
    return fallbackStorage[key];
  }
};

export const setLocalStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
    fallbackStorage[key] = value;
  } catch {
    fallbackStorage[key] = value;
  }
};

export const removeLocalStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
    delete fallbackStorage[key];
  } catch {
    delete fallbackStorage[key];
  }
};

const PHONE_NUMBER_KEY = "swan__PhoneNumber";
export const usePhoneNumber = () => {
  return {
    setPhoneNumber: (value: string) => {
      setLocalStorageItem(PHONE_NUMBER_KEY, value);
    },
    getPhoneNumber: () => getLocalStorageItem(PHONE_NUMBER_KEY),
    removePhoneNumber: () => removeLocalStorageItem(PHONE_NUMBER_KEY),
  };
};
