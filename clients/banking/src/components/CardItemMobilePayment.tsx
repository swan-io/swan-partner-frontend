import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import dayjs from "dayjs";
import { Fragment, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import applePayLogo from "../assets/images/apple-pay.svg";
import googlePayLogo from "../assets/images/google-pay.svg";
import { CancelDigitalCardDocument, CardPageQuery, DigitalCardFragment } from "../graphql/partner";
import { t } from "../utils/i18n";

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
  isCurrentUserCardOwner,
  onPressCancel,
}: {
  digitalCard: CompleteDigitalCard;
  isCurrentUserCardOwner: boolean;
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

        {isCurrentUserCardOwner && (
          <LakeTooltip placement="left" content={t("card.mobilePayment.disconnect")}>
            <LakeButton
              mode="tertiary"
              ariaLabel={t("card.mobilePayment.cancel")}
              icon="subtract-circle-regular"
              onPress={onPressCancel}
            />
          </LakeTooltip>
        )}
      </Box>
    </Tile>
  );
};

type Props = {
  card: Card;
  isCurrentUserCardOwner: boolean;
  onRefreshRequest: () => void;
};

export const CardItemMobilePayment = ({
  card,
  onRefreshRequest,
  isCurrentUserCardOwner,
}: Props) => {
  const [cancelConfirmationModalModal, setCancelConfirmationModalModal] = useState<
    Option<CompleteDigitalCard>
  >(Option.None());
  const [cancelDigitalCard, digitalCardCancelation] = useMutation(CancelDigitalCardDocument);

  const onPressCancel = ({ digitalCardId }: { digitalCardId: string }) => {
    cancelDigitalCard({ digitalCardId })
      .mapOk(data => data.cancelDigitalCard)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        setCancelConfirmationModalModal(Option.None());
        onRefreshRequest();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
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
            <EmptyView
              borderedIcon={true}
              icon="lake-phone"
              title={t("card.mobilePayment.empty")}
              subtitle={t("card.mobilePayment.empty.description")}
            />
          </View>
        ))
        .otherwise(digitalCards =>
          digitalCards.map(digitalCard => (
            <Fragment key={digitalCard.id}>
              <DigitalCardTile
                isCurrentUserCardOwner={isCurrentUserCardOwner}
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
