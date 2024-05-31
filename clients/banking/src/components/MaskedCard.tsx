import "@swan-io/lake/src/assets/fonts/InterCard.css";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { Svg } from "@swan-io/lake/src/components/Svg";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, texts } from "@swan-io/lake/src/constants/design";
import dayjs from "dayjs";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { match } from "ts-pattern";
import { CardStatus, PhysicalCardStatus } from "../graphql/partner";
import { t } from "../utils/i18n";

const CARD_BASE_WIDTH = 390;

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    paddingVertical: "6%",
    paddingHorizontal: "7%",
    overflow: "hidden",
  },
  holder: {
    ...texts.semibold,
    lineHeight: texts.h1.lineHeight,
    maxWidth: "50%",
  },

  panBottomSpacer: {
    pointerEvents: "none",
    height: "9.5%",
  },
  bottomLineRow: {
    height: "23.5%",
    paddingRight: "28.4%", // mastercard logo
  },
  expiryDateWrapper: {
    width: "50%",
    alignItems: "flex-start",
  },
  cvvWrapper: {
    alignItems: "flex-start",
    width: "50%",
  },
  monospacedText: {
    fontFamily: '"Inter Card", Inter, monospace',
    lineHeight: "1" as unknown as number,
    userSelect: "none",
  },
  statusLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))`,
    backdropFilter: "blur(6px)",
    justifyContent: "center",
    alignItems: "center",
    height: "50%",
  },
  container: {
    opacity: 0,
    transitionProperty: "opacity",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },
  containerVisible: {
    opacity: 1,
  },
  suspendedGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: `linear-gradient(to top left, rgba(196, 122, 58, 1), rgba(196, 122, 58, 0) 70%)`,
  },
  toReniewGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: `linear-gradient(to top left, rgba(96, 163, 188, 1), rgba(96, 163, 188, 0) 70%)`,
  },
  contents: {
    flexGrow: 1,
  },
});

const formatPan = (pan: string) => {
  return pan
    .replace(/X/g, "•")
    .split("")
    .reduce((result, char, index) => {
      if ([4, 8, 12].includes(index)) {
        return `${result} ${char}`;
      }
      return `${result}${char}`;
    }, "");
};

type Status = PhysicalCardStatus | CardStatus;

type Props = {
  cardDesignUrl: string;
  textColor: string;
  holderName: string;
  pan: string;
  expiryDate: string;
  status: Status;
  estimatedDeliveryDate?: string;
  expired?: boolean;
};

export const MaskedCard = ({
  status,
  cardDesignUrl,
  textColor,
  holderName,
  pan,
  expiryDate,
  estimatedDeliveryDate,
  expired,
}: Props) => {
  const [ratio, setRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const holderNameFontSize = 16 * ratio;
  const panFontSize = 23.5 * ratio;
  const expiryDateFontSize = 18 * ratio;

  return (
    <View
      style={[styles.container, isVisible && styles.containerVisible]}
      onLayout={({ nativeEvent: { layout } }) => {
        setRatio(Number((layout.width / CARD_BASE_WIDTH).toFixed(2)));
      }}
    >
      {/* garantee the credit card ratio */}
      <Svg role="none" viewBox="0 0 85 55" />

      <View style={styles.base}>
        <Image
          style={StyleSheet.absoluteFill}
          source={{ uri: cardDesignUrl }}
          onLoadEnd={() => setIsVisible(true)}
        />

        {match({ status, expired })
          .with({ status: "Suspended" }, () => <View style={styles.suspendedGradient} />)
          .with({ status: "ToRenew", expired: true }, () => (
            <View style={styles.suspendedGradient} />
          ))
          .with({ status: "ToRenew" }, () => <View style={styles.toReniewGradient} />)
          .otherwise(() => null)}

        <View style={styles.contents}>
          <Text style={[styles.holder, { color: textColor, fontSize: holderNameFontSize }]}>
            {holderName}
          </Text>

          {match({ status, expired })
            .with({ status: "Canceled" }, () => (
              <>
                <Space height={8} />
                <Tag color="negative">{t("card.permanentlyBlocked")}</Tag>
              </>
            ))
            .with({ status: "Suspended" }, () => (
              <>
                <Space height={8} />
                <Tag color="warning">{t("card.blocked")}</Tag>
              </>
            ))
            .with({ status: "ToRenew", expired: true }, () => (
              <>
                <Space height={8} />
                <Tag color="negative">{t("card.expired")}</Tag>
              </>
            ))
            .with({ status: "ToRenew" }, () => (
              <>
                <Space height={8} />
                <Tag color="shakespear">{t("card.toRenew")}</Tag>
              </>
            ))
            .otherwise(() => null)}

          <Fill />

          {match(status)
            .with("Activated", "Enabled", "Renewed", "ToActivate", "Suspended", "ToRenew", () => (
              <>
                <Text style={[styles.monospacedText, { color: textColor, fontSize: panFontSize }]}>
                  {formatPan(pan)}
                </Text>

                <View tabIndex={-1} collapsable={true} style={styles.panBottomSpacer} />

                <Box direction="row" alignItems="center" style={styles.bottomLineRow}>
                  <View style={styles.expiryDateWrapper}>
                    <Text
                      style={[
                        styles.monospacedText,
                        { color: textColor, fontSize: expiryDateFontSize },
                      ]}
                    >
                      {expiryDate}
                    </Text>
                  </View>

                  <Box direction="row" alignItems="center" style={styles.cvvWrapper}>
                    <Text
                      style={[
                        styles.monospacedText,
                        { color: textColor, fontSize: expiryDateFontSize },
                      ]}
                    >
                      {"CVC •••"}
                    </Text>
                  </Box>
                </Box>
              </>
            ))
            .otherwise(() => null)}
        </View>

        {match(status)
          .with("Processing", () => (
            <View style={styles.statusLayer}>
              <Tag color="warning" icon="settings-regular">
                {t("card.processing")}
              </Tag>
            </View>
          ))
          .with("ToActivate", () => (
            <View style={styles.statusLayer}>
              <Tag color="shakespear" icon="box-regular">
                {t("card.shipping")}
              </Tag>

              <Space height={16} />

              <LakeHeading level="none" color={colors.gray.contrast} variant="h3">
                {dayjs(estimatedDeliveryDate).format("LL")}
              </LakeHeading>
            </View>
          ))
          .with("Renewed", () => (
            <View style={styles.statusLayer}>
              <Tag color="shakespear" icon="box-regular">
                {t("card.shipping")}
              </Tag>

              <Space height={16} />

              <LakeHeading level="none" color={colors.gray.contrast} variant="h3">
                {dayjs(estimatedDeliveryDate).format("LL")}
              </LakeHeading>
            </View>
          ))
          .otherwise(() => null)}
      </View>
    </View>
  );
};
