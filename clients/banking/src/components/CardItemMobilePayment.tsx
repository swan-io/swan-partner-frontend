import { Array, Option, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import dayjs from "dayjs";
import { Fragment, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import applePayLogo from "../assets/images/apple-pay.svg";
import googlePayLogo from "../assets/images/google-pay.svg";
import {
  CancelDigitalCardDocument,
  CardPageQuery,
  DigitalCardFragment,
  IdentificationStatus,
} from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { CardItemIdentityVerificationGate } from "./CardItemIdentityVerificationGate";

const styles = StyleSheet.create({
  providerLogo: {
    width: 36,
    height: 22,
  },
  cardDetails: {
    ...commonStyles.fill,
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
});

type Card = NonNullable<CardPageQuery["card"]>;

type CompleteDigitalCard = DigitalCardFragment & { __typename: "CompleteDigitalCard" };

const DigitalCardTile = ({
  digitalCard,
  onPressCancel,
}: {
  digitalCard: CompleteDigitalCard;
  onPressCancel: () => void;
}) => {
  const deviceName = digitalCard.device.name ?? t("card.mobilePayment.unnamed");

  return (
    <Tile>
      <Box direction="row" alignItems="center">
        {match(digitalCard)
          .with({ walletProvider: { name: "ApplePay" } }, () => (
            <Image
              resizeMode="contain"
              source={{ uri: applePayLogo }}
              style={styles.providerLogo}
            />
          ))
          .with({ walletProvider: { name: "GooglePay" } }, () => (
            <Image
              resizeMode="contain"
              source={{ uri: googlePayLogo }}
              style={styles.providerLogo}
            />
          ))
          .otherwise(() => (
            <View style={styles.providerLogo} />
          ))}

        <Space width={24} />

        <View style={styles.cardDetails}>
          <LakeHeading variant="h3" level={3}>
            {deviceName}
          </LakeHeading>

          <LakeText color={colors.gray[500]}>
            {t("card.mobilePayment.addedAt", { date: dayjs(digitalCard.createdAt).format("LL") })}
          </LakeText>
        </View>

        <LakeTooltip placement="left" content={t("card.mobilePayment.disconnect")}>
          <LakeButton
            mode="tertiary"
            ariaLabel={t("card.mobilePayment.cancel")}
            icon="subtract-circle-regular"
            onPress={onPressCancel}
          />
        </LakeTooltip>
      </Box>
    </Tile>
  );
};

type Props = {
  card: Card;
  onRefreshRequest: () => void;
  cardRequiresIdentityVerification: boolean;
  isCurrentUserCardOwner: boolean;
  onRefreshAccountRequest: () => void;
  projectId: string;
  identificationStatus?: IdentificationStatus;
};

export const CardItemMobilePayment = ({
  card,
  onRefreshRequest,
  cardRequiresIdentityVerification,
  isCurrentUserCardOwner,
  onRefreshAccountRequest,
  projectId,
  identificationStatus,
}: Props) => {
  const [cancelConfirmationModalModal, setCancelConfirmationModalModal] = useState<
    Option<CompleteDigitalCard>
  >(Option.None());
  const [digitalCardCancelation, cancelDigitalCard] = useUrqlMutation(CancelDigitalCardDocument);

  const onPressCancel = ({ digitalCardId }: { digitalCardId: string }) => {
    cancelDigitalCard({ digitalCardId })
      .mapOkToResult(({ cancelDigitalCard }) => {
        return match(cancelDigitalCard)
          .with({ __typename: "CancelDigitalCardSuccessPayload" }, () => Result.Ok(undefined))
          .otherwise(error => Result.Error(error));
      })
      .tapOk(() => {
        setCancelConfirmationModalModal(Option.None());
        onRefreshRequest();
      })
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  const digitalCards = Array.filterMap(card.digitalCards.edges, card => {
    return match(card)
      .with(
        {
          node: {
            __typename: "CompleteDigitalCard",
            walletProvider: { name: P.union("ApplePay", "GooglePay") },
          },
        },
        ({ node }) => Option.Some(node),
      )
      .otherwise(() => Option.None());
  });

  return (
    <>
      {match(digitalCards)
        .with([], () => (
          <View style={styles.empty}>
            <FixedListViewEmpty
              borderedIcon={true}
              icon="lake-phone"
              title={t("card.mobilePayment.empty")}
              subtitle={t("card.mobilePayment.empty.description")}
            >
              {cardRequiresIdentityVerification ? (
                <>
                  <Space height={24} />

                  <CardItemIdentityVerificationGate
                    recommendedIdentificationLevel={
                      card.accountMembership.recommendedIdentificationLevel
                    }
                    isCurrentUserCardOwner={isCurrentUserCardOwner}
                    projectId={projectId}
                    description={t("card.identityVerification.mobilePayments")}
                    descriptionForOtherMember={t(
                      "card.identityVerification.mobilePayments.otherMember",
                      { name: getMemberName({ accountMembership: card.accountMembership }) },
                    )}
                    onComplete={onRefreshAccountRequest}
                    identificationStatus={identificationStatus}
                  />
                </>
              ) : null}
            </FixedListViewEmpty>
          </View>
        ))
        .otherwise(digitalCards =>
          digitalCards.map(digitalCard => (
            <Fragment key={digitalCard.id}>
              <DigitalCardTile
                digitalCard={digitalCard}
                onPressCancel={() => setCancelConfirmationModalModal(Option.Some(digitalCard))}
              />

              <Space height={24} />
            </Fragment>
          )),
        )}

      <LakeModal
        icon="subtract-circle-regular"
        onPressClose={() => setCancelConfirmationModalModal(Option.None())}
        color="negative"
        visible={cancelConfirmationModalModal.isSome()}
        title={cancelConfirmationModalModal
          .map(({ device }) => {
            const deviceName = device.name ?? t("card.mobilePayment.unnamed");
            return t("card.mobilePayment.disconnect.title", { deviceName });
          })
          .toUndefined()}
      >
        {cancelConfirmationModalModal
          .map(({ device, id }) => {
            const deviceName = device.name ?? t("card.mobilePayment.unnamed");
            return (
              <>
                <LakeText color={colors.gray[600]}>
                  {t("card.mobilePayment.disconnect.title", { deviceName })}
                </LakeText>

                <Space height={32} />

                <LakeButton
                  color="negative"
                  icon="subtract-circle-filled"
                  onPress={() => onPressCancel({ digitalCardId: id })}
                  loading={digitalCardCancelation.isLoading()}
                >
                  {t("card.mobilePayment.disconnect.disconnect")}
                </LakeButton>
              </>
            );
          })
          .toNull()}
      </LakeModal>
    </>
  );
};
