import { Box } from "@swan-io/lake/src/components/Box";
import { ChoicePicker } from "@swan-io/lake/src/components/ChoicePicker";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
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

type CardDeliveryMode = "Grouped" | "Individual";

type Props = {
  initialDeliveryMode?: CardDeliveryMode;
  onSubmit: (cardDeliveryMode: CardDeliveryMode) => void;
};

export type CardWizardDeliveryRef = { submit: () => void };

export const CardWizardDelivery = forwardRef<CardWizardDeliveryRef, Props>(
  ({ initialDeliveryMode, onSubmit }: Props, ref) => {
    const [currentDeliveryMode, setCurrentDeliveryMode] = useState<CardDeliveryMode>(
      () => initialDeliveryMode ?? "Grouped",
    );

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          onSubmit(currentDeliveryMode);
        },
      }),
      [currentDeliveryMode, onSubmit],
    );

    const items: CardDeliveryMode[] = ["Grouped", "Individual"];

    return (
      <ChoicePicker
        items={items}
        renderItem={cardDeliveryMode => {
          return (
            <View style={styles.item}>
              <Box alignItems="center">
                <Icon
                  color={
                    currentDeliveryMode == cardDeliveryMode ? colors.swan[300] : colors.swan[200]
                  }
                  size={148}
                  name={match(cardDeliveryMode)
                    .with("Grouped", () => "lake-delivery-grouped" as const)
                    .with("Individual", () => "lake-delivery-individual" as const)
                    .exhaustive()}
                />

                <Space height={24} />

                <LakeHeading userSelect="none" level={3} variant="h3">
                  {match(cardDeliveryMode)
                    .with("Grouped", () => t("cards.delivery.grouped"))
                    .with("Individual", () => t("cards.delivery.individual"))
                    .exhaustive()}
                </LakeHeading>

                <Space height={12} />

                <View style={styles.descriptionContainer}>
                  <LakeText
                    userSelect="none"
                    variant="smallRegular"
                    align="center"
                    style={styles.description}
                  >
                    {match(cardDeliveryMode)
                      .with("Grouped", () => t("cards.delivery.grouped.description"))
                      .with("Individual", () => t("cards.delivery.individual.description"))
                      .exhaustive()}
                  </LakeText>
                </View>
              </Box>

              <Space height={12} />
            </View>
          );
        }}
        value={currentDeliveryMode}
        onChange={setCurrentDeliveryMode}
      />
    );
  },
);
