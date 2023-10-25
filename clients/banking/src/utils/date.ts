import dayjs from "dayjs";
import { locale } from "./i18n";

export const encodeDateTime = (date: string, time: string) => {
  const dateTime = dayjs(`${date} ${time}`, `${locale.dateFormat} ${locale.timeFormat}`);
  return dateTime.isValid() ? dateTime.toISOString() : "";
};

export const isToday = (date: string) => {
  const today = dayjs().format(locale.dateFormat);
  return date === today;
};
