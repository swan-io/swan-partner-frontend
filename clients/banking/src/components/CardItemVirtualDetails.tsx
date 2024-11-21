import { useMutation } from "@swan-io/graphql-client";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { QuickActions } from "@swan-io/lake/src/components/QuickActions";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { CardPageQuery, ViewCardNumbersDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { formatCurrency, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { MaskedCard } from "./MaskedCard";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  card: {
    maxWidth: 390,
    width: "100%",
    alignSelf: "center",
    paddingTop: 16,
  },
  spendingContainer: {
    ...commonStyles.fill,
  },
  spendingLimitText: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  progress: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gray[100],
    width: "100%",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 1,
  },
});

type Card = NonNullable<CardPageQuery["card"]>;

type Props = {
  card: Card;
  cardId: string;
  accountMembershipId: string;
  isCurrentUserCardOwner: boolean;
  hasBindingUserError: boolean;
};

export const CardItemVirtualDetails = ({
  cardId,
  accountMembershipId,
  card,
  isCurrentUserCardOwner,
  hasBindingUserError,
}: Props) => {
  const [viewCardNumbers, cardNumberViewing] = useMutation(ViewCardNumbersDocument);

  const onPressRevealCardNumbers = () => {
    viewCardNumbers({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin + Router.AccountCardsItem({ cardId, accountMembershipId }),
      },
    })
      .mapOk(data => data.viewCardNumbers)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const textColor = hasBindingUserError ? colors.gray[300] : colors.gray[800];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {card.cardDesignUrl != null ? (
          <MaskedCard
            cardDesignUrl={card.cardDesignUrl}
            textColor={
              card.cardProduct.cardDesigns.find(
                cardDesign => cardDesign.cardDesignUrl === card.cardDesignUrl,
              )?.accentColor ?? "#fff"
            }
            holderName={getMemberName({ accountMembership: card.accountMembership })}
            pan={card.cardMaskedNumber}
            expiryDate={card.expiryDate ?? ""}
            status={card.statusInfo.status}
          />
        ) : null}

        {match({ isCurrentUserCardOwner, card })
          .with(
            {
              isCurrentUserCardOwner: true,
              card: {
                statusInfo: { __typename: P.union("CardEnabledStatusInfo") },
                accountMembership: {
                  statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" },
                },
              },
            },
            () => (
              <>
                <Space height={24} />

                <QuickActions
                  actions={[
                    ...match({ isCurrentUserCardOwner, card })
                      .with(
                        {
                          isCurrentUserCardOwner: true,
                          card: {
                            statusInfo: { __typename: P.union("CardEnabledStatusInfo") },
                            accountMembership: {
                              statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" },
                            },
                          },
                        },

                        () => [
                          {
                            label: t("card.revealNumbers"),
                            icon: "eye-regular" as const,
                            onPress: () => onPressRevealCardNumbers(),
                            isLoading: cardNumberViewing.isLoading(),
                            disabled: hasBindingUserError,
                            tooltipDisabled: !hasBindingUserError,
                            tooltipText: t("card.tooltipConflict"),
                          },
                        ],
                      )

                      .otherwise(() => []),
                  ]}
                />
              </>
            ),
          )
          .otherwise(() => null)}

        {match(card)
          .with(
            {
              spending: { amount: { value: P.string, currency: P.string } },
              spendingLimits: P.array({ amount: { value: P.string, currency: P.string } }),
            },
            ({ spending, spendingLimits }) => {
              const spendingLimit = spendingLimits[0];
              if (spendingLimit == null) {
                return null;
              }
              const spentOverLimitRatio = Math.min(
                Number(spending.amount.value) / Number(spendingLimit.amount.value),
                1,
              );
              const remainderToSpend = Math.max(
                0,
                Number(spendingLimit.amount.value) - Number(spending.amount.value),
              );
              return (
                <>
                  <Space height={24} />

                  <View style={styles.spendingContainer}>
                    <View style={styles.spendingLimitText}>
                      <LakeText color={textColor} variant="smallRegular">
                        {t("card.spendingLimit")}
                      </LakeText>

                      <Fill minWidth={24} />

                      <LakeText
                        color={
                          hasBindingUserError
                            ? colors.gray[300]
                            : Number(spending.amount.value) >= Number(spendingLimit.amount.value)
                              ? colors.negative[500]
                              : colors.gray[800]
                        }
                        variant="smallSemibold"
                      >
                        {formatCurrency(Number(spending.amount.value), spending.amount.currency)}
                      </LakeText>

                      <Space width={4} />

                      <LakeText color={textColor} variant="smallRegular">
                        {"/"}
                      </LakeText>

                      <Space width={4} />

                      <LakeText color={textColor} variant="smallRegular">
                        {formatCurrency(
                          Number(spendingLimit.amount.value),
                          spendingLimit.amount.currency,
                        )}
                      </LakeText>
                    </View>

                    <Space height={8} />

                    <View style={styles.progress}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor:
                              spentOverLimitRatio >= 1 ? colors.negative[500] : colors.current[500],
                            width: `${spentOverLimitRatio * 100}%`,
                          },
                        ]}
                      />
                    </View>

                    <Space height={8} />

                    <View style={styles.spendingLimitText}>
                      <LakeText color={textColor} variant="smallRegular">
                        {match(spendingLimit.period)
                          .with("Daily", () => t("card.spendingLimit.remaining.daily"))
                          .with("Weekly", () => t("card.spendingLimit.remaining.weekly"))
                          .with("Monthly", () => t("card.spendingLimit.remaining.monthly"))
                          .with("Always", () => t("card.spendingLimit.remaining.always"))
                          .exhaustive()}
                      </LakeText>

                      <Fill minWidth={24} />

                      <LakeText color={textColor} variant="smallRegular">
                        {formatCurrency(remainderToSpend, spending.amount.currency)}
                      </LakeText>
                    </View>
                  </View>
                </>
              );
            },
          )
          .otherwise(() => null)}
      </View>
    </View>
  );
};
