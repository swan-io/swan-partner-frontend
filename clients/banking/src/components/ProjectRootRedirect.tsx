import { AsyncData, Result } from "@swan-io/boxed";
import { ClientContext, useQuery } from "@swan-io/graphql-client";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { usePersistedState } from "@swan-io/lake/src/hooks/usePersistedState";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { GetFirstAccountMembershipDocument } from "../graphql/partner";
import { AccountNotFoundPage } from "../pages/NotFoundPage";
import { env } from "../utils/env";
import { partnerAdminClient } from "../utils/gql";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { Redirect } from "./Redirect";
import { SandboxUserPicker } from "./SandboxUserPicker";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
});

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

  const [data] = useQuery(GetFirstAccountMembershipDocument, {
    filters: {
      status: ["BindingUserError", "ConsentPending", "Enabled", "InvitationSent"],
    },
  });

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
      const state = match(accountMembershipState)
        .with({ accountMembershipId: P.string, userId: P.optional(P.string) }, value =>
          value.userId === data.user?.id ? value : undefined,
        )
        .otherwise(() => undefined);

      // source = onboarding is set by packages/onboarding/src/pages/PopupCallbackPage.tsx
      if (isNotNullish(state) && source === "onboarding") {
        return (
          <Redirect
            to={Router.AccountActivation({ accountMembershipId: state.accountMembershipId })}
          />
        );
      }

      // ignore localStorage if finishing an onboarding, in this case we want to
      // redirect to the newly created membership
      if (isNotNullish(state) && source !== "invitation") {
        return (
          <Redirect to={Router.AccountRoot({ accountMembershipId: state.accountMembershipId })} />
        );
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
        <ResponsiveContainer breakpoint={breakpoints.large} style={styles.container}>
          {({ large }) => (
            <AccountNotFoundPage projectName={projectName} large={large}>
              {env.APP_TYPE === "SANDBOX" ? (
                <>
                  <ClientContext.Provider value={partnerAdminClient}>
                    <SandboxUserPicker />
                    <Space height={24} />
                  </ClientContext.Provider>
                </>
              ) : null}
            </AccountNotFoundPage>
          )}
        </ResponsiveContainer>
      );
    })
    .exhaustive();
};
