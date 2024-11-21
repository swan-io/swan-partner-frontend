import { Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { getCCA2forCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { CardPageQuery, UpdateCardDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardCancelConfirmationModal } from "./CardCancelConfirmationModal";
import { CardSettings, CardWizardSettings, CardWizardSettingsRef } from "./CardWizardSettings";

const styles = StyleSheet.create({
  link: {
    color: colors.current.primary,
    display: "inline-block",
  },
});

type Card = NonNullable<CardPageQuery["card"]>;

type Props = {
  card: Card;
  cardId: string;
  accountMembershipId: string;
};

export const CardItemSettings = ({ cardId, accountMembershipId, card }: Props) => {
  const [updateCard, cardUpdate] = useMutation(UpdateCardDocument);
  const [isCancelConfirmationModalVisible, setIsCancelConfirmationModalVisible] = useState(false);
  const accountHolder = card.accountMembership.account?.holder;
  const settingsRef = useRef<CardWizardSettingsRef | null>(null);

  const { canUpdateCard } = usePermissions();

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

  return (
    <>
      {card.accountMembership.canManageCards ? null : (
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

        {canUpdateCard ? (
          <LakeButton color="current" onPress={onPressSubmit} loading={cardUpdate.isLoading()}>
            {t("common.save")}
          </LakeButton>
        ) : null}
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
