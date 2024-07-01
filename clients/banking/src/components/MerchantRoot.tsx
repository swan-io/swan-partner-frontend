import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { P, match } from "ts-pattern";
import { MerchantRootDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantIntro } from "./MerchantIntro";
import { MerchantProfileRequestWizard } from "./MerchantProfileRequestWizard";
import { Redirect } from "./Redirect";

type Props = {
  accountMembershipId: string;
  accountId: string;
  merchantProfileCreationVisible: boolean;
  isWizardOpen: boolean;
};

export const MerchantRoot = ({
  accountId,
  accountMembershipId,
  merchantProfileCreationVisible,
  isWizardOpen,
}: Props) => {
  const [merchantProfiles] = useQuery(MerchantRootDocument, { accountId });

  const firstMerchantProfileId = merchantProfiles.mapOk(data =>
    Option.fromNullable(data.account)
      .flatMap(account => Option.fromNullable(account.merchantProfiles))
      .flatMap(merchantProfiles =>
        Array.findMap(merchantProfiles.edges, item => Option.Some(item.node.id)),
      ),
  );

  return match(firstMerchantProfileId)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(Option.P.Some(P.select()))), merchantProfileId => (
      <Redirect
        to={Router.AccountMerchantsItemPaymentsRoot({ accountMembershipId, merchantProfileId })}
      />
    ))
    .with(AsyncData.P.Done(Result.P.Ok(Option.P.None)), () => {
      if (merchantProfileCreationVisible) {
        return (
          <>
            <MerchantIntro accountMembershipId={accountMembershipId} />

            <FullViewportLayer visible={isWizardOpen}>
              <MerchantProfileRequestWizard
                onPressClose={() => Router.push("AccountMerchantsRoot", { accountMembershipId })}
                accountId={accountId}
                accountMembershipId={accountMembershipId}
              />
            </FullViewportLayer>
          </>
        );
      } else {
        // Not supposed to happen
        return <NotFoundPage />;
      }
    })
    .exhaustive();
};
