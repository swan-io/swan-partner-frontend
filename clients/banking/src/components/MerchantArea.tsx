import { P, match } from "ts-pattern";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Router } from "../utils/routes";
import { MerchantRoot } from "./MerchantRoot";

type Props = {
  accountId: string;
  accountMembershipId: string;
  merchantProfileCreationVisible: boolean;
  merchantProfileCardVisible: boolean;
  merchantProfileSepaDirectDebitCoreVisible: boolean;
  merchantProfileSepaDirectDebitB2BVisible: boolean;
  merchantProfileInternalDirectDebitCoreVisible: boolean;
  merchantProfileInternalDirectDebitB2BVisible: boolean;
  merchantProfileCheckVisible: boolean;
};

export const MerchantArea = ({
  accountId,
  accountMembershipId,
  merchantProfileCreationVisible,
}: Props) => {
  const route = Router.useRoute(["AccountMerchantsRoot"]);

  return match(route)
    .with({ name: "AccountMerchantsRoot" }, ({ params }) => (
      <MerchantRoot
        accountId={accountId}
        accountMembershipId={accountMembershipId}
        merchantProfileCreationVisible={merchantProfileCreationVisible}
        isWizardOpen={params.new === "true"}
      />
    ))
    .with(P.nullish, () => <NotFoundPage />)
    .exhaustive();
};
