import { GetRouteParams } from "../utils/routes";

type Props = {
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
  large: boolean;
};

export const MerchantProfilePaymentsArea = ({ params, large }: Props) => {
  return <p>payments</p>;
};
