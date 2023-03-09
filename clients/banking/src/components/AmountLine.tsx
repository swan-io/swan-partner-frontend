import { Text, TextProps } from "react-native";
import { Scalars } from "../graphql/partner";
import { formatCurrency } from "../utils/i18n";

type Props = TextProps & {
  displayPositiveSign?: boolean;
  amount: number;
  currency: Scalars["Currency"];
};

export const AmountLine = ({ amount, currency, displayPositiveSign = false, ...props }: Props) => (
  <Text numberOfLines={1} {...props}>
    {Boolean(displayPositiveSign && amount > 0) && "+"}
    {formatCurrency(amount, currency)}
  </Text>
);
