import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithCurrentColor } from "@swan-io/lake/src/components/WithCurrentColor";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, invariantColors } from "@swan-io/lake/src/constants/design";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { CreditLimitRequestDocument } from "../graphql/partner";
import { PermissionProvider } from "../hooks/usePermissions";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { WizardLayout } from "./WizardLayout";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  notLegalRepresentativeContainer: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
    alignItems: "center",
    justifyContent: "center",
  },
  successContainer: {
    ...commonStyles.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    display: "flex",
  },
  languagesSelect: {
    alignItems: "flex-end",
  },
});

const languageOptions = languages.map(country => ({
  name: country.native,
  value: country.id,
}));

type Props = {
  accountId: string;
};

export const RequestCreditLimit = ({ accountId }: Props) => {
  const [data, { setVariables }] = useQuery(CreditLimitRequestDocument, { accountId, first: 20 });

  useEffect(() => {
    match(data)
      .with(AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable }))), ({ user }) => {
        if (
          user.accountMemberships.pageInfo.hasNextPage === true &&
          !user.accountMemberships.edges.some(membership => membership.node.accountId === accountId)
        ) {
          setVariables({ after: user.accountMemberships.pageInfo.endCursor });
        }
      })
      .otherwise(() => {});
  }, [accountId, data, setVariables]);

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(
      AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable, account: P.nonNullable }))),
      ({ user, account, projectInfo }) => {
        const isLegalRepresentative = account.legalRepresentativeMembership.user?.id === user.id;
        const accentColor = projectInfo.accentColor ?? invariantColors.defaultAccentColor;

        const userMembershipIdOnCurrentAccount = Array.findMap(
          user.accountMemberships.edges,
          membership =>
            membership.node.accountId === accountId
              ? Option.Some(membership.node.id)
              : Option.None(),
        );

        const legalRepresentativeName = Option.fromNullable(
          account.legalRepresentativeMembership.user,
        ).flatMap(user => Option.fromNullable(user.fullName));

        return (
          <PermissionProvider
            value={Option.Some({
              accountMembership: account.legalRepresentativeMembership,
              settings: projectInfo.webBankingSettings,
            })}
          >
            <WithPartnerAccentColor color={accentColor}>
              {isLegalRepresentative ? (
                <View style={styles.container}>
                  <WizardLayout
                    title={t("accountClose.closeAccount")}
                    onPressClose={userMembershipIdOnCurrentAccount
                      .map(accountMembershipId => {
                        return () =>
                          Router.push("AccountRoot", {
                            accountMembershipId,
                          });
                      })
                      .toUndefined()}
                    headerEnd={
                      <View>
                        <LakeSelect
                          value={locale.language}
                          items={languageOptions}
                          hideErrors={true}
                          mode="borderless"
                          style={styles.languagesSelect}
                          onValueChange={locale => {
                            setPreferredLanguage(locale);
                          }}
                        />
                      </View>
                    }
                  >
                    {({ large }) => (
                      <>
                        <RequestCreditLimitForm accountId={accountId} />
                        <Space height={24} />
                      </>
                    )}
                  </WizardLayout>
                </View>
              ) : (
                <WithCurrentColor variant="negative" style={styles.notLegalRepresentativeContainer}>
                  <EmptyView
                    icon="dismiss-circle-regular"
                    borderedIcon={true}
                    borderedIconPadding={20}
                    title={t("accountClose.notLegalRepresentative.title")}
                    subtitle={match(legalRepresentativeName)
                      .with(Option.P.Some(P.select()), legalRepresentativeName =>
                        t("accountClose.notLegalRepresentative.description.withName", {
                          legalRepresentativeName,
                          legalRepresentativeEmail: account.legalRepresentativeMembership.email,
                        }),
                      )
                      .otherwise(() => t("accountClose.notLegalRepresentative.description"))}
                  >
                    {userMembershipIdOnCurrentAccount
                      .map(accountMembershipId => {
                        return (
                          <LakeButtonGroup>
                            <LakeButton
                              onPress={() => Router.push("AccountRoot", { accountMembershipId })}
                              mode="secondary"
                            >
                              {t("common.closeButton")}
                            </LakeButton>
                          </LakeButtonGroup>
                        );
                      })
                      .toNull()}
                  </EmptyView>
                </WithCurrentColor>
              )}
            </WithPartnerAccentColor>
          </PermissionProvider>
        );
      },
    )
    .otherwise(() => null);
};
