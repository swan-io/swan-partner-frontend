import { Option, Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { getCCA2forCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { CardPageQuery, IdentificationFragment, UpdateCardDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardCancelConfirmationModal } from "./CardCancelConfirmationModal";
import { CardItemIdentityVerificationGate } from "./CardItemIdentityVerificationGate";
import { CardSettings, CardWizardSettings, CardWizardSettingsRef } from "./CardWizardSettings";

const styles = StyleSheet.create({
  empty: {
    display: "block",
  },
  link: {
    color: colors.current.primary,
    display: "inline-block",
  },
});

type Card = NonNullable<CardPageQuery["card"]>;

type Props = {
  card: Card;
  cardId: string;
  projectId: string;
  accountMembershipId: string;
  cardRequiresIdentityVerification: boolean;
  isCurrentUserCardOwner: boolean;
  onRefreshAccountRequest: () => void;
  lastRelevantIdentification: Option<IdentificationFragment>;
  canManageCards: boolean;
};

export const CardItemSettings = ({
  cardId,
  projectId,
  accountMembershipId,
  card,
  cardRequiresIdentityVerification,
  isCurrentUserCardOwner,
  onRefreshAccountRequest,
  lastRelevantIdentification,
  canManageCards,
}: Props) => {
  const [updateCard, cardUpdate] = useMutation(UpdateCardDocument);
  const [isCancelConfirmationModalVisible, setIsCancelConfirmationModalVisible] = useState(false);
  const accountHolder = card.accountMembership.account?.holder;
  const settingsRef = useRef<CardWizardSettingsRef | null>(null);

  const onSubmit = ({
    spendingLimit,
    eCommerce,
    cardName,
    withdrawal,
    international,
    nonMainCurrencyTransactions,
  }: CardSettings) => {
    updateCard({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin + Router.AccountCardsItemSettings({ cardId, accountMembershipId }),
        spendingLimit,
        name: cardName,
        eCommerce,
        withdrawal,
        international,
        nonMainCurrencyTransactions,
      },
    })
      .mapOk(data => data.updateCard)
      .mapOkToResult(data => (isNotNullish(data) ? Result.Ok(data) : Result.Error(undefined)))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const onPressSubmit = () => {
    if (settingsRef.current != null) {
      settingsRef.current.submit();
    }
  };

  const deriveInitialSpendingLimit = () => {
    const spendingLimit = card.spendingLimits?.[0];
    if (spendingLimit == null) {
      return;
    }
    const {
      amount: { value, currency },
      period,
    } = spendingLimit;
    return {
      amount: { value, currency },
      period,
    };
  };

  return cardRequiresIdentityVerification && isCurrentUserCardOwner ? (
    <View style={styles.empty}>
      <FixedListViewEmpty
        borderedIcon={true}
        icon="lake-settings"
        title={t("card.settings.unavailable")}
      >
        <Space height={24} />

        <CardItemIdentityVerificationGate
          recommendedIdentificationLevel={card.accountMembership.recommendedIdentificationLevel}
          isCurrentUserCardOwner={isCurrentUserCardOwner}
          projectId={projectId}
          description={t("card.identityVerification.settings")}
          descriptionForOtherMember={t("card.identityVerification.settings.otherMember", {
            name: getMemberName({ accountMembership: card.accountMembership }),
          })}
          onComplete={onRefreshAccountRequest}
          lastRelevantIdentification={lastRelevantIdentification}
        />
      </FixedListViewEmpty>
    </View>
  ) : (
    <>
      {!canManageCards && (
        <>
          <LakeAlert title={t("card.settings.notAllowed")} variant="info" />
          <Space height={24} />
        </>
      )}

      <CardWizardSettings
        ref={settingsRef}
        cardProduct={card.cardProduct}
        cardFormat={card.type}
        maxSpendingLimit={card.spendingLimits?.find(
          item => item.type === "Partner" && item.period === "Monthly",
        )}
        initialSettings={{
          spendingLimit: deriveInitialSpendingLimit(),
          cardName: card.name ?? "",
          eCommerce: card.eCommerce ?? false,
          withdrawal: card.withdrawal ?? false,
          international: card.international ?? false,
          nonMainCurrencyTransactions: card.nonMainCurrencyTransactions ?? false,
        }}
        onSubmit={onSubmit}
        accountHolder={accountHolder}
        canManageCards={canManageCards}
      />

      {match({
        type: accountHolder?.info.type,
        country: isCountryCCA3(card.issuingCountry)
          ? getCCA2forCCA3(card.issuingCountry)?.toLowerCase()
          : undefined,
      })
        .with({ type: "Company", country: P.nonNullable }, ({ country }) => (
          <>
            <Space height={24} />

            <LakeText variant="smallRegular">
              {formatNestedMessage("card.mastercardBonusProgramLink", {
                learnMoreLink: (
                  <>
                    <Link
                      style={styles.link}
                      to={`https://www.mastercard.com/businessbonus/${country}/home`}
                      target="blank"
                    >
                      <Box direction="row" alignItems="center">
                        <LakeText color={colors.current.primary} variant="smallRegular">
                          {t("common.learnMore")}
                        </LakeText>

                        <Space width={4} />
                        <Icon color={colors.current.primary} name="open-filled" size={16} />
                      </Box>
                    </Link>
                  </>
                ),
              })}
            </LakeText>

            <Space height={16} />
          </>
        ))
        .otherwise(() => null)}

      <LakeButtonGroup>
        {match(card.statusInfo)
          .with(
            { __typename: P.not(P.union("CardCanceledStatusInfo", "CardCancelingStatusInfo")) },
            () => (
              <LakeButton
                color="negative"
                mode="secondary"
                icon="subtract-circle-regular"
                onPress={() => setIsCancelConfirmationModalVisible(true)}
              >
                {t("card.cancel.cancelCard")}
              </LakeButton>
            ),
          )
          .otherwise(() => (
            <View />
          ))}

        {canManageCards && (
          <LakeButton color="current" onPress={onPressSubmit} loading={cardUpdate.isLoading()}>
            {t("common.save")}
          </LakeButton>
        )}
      </LakeButtonGroup>

      <CardCancelConfirmationModal
        cardId={cardId}
        onPressClose={() => setIsCancelConfirmationModalVisible(false)}
        visible={isCancelConfirmationModalVisible}
        onSuccess={() => {
          setIsCancelConfirmationModalVisible(false);
          Router.push("AccountCardsList", { accountMembershipId });
        }}
      />
    </>
  );
};
