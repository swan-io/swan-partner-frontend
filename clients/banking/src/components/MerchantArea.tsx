import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Breadcrumbs, BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantRootDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantIntro } from "./MerchantIntro";
import { MerchantList } from "./MerchantList";
import { AccountMerchantsProfileArea } from "./MerchantProfileArea";
import { MerchantProfileRequestWizard } from "./MerchantProfileRequestWizard";
import { Redirect } from "./Redirect";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  header: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
  },
  headerDesktop: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[24],
    paddingBottom: spacings[12],
  },
});

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
  const [merchantProfiles] = useQuery(MerchantRootDocument, { accountId });

  const route = Router.useRoute([
    "AccountMerchantsRoot",
    "AccountMerchantsList",
    "AccountMerchantsProfileArea",
  ]);

  const merchantProfileConnection = merchantProfiles.mapOk(data =>
    Option.fromNullable(data.account)
      .flatMap(account => Option.fromNullable(account.merchantProfiles))
      .getOr({ __typename: "MerchantProfileConnection", totalCount: 0, edges: [] }),
  );

  const rootLevelCrumbs = useMemo(
    () => [
      {
        label: t("merchantProfile.root.title"),
        link: Router.AccountMerchantsList({ accountMembershipId }),
      },
    ],
    [accountMembershipId],
  );

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <BreadcrumbsRoot rootLevelCrumbs={rootLevelCrumbs}>
          {match(merchantProfileConnection)
            .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
            .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
              <ErrorView error={error} />
            ))
            .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
              return (
                <>
                  {data.totalCount > 1 ? (
                    <View style={[styles.header, large && styles.headerDesktop]}>
                      <Breadcrumbs />
                    </View>
                  ) : null}

                  {match(route)
                    .with({ name: "AccountMerchantsRoot" }, ({ params }) =>
                      match(data)
                        .with(
                          { totalCount: 1, edges: [P.select()] },
                          ({ node: { id: merchantProfileId } }) => (
                            <Redirect
                              to={Router.AccountMerchantsProfileSettings({
                                accountMembershipId,
                                merchantProfileId,
                              })}
                            />
                          ),
                        )
                        .with({ totalCount: 0 }, () => {
                          if (merchantProfileCreationVisible) {
                            return (
                              <>
                                <MerchantIntro accountMembershipId={accountMembershipId} />

                                <FullViewportLayer visible={params.new === "true"}>
                                  <MerchantProfileRequestWizard
                                    onPressClose={() =>
                                      Router.push("AccountMerchantsRoot", { accountMembershipId })
                                    }
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
                        .otherwise(() => {
                          return (
                            <Redirect
                              to={Router.AccountMerchantsList({
                                accountMembershipId,
                              })}
                            />
                          );
                        }),
                    )
                    .with({ name: "AccountMerchantsList" }, ({ params: { status = "Active" } }) => (
                      <MerchantList
                        accountId={accountId}
                        accountMembershipId={accountMembershipId}
                        params={{ status }}
                      />
                    ))
                    .with(
                      { name: "AccountMerchantsProfileArea" },
                      ({ params: { merchantProfileId } }) => (
                        <AccountMerchantsProfileArea
                          accountMembershipId={accountMembershipId}
                          merchantProfileId={merchantProfileId}
                          merchantProfileCardVisible={merchantProfileCardVisible}
                          merchantProfileSepaDirectDebitCoreVisible={
                            merchantProfileSepaDirectDebitCoreVisible
                          }
                          merchantProfileSepaDirectDebitB2BVisible={
                            merchantProfileSepaDirectDebitB2BVisible
                          }
                          merchantProfileInternalDirectDebitCoreVisible={
                            merchantProfileInternalDirectDebitCoreVisible
                          }
                          merchantProfileInternalDirectDebitB2BVisible={
                            merchantProfileInternalDirectDebitB2BVisible
                          }
                          merchantProfileCheckVisible={merchantProfileCheckVisible}
                        />
                      ),
                    )
                    .with(P.nullish, () => <NotFoundPage />)
                    .exhaustive()}
                </>
              );
            })
            .exhaustive()}
        </BreadcrumbsRoot>
      )}
    </ResponsiveContainer>
  );
};
