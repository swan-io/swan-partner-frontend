import dayjs from "dayjs";

export const getMonthlySpendingDate = (spendingDay: number, hour: number) => {
  const today = dayjs();

  const spendingDate = dayjs()
    .startOf("month")
    .add(spendingDay - 1, "day")
    .add(hour, "hour");

  // if the spendingDay will occurs on the current month
  if (today.isBefore(spendingDate)) {
    const daysInMonth = dayjs().daysInMonth();
    // which means the day doesn't exist
    if (spendingDay > daysInMonth) {
      // the spendingDay should occurs the last day of the month
      return dayjs()
        .startOf("month")
        .date(daysInMonth)
        .format("LLL");
    } else {
      // which means the spendingDate exists
      return spendingDate.format("LLL");
    }
  } else {
    // if the spendingDate is before today, it will occurs next month
    return spendingDate.add(1, "M").format("LLL");
  }
};
