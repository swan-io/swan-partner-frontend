import { usePersistedState } from "@swan-io/lake/src/hooks/usePersistedState";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { match, P } from "ts-pattern";
import { GetFirstAccountMembershipDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import { useQueryWithErrorBoundary } from "../utils/urql";
import { Redirect } from "./Redirect";

type Props = {
  to?: string;
  source?: string;
};

export const ProjectRootRedirect = ({ to, source }: Props) => {
  const [accountMembershipState] = usePersistedState<unknown>(
    `swan_session_webBankingAccountMembershipState${projectConfiguration.match({
      Some: ({ projectId }) => `_${projectId}`,
      None: () => ``,
    })}`,
    {},
  );

  const [{ data }] = useQueryWithErrorBoundary({
    query: GetFirstAccountMembershipDocument,
    variables: {
      filters: {
        status: ["BindingUserError", "ConsentPending", "Enabled", "InvitationSent"],
      },
    },
  });

  const state = match(accountMembershipState)
    .with({ accountMembershipId: P.string }, value => value)
    .otherwise(() => undefined);

  // source = onboarding is set by packages/onboarding/src/pages/PopupCallbackPage.tsx
  if (isNotNullish(state) && source === "onboarding") {
    return (
      <Redirect to={Router.AccountActivation({ accountMembershipId: state.accountMembershipId })} />
    );
  }

  // ignore localStorage if finishing an onboarding, in this case we want to
  // redirect to the newly created membership
  if (isNotNullish(state) && source !== "invitation") {
    return <Redirect to={Router.AccountRoot({ accountMembershipId: state.accountMembershipId })} />;
  }

  const accountMembershipId = data?.user?.accountMemberships.edges[0]?.node.id;

  if (isNotNullish(accountMembershipId)) {
    return (
      <Redirect
        to={match(to)
          .with("payments", () => Router.AccountPaymentsRoot({ accountMembershipId }))
          .with("members", () => Router.AccountMembersList({ accountMembershipId }))
          .otherwise(() => Router.AccountRoot({ accountMembershipId }))}
      />
    );
  }

  const projectName = data?.projectInfo?.name ?? "";

  return (
    <NotFoundPage
      title={t("error.noAccount")}
      text={t("error.checkWithProvider", { projectName })}
    />
  );
};
