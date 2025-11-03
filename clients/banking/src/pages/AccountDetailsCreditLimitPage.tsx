import { CreditLimitIntro } from "../components/CreditLimitIntro";

type Props = {
  accountId: string;
  accountMembershipId: string;
};

export const AccountDetailsCreditLimitPage = ({ accountMembershipId }: Props) => {
  return <CreditLimitIntro accountMembershipId={accountMembershipId} />;
};
