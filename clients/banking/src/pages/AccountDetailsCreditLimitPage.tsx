import { CreditLimitIntro } from "../components/CreditLimitIntro";

type Props = {
  accountId: string;
  accountMembershipId: string;
};

export const AccountDetailsCreditLimitPage = ({ accountId }: Props) => {
  return <CreditLimitIntro accountId={accountId} />;
};
