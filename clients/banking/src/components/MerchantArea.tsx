import { P, match } from "ts-pattern";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Router } from "../utils/routes";
import { AccountMerchantsProfileArea } from "./MerchantProfileArea";
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
  merchantProfileCardVisible,
  merchantProfileSepaDirectDebitCoreVisible,
  merchantProfileSepaDirectDebitB2BVisible,
  merchantProfileInternalDirectDebitCoreVisible,
  merchantProfileInternalDirectDebitB2BVisible,
  merchantProfileCheckVisible,
}: Props) => {
  const route = Router.useRoute(["AccountMerchantsRoot", "AccountMerchantsProfileArea"]);

  return match(route)
    .with({ name: "AccountMerchantsRoot" }, ({ params }) => (
      <MerchantRoot
        accountId={accountId}
        accountMembershipId={accountMembershipId}
        merchantProfileCreationVisible={merchantProfileCreationVisible}
        isWizardOpen={params.new === "true"}
      />
    ))
    .with({ name: "AccountMerchantsProfileArea" }, ({ params: { merchantProfileId } }) => (
      <AccountMerchantsProfileArea
        accountMembershipId={accountMembershipId}
        merchantProfileId={merchantProfileId}
        merchantProfileCardVisible={merchantProfileCardVisible}
        merchantProfileSepaDirectDebitCoreVisible={merchantProfileSepaDirectDebitCoreVisible}
        merchantProfileSepaDirectDebitB2BVisible={merchantProfileSepaDirectDebitB2BVisible}
        merchantProfileInternalDirectDebitCoreVisible={
          merchantProfileInternalDirectDebitCoreVisible
        }
        merchantProfileInternalDirectDebitB2BVisible={merchantProfileInternalDirectDebitB2BVisible}
        merchantProfileCheckVisible={merchantProfileCheckVisible}
      />
    ))
    .with(P.nullish, () => <NotFoundPage />)
    .exhaustive();
};
