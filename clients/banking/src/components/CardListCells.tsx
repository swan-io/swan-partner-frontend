import { Box } from "@swan-io/lake/src/components/Box";
import { CellAction, EndAlignedCell } from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { G, Path, Svg } from "@swan-io/lake/src/components/Svg";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { CardListItemFragment } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { formatCurrency, t } from "../utils/i18n";

type Card = CardListItemFragment;

const styles = StyleSheet.create({
  cell: {
    display: "flex",
    paddingHorizontal: spacings[16],
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    width: 1,
  },
  cellRightAlign: {
    justifyContent: "flex-end",
  },

  cardDesign: {
    width: 80,
    height: 52,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardDesignSmall: {
    width: 50,
    height: 32,
    borderRadius: 2,
    overflow: "hidden",
  },
  cardChip: {
    borderRadius: 4,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  name: {
    ...commonStyles.fill,
  },
  nameSmall: {
    ...commonStyles.fill,
    flexDirection: "column",
  },
  spendingContainer: {
    ...commonStyles.fill,
  },
  spendingLimitText: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  spendingLimitTextSmall: {
    flexDirection: "row",
    justifyContent: "flex-start",
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

const cardChip = (
  <Svg viewBox="0 0 80 52" style={styles.cardChip}>
    <G fill="none" fillRule="evenodd">
      <Path
        fill="#D9D9D9"
        d="M17.46 24.81H9.79c-.65 0-1.17-.43-1.17-.95v-5.58c0-.52.53-.95 1.17-.95h7.67c.65 0 1.18.43 1.18.96v5.57c0 .52-.53.95-1.18.95z"
      />

      <Path
        fill="#000"
        d="M12.43 22.05h2.39V20.1h-2.39v1.95zm3.38-2.76h2.82v-.1h-2.65v-1.86h-.12v1.86h-.06c-.54 0-.98.35-.98.8h-2.39c0-.45-.44-.8-.98-.8h-.06v-1.86h-.12v1.86H8.62v.1h2.83c.47 0 .86.3.86.7v1.03H8.6v.1h3.7v1.04c0 .39-.39.7-.86.7H8.6v.1h2.66v1.85h.12v-1.85h.06c.54 0 .98-.36.98-.8v-.01h2.39v.01c0 .44.44.8.98.8h.06v1.85h.12v-1.85h2.66v-.1H15.8c-.47 0-.86-.31-.86-.7v-1.04h3.7v-.1h-3.7v-1.04c0-.38.39-.7.86-.7z"
      />
    </G>
  </Svg>
);

export const FullNameAndCardTypeCell = ({ card }: { card: Card }) => {
  const spendingLimits = card.spendingLimits ?? [];
  return (
    <View style={styles.cell}>
      <View>
        <Image source={{ uri: card.cardDesignUrl }} style={styles.cardDesign} />

        {card.type === "VirtualAndPhysical" ? cardChip : null}
      </View>

      <Space width={24} />

      <View style={styles.name}>
        <LakeHeading variant="h5" level={3}>
          {getMemberName({ accountMembership: card.accountMembership })}
        </LakeHeading>

        <Space height={8} />

        <Box direction="row">
          {match(card.type)
            .with("SingleUseVirtual", () => (
              <>
                <Tag color="darkPink" icon="phone-regular">
                  {t("cards.format.singleUse")}
                </Tag>

                <Space width={12} />

                {spendingLimits.some(({ period }) => period === "Always") ? (
                  <Tag color="gray" icon="flash-regular">
                    {t("cards.periodicity.oneOff")}
                  </Tag>
                ) : (
                  <Tag color="gray" icon="clock-regular">
                    {t("cards.periodicity.recurring")}
                  </Tag>
                )}
              </>
            ))
            .with("Virtual", () => (
              <Tag color="mediumSladeBlue" icon="phone-regular">
                {t("cards.format.virtual")}
              </Tag>
            ))
            .with("VirtualAndPhysical", () => (
              <Tag color="shakespear" icon="payment-regular">
                {t("cards.format.virtualAndPhysical")}
              </Tag>
            ))
            .exhaustive()}
        </Box>
      </View>
    </View>
  );
};

export const CardNameCell = ({ card }: { card: Card }) => {
  return (
    <View style={styles.cell}>
      <LakeText color={colors.gray[600]}>{card.name ?? "-"}</LakeText>
    </View>
  );
};

export const CardSpendingLimitCell = ({ card }: { card: Card }) => {
  return match(card)
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
        return (
          <View style={styles.cell}>
            <View style={styles.spendingContainer}>
              <View style={styles.spendingLimitText}>
                <LakeText
                  color={
                    Number(spending.amount.value) >= Number(spendingLimit.amount.value)
                      ? colors.negative[500]
                      : colors.gray[800]
                  }
                  variant="smallSemibold"
                >
                  {formatCurrency(Number(spending.amount.value), spending.amount.currency)}
                </LakeText>

                <Space width={4} />
                <LakeText variant="smallRegular">{"/"}</LakeText>
                <Space width={4} />

                <LakeText color={colors.gray[500]} variant="smallRegular">
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
            </View>
          </View>
        );
      },
    )
    .otherwise(() => null);
};

export const CardStatusCell = ({ card }: { card: Card }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      {match(card)
        .with(
          { statusInfo: { __typename: "CardCanceledStatusInfo" } },
          { statusInfo: { __typename: "CardCancelingStatusInfo" } },
          () => <Tag color="negative">{t("cardList.status.Canceled")}</Tag>,
        )
        .with(
          { statusInfo: { __typename: "CardEnabledStatusInfo" } },
          { statusInfo: { __typename: "CardProcessingStatusInfo" } },
          () => <Tag color="positive">{t("cardList.status.Active")}</Tag>,
        )
        .otherwise(() => null)}
    </View>
  );
};

export const CardSummaryCell = ({ card }: { card: Card }) => {
  const spendingLimits = card.spendingLimits ?? [];
  return (
    <View style={styles.cell}>
      <View>
        <Image source={{ uri: card.cardDesignUrl }} style={styles.cardDesignSmall} />

        {card.type === "VirtualAndPhysical" ? cardChip : null}
      </View>

      <Space width={12} />

      <View style={styles.nameSmall}>
        <LakeText variant="smallMedium" color={colors.gray[700]}>
          {getMemberName({ accountMembership: card.accountMembership })}
        </LakeText>

        <Space height={4} />

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
              return (
                <View style={styles.spendingLimitTextSmall}>
                  <LakeHeading
                    level="none"
                    color={
                      Number(spending.amount.value) >= Number(spendingLimit.amount.value)
                        ? colors.negative[500]
                        : colors.gray[800]
                    }
                    variant="h5"
                  >
                    {formatCurrency(Number(spending.amount.value), spending.amount.currency)}
                  </LakeHeading>

                  <Space width={4} />

                  <LakeHeading level="none" variant="h5">
                    {"/"}
                  </LakeHeading>

                  <Space width={4} />

                  <LakeHeading level="none" color={colors.gray[500]} variant="h5">
                    {formatCurrency(
                      Number(spendingLimit.amount.value),
                      spendingLimit.amount.currency,
                    )}
                  </LakeHeading>
                </View>
              );
            },
          )
          .otherwise(() => null)}

        {card.name != null ? (
          <>
            <Space height={4} />
            <LakeText color={colors.gray[600]}>{card.name}</LakeText>
          </>
        ) : null}
      </View>

      <Box direction="row">
        {match(card)
          .with(
            { statusInfo: { __typename: "CardCanceledStatusInfo" } },
            { statusInfo: { __typename: "CardCancelingStatusInfo" } },
            () => (
              <>
                <Tag color="negative" icon="subtract-circle-regular" />
                <Space width={12} />
              </>
            ),
          )
          .otherwise(() => null)}

        {match(card.type)
          .with("SingleUseVirtual", () => (
            <>
              {spendingLimits.some(({ period }) => period === "Always") ? (
                <Tag color="gray" icon="flash-regular" ariaLabel={t("cards.periodicity.oneOff")} />
              ) : (
                <Tag
                  color="gray"
                  icon="clock-regular"
                  ariaLabel={t("cards.periodicity.recurring")}
                />
              )}
            </>
          ))
          .with("Virtual", () => (
            <Tag
              color="mediumSladeBlue"
              icon="phone-regular"
              ariaLabel={t("cards.format.virtual")}
            />
          ))
          .with("VirtualAndPhysical", () => (
            <Tag
              color="shakespear"
              icon="payment-regular"
              ariaLabel={t("cards.format.virtualAndPhysical")}
            />
          ))
          .exhaustive()}
      </Box>

      <Space width={12} />
      <Icon name="chevron-right-filled" size={16} color={colors.gray[500]} />
    </View>
  );
};

export const CardActionsCell = ({
  card,
  isHovered: isRowHovered,
  onPressCancel,
}: {
  card: Card;
  isHovered: boolean;
  onPressCancel: ({ cardId }: { cardId: string }) => void;
}) => {
  return (
    <EndAlignedCell>
      <CellAction>
        <Box direction="row" justifyContent="end" alignItems="center">
          {match(card.statusInfo)
            .with(
              { __typename: P.not(P.union("CardCanceledStatusInfo", "CardCancelingStatusInfo")) },
              () => (
                <>
                  <Pressable
                    onPress={event => {
                      event.stopPropagation();
                      event.preventDefault();
                      onPressCancel({ cardId: card.id });
                    }}
                  >
                    {({ hovered }) => (
                      <Icon
                        name="subtract-circle-regular"
                        color={
                          hovered
                            ? colors.negative[500]
                            : isRowHovered
                            ? colors.gray[700]
                            : colors.gray[500]
                        }
                        size={16}
                      />
                    )}
                  </Pressable>

                  <Space width={8} />
                </>
              ),
            )
            .otherwise(() => null)}

          <Icon
            name="chevron-right-filled"
            color={isRowHovered ? colors.gray[900] : colors.gray[500]}
            size={16}
          />
        </Box>
      </CellAction>
    </EndAlignedCell>
  );
};
