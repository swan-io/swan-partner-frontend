import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors } from "@swan-io/lake/src/constants/design";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { GetCardProductsQuery } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  item: {
    alignSelf: "stretch",
  },
  descriptionContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
  },
  description: {
    width: 1,
    flexGrow: 1,
  },
});

type CardProduct = NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>[number];

export type CardFormat = "VirtualAndPhysical" | "Virtual" | "SingleUseVirtual";

type Props = {
  cardProduct: CardProduct;
  initialCardFormat?: CardFormat;
  onSubmit: (cardFormat: CardFormat) => void;
};

export type CardWizardFormatRef = { submit: () => void };

export const CardWizardFormat = forwardRef<CardWizardFormatRef, Props>(
  ({ cardProduct, initialCardFormat, onSubmit }: Props, ref) => {
    const { canPrintPhysicalCard: canOrderPhysicalCard } = usePermissions();
    const [currentFormat, setCurrentCardFormat] = useState<CardFormat>(
      () => initialCardFormat ?? "Virtual",
    );

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          onSubmit(currentFormat);
        },
      }),
      [currentFormat, onSubmit],
    );

    const items: CardFormat[] = [
      "Virtual",
      ...(cardProduct.applicableToPhysicalCards && canOrderPhysicalCard
        ? ["VirtualAndPhysical" as const]
        : []),
      "SingleUseVirtual",
    ];

    return (
      <ChoicePicker
        items={items}
        renderItem={cardFormat => {
          return (
            <View style={styles.item}>
              <Box alignItems="center">
                <Icon
                  color={currentFormat === cardFormat ? colors.swan[300] : colors.swan[200]}
                  size={148}
                  name={match(cardFormat)
                    .with("Virtual", () => "lake-card-virtual" as const)
                    .with("VirtualAndPhysical", () => "lake-card-physical" as const)
                    .with("SingleUseVirtual", () => "lake-card-single-use" as const)
                    .exhaustive()}
                />

                <Space height={24} />

                {match(cardFormat)
                  .with("Virtual", () => (
                    <Tag icon="phone-regular" color="mediumSladeBlue">
                      {t("cards.format.virtual")}
                    </Tag>
                  ))
                  .with("VirtualAndPhysical", () => (
                    <Tag icon="payment-regular" color="shakespear">
                      {t("cards.format.virtualAndPhysical")}
                    </Tag>
                  ))
                  .with("SingleUseVirtual", () => (
                    <Tag icon="phone-regular" color="darkPink">
                      {t("cards.format.singleUse")}
                    </Tag>
                  ))
                  .exhaustive()}

                <Space height={12} />

                <View style={styles.descriptionContainer}>
                  <LakeText variant="smallRegular" align="center" style={styles.description}>
                    {match(cardFormat)
                      .with("Virtual", () => t("cards.format.virtual.description"))
                      .with("VirtualAndPhysical", () =>
                        t("cards.format.virtualAndPhysical.description"),
                      )
                      .with("SingleUseVirtual", () => t("cards.format.singleUse.description"))
                      .exhaustive()}
                  </LakeText>
                </View>
              </Box>

              <Space height={12} />
            </View>
          );
        }}
        value={currentFormat}
        onChange={setCurrentCardFormat}
      />
    );
  },
);
