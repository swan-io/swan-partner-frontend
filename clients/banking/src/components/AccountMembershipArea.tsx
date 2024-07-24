import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Request } from "@swan-io/request";
import { useCallback, useEffect, useMemo } from "react";
import { P, match } from "ts-pattern";
import {
  AccountAreaDocument,
  LastRelevantIdentificationDocument,
  UpdateAccountLanguageDocument,
} from "../graphql/partner";
import { getIdentificationLevelStatusInfo } from "../utils/identification";
import { Router } from "../utils/routes";
import { useTgglFlag } from "../utils/tggl";
import { AccountArea } from "./AccountArea";
import { AccountActivationTag } from "./AccountPicker";
import { ErrorView } from "./ErrorView";

type Props = {
  accountMembershipId: string;
};

const COOKIE_REFRESH_INTERVAL = 30000; // 30s

export const AccountMembershipArea = ({ accountMembershipId }: Props) => {
  const [data, { query }] = useDeferredQuery(AccountAreaDocument);
  const [lastRelevantIdentification, { query: queryLastRelevantIdentification }] = useDeferredQuery(
    LastRelevantIdentificationDocument,
  );

  const isMerchantFlagActive = useTgglFlag("merchantWebBanking").getOr(false);

  const [updateAccountLanguage] = useMutation(UpdateAccountLanguageDocument);

  useEffect(() => {
    const request = query({ accountMembershipId })
      .mapOkToResult(data => {
        const accountMembership = Option.fromNullable(data.accountMembership);
        const user = Option.fromNullable(data.user);

        return Option.allFromDict({ accountMembership, user }).toResult(
          new Error("No available user / account membership"),
        );
      })
      .tapOk(({ accountMembership, user }) => {
        if (accountMembership.user?.id !== user.id) {
          Router.replace("ProjectRootRedirect");
        }

        const hasRequiredIdentificationLevel =
          accountMembership?.hasRequiredIdentificationLevel ?? undefined;
        const recommendedIdentificationLevel = accountMembership?.recommendedIdentificationLevel;

        const accountId = accountMembership?.account?.id;
        const language = accountMembership?.account?.language;
        const iban = accountMembership?.account?.IBAN;
        const bankDetails = accountMembership?.account?.bankDetails;

        if (accountId != null && language != null && iban != null && bankDetails == null) {
          void updateAccountLanguage({ id: accountId, language });
        }

        if (hasRequiredIdentificationLevel === false) {
          return queryLastRelevantIdentification({
            accountMembershipId,
            identificationProcess: recommendedIdentificationLevel,
          });
        }
      });

    return () => request.cancel();
  }, [accountMembershipId, query, queryLastRelevantIdentification, updateAccountLanguage]);

  const reload = useCallback(() => {
    query({ accountMembershipId }).tapOk(({ accountMembership }) => {
      const hasRequiredIdentificationLevel =
        accountMembership?.hasRequiredIdentificationLevel ?? undefined;
      const recommendedIdentificationLevel = accountMembership?.recommendedIdentificationLevel;

      const accountId = accountMembership?.account?.id;
      const language = accountMembership?.account?.language;
      const iban = accountMembership?.account?.IBAN;
      const bankDetails = accountMembership?.account?.bankDetails;

      if (accountId != null && language != null && iban != null && bankDetails == null) {
        void updateAccountLanguage({ id: accountId, language });
      }

      if (hasRequiredIdentificationLevel === false) {
        queryLastRelevantIdentification({
          accountMembershipId,
          identificationProcess: recommendedIdentificationLevel,
        });
      }
    });
  }, [accountMembershipId, query, queryLastRelevantIdentification, updateAccountLanguage]);

  // Call API to extend cookie TTL
  useEffect(() => {
    const intervalId = setInterval(() => {
      Request.make({ url: "/api/ping", method: "POST", withCredentials: true });
    }, COOKIE_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const info = useMemo(
    () =>
      data
        .flatMapOk(data =>
          match(lastRelevantIdentification)
            .with(AsyncData.P.Loading, () => AsyncData.Loading())
            .with(AsyncData.P.Done(Result.P.Error(P.select())), error =>
              AsyncData.Done(Result.Error(error)),
            )
            .otherwise(() =>
              AsyncData.Done(
                Result.Ok({
                  data,
                  lastRelevantIdentification: lastRelevantIdentification
                    .toOption()
                    .flatMap(result => result.toOption())
                    .flatMap(value =>
                      Option.fromNullable(
                        value.accountMembership?.user?.identifications?.edges?.[0]?.node,
                      ),
                    ),
                }),
              ),
            ),
        )
        .mapOkToResult(({ data, lastRelevantIdentification }) => {
          return match(data)
            .with(
              {
                user: P.nonNullable,
                accountMembership: { user: P.nonNullable },
              },
              ({ accountMembership, projectInfo, user }) => {
                const {
                  canInitiatePayments,
                  canManageBeneficiaries,
                  canManageCards,
                  canViewAccount,
                  canManageAccountMembership,
                } = accountMembership;

                // ID verification should be hidden from users when the project
                // has a `B2BMembershipIDVerification` set to `false` and that
                // no sensitive permission is one
                const shouldDisplayIdVerification = !(
                  projectInfo.B2BMembershipIDVerification === false &&
                  canManageAccountMembership === false &&
                  canInitiatePayments === false &&
                  canManageBeneficiaries === false &&
                  canManageCards === false
                );

                const webBankingSettings = projectInfo.webBankingSettings;

                const features = {
                  accountStatementsVisible: webBankingSettings?.accountStatementsVisible ?? false,
                  accountVisible: webBankingSettings?.accountVisible ?? false,
                  transferCreationVisible: webBankingSettings?.transferCreationVisible ?? false,
                  paymentListVisible: webBankingSettings?.paymentListVisible ?? false,
                  virtualIbansVisible: webBankingSettings?.virtualIbansVisible ?? false,
                  memberCreationVisible: webBankingSettings?.memberCreationVisible ?? false,
                  memberListVisible: webBankingSettings?.memberListVisible ?? false,
                  physicalCardOrderVisible: webBankingSettings?.physicalCardOrderVisible ?? false,
                  virtualCardOrderVisible: webBankingSettings?.virtualCardOrderVisible ?? false,
                  merchantProfileCreationVisible:
                    webBankingSettings?.merchantProfileCreationVisible ?? false,
                  merchantProfileCardVisible:
                    webBankingSettings?.merchantProfileCardVisible ?? false,
                  merchantProfileSepaDirectDebitCoreVisible:
                    webBankingSettings?.merchantProfileSepaDirectDebitCoreVisible ?? false,
                  merchantProfileSepaDirectDebitB2BVisible:
                    webBankingSettings?.merchantProfileSepaDirectDebitB2BVisible ?? false,
                  merchantProfileInternalDirectDebitCoreVisible:
                    webBankingSettings?.merchantProfileInternalDirectDebitCoreVisible ?? false,
                  merchantProfileInternalDirectDebitB2BVisible:
                    webBankingSettings?.merchantProfileInternalDirectDebitB2BVisible ?? false,
                  merchantProfileCheckVisible:
                    webBankingSettings?.merchantProfileCheckVisible ?? false,
                };

                const account = accountMembership.account;
                const documentCollection =
                  account?.holder?.supportingDocumentCollections.edges[0]?.node;
                const documentCollectionStatus = documentCollection?.statusInfo.status;
                const documentCollectMode = projectInfo.supportingDocumentSettings?.collectMode;

                const isIndividual =
                  account?.holder?.info.__typename === "AccountHolderIndividualInfo";
                const hasTransactions = (account?.transactions?.totalCount ?? 0) >= 1;

                const requireFirstTransfer = match({ account, user })
                  .with(
                    {
                      account: { country: "FRA" },
                      user: { identificationLevels: { PVID: false, QES: false } },
                    },
                    () => true,
                  )
                  .with(
                    { account: { country: "ESP" }, user: { identificationLevels: { QES: false } } },
                    () => true,
                  )
                  .with({ account: { country: "DEU" } }, () => true)
                  .otherwise(() => false);

                const activationTag = match({
                  documentCollectionStatus,
                  documentCollectMode,
                  hasTransactions,
                  identificationStatusInfo: lastRelevantIdentification.map(
                    getIdentificationLevelStatusInfo,
                  ),
                  accountHolderType: account?.holder.info.__typename,
                  verificationStatus: account?.holder.verificationStatus,
                  isIndividual,
                  requireFirstTransfer,
                  isLegalRepresentative: accountMembership?.legalRepresentative ?? false,
                  account,
                })
                  .returnType<AccountActivationTag>()
                  // if payment level limitations have been lifted, no need for activation
                  .with(
                    { verificationStatus: "Refused", isLegalRepresentative: true },
                    () => "refused",
                  )
                  .with(
                    {
                      account: { paymentLevel: "Unlimited", paymentAccountType: "PaymentService" },
                    },
                    () => "none",
                  )
                  // never show to non-legal rep memberships
                  .with({ isLegalRepresentative: false }, () => "none")
                  .with(
                    { identificationStatusInfo: Option.P.Some({ status: "Pending" }) },
                    () => "pending",
                  )
                  .with(
                    { identificationStatusInfo: Option.P.Some({ status: P.not("Valid") }) },
                    () => "actionRequired",
                  )
                  .with(
                    {
                      documentCollectionStatus: "PendingReview",
                      accountHolderType: "AccountHolderCompanyInfo",
                    },
                    () => "pending",
                  )
                  .with(
                    {
                      documentCollectionStatus: P.not("Approved"),
                      accountHolderType: "AccountHolderCompanyInfo",
                    },
                    () => "actionRequired",
                  )
                  .with(
                    {
                      isIndividual: true,
                      requireFirstTransfer: false,
                      account: {
                        holder: { verificationStatus: P.union("NotStarted", "Pending") },
                      },
                    },
                    {
                      isIndividual: true,
                      requireFirstTransfer: false,
                      documentCollectMode: "API",
                      account: {
                        holder: { verificationStatus: P.union("Pending", "WaitingForInformation") },
                      },
                    },
                    () => "pending",
                  )
                  .with(
                    {
                      isIndividual: true,
                      requireFirstTransfer: false,
                      account: { holder: { verificationStatus: "Verified" } },
                    },
                    () => "none",
                  )
                  .with(
                    { isIndividual: true, requireFirstTransfer: true, hasTransactions: false },
                    () => "actionRequired",
                  )
                  .otherwise(() => "none");

                const merchantProfilesCount =
                  accountMembership.account?.merchantProfiles?.totalCount ?? 0;

                return Result.Ok({
                  accountMembership,
                  user,
                  projectInfo,
                  lastRelevantIdentification,
                  shouldDisplayIdVerification,
                  requireFirstTransfer,
                  permissions: {
                    canInitiatePayments,
                    canManageBeneficiaries,
                    canManageCards,
                    canViewAccount,
                    canManageAccountMembership,
                  },
                  features,
                  activationTag,
                  sections: {
                    history: canViewAccount,
                    account: canViewAccount && features.accountVisible,
                    transfer:
                      canInitiatePayments &&
                      accountMembership.statusInfo.status === "Enabled" &&
                      (features.transferCreationVisible || features.paymentListVisible),
                    cards:
                      accountMembership.allCards.totalCount > 0 ||
                      (canManageCards && features.virtualCardOrderVisible),
                    members:
                      canViewAccount && canManageAccountMembership && features.memberListVisible,
                    merchants:
                      isMerchantFlagActive &&
                      canManageAccountMembership &&
                      (merchantProfilesCount > 0 || features.merchantProfileCreationVisible),
                  },
                });
              },
            )
            .otherwise(() => Result.Error(undefined));
        }),
    [data, lastRelevantIdentification, isMerchantFlagActive],
  );

  return match(info)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(
      AsyncData.P.Done(Result.P.Ok(P.select())),
      ({
        user,
        accountMembership,
        projectInfo,
        shouldDisplayIdVerification,
        permissions,
        requireFirstTransfer,
        features,
        lastRelevantIdentification,
        activationTag,
        sections,
      }) => (
        <AccountArea
          accountMembershipLanguage={accountMembership.account?.language ?? "en"}
          accountMembershipId={accountMembershipId}
          user={user}
          accountMembership={accountMembership}
          projectInfo={projectInfo}
          shouldDisplayIdVerification={shouldDisplayIdVerification}
          permissions={permissions}
          features={features}
          lastRelevantIdentification={lastRelevantIdentification}
          requireFirstTransfer={requireFirstTransfer}
          activationTag={activationTag}
          sections={sections}
          reload={reload}
        />
      ),
    )
    .exhaustive();
};
