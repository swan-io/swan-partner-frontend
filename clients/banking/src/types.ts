export type PaymentMethodIcon = "card" | "transfer";

export type TransactionVariant =
  | "pending"
  | "rejected"
  | "bookedCredit"
  | "bookedDebit"
  | "canceled"
  | "upcoming"
  | "released";
