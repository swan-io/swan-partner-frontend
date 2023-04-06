import dayjs from "dayjs";
import { locale } from "./i18n";

export const decodeDate = (value: string) => {
  const date = dayjs.utc(value, "YYYY-MM-DD");
  return date.isValid() ? date.format(locale.dateFormat) : "";
};

export const encodeDate = (value: string) => {
  const date = dayjs.utc(value, locale.dateFormat);
  return date.isValid() ? date.format("YYYY-MM-DD") : "";
};

export const encodeDateTime = (date: string, time: string) => {
  const dateTime = dayjs(`${date} ${time}`, `${locale.dateFormat} ${locale.timeFormat}`);
  return dateTime.isValid() ? dateTime.toISOString() : "";
};

export const isToday = (date: string) => {
  const today = dayjs().format(locale.dateFormat);
  return date === today;
};
