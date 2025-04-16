import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors } from "@swan-io/lake/src/constants/design";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { CSSProperties, Ref, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { GetCardProductsQuery } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

const styles = StyleSheet.create({
  cardDesignContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    alignSelf: "stretch",
  },
  image: {
    width: "100%",
    maxWidth: 320,
    marginHorizontal: "auto",
  },
});

const IMAGE_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "auto",
  borderRadius: 10,
  objectFit: "contain",
  objectPosition: "50% 50%",
};

type CardProduct = NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>[number];

type AccountHolderType = "Company" | "Individual";

export type CardWizardProductRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardProductRef>;
  accountHolderType: AccountHolderType;
  cardProducts: NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>;
  initialCardProduct?: CardProduct;
  onSubmit: (cardProduct: CardProduct) => void;
};

export const CardWizardProduct = ({
  ref,
  accountHolderType,
  cardProducts,
  initialCardProduct,
  onSubmit,
}: Props) => {
  const [currentCardProduct, setCurrentCardProduct] = useState<CardProduct | undefined>(
    () => initialCardProduct ?? cardProducts.find(cardProduct => cardProduct.defaultCardProduct),
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        if (currentCardProduct != null) {
          onSubmit(currentCardProduct);
        }
      },
    }),
    [currentCardProduct, onSubmit],
  );

  useEffect(() => {
    if (cardProducts.length <= 1 && cardProducts[0] != null) {
      onSubmit(cardProducts[0]);
    }
  }, [cardProducts, onSubmit]);

  return (
    <ChoicePicker
      items={cardProducts}
      renderItem={cardProduct => {
        const cardDesign = cardProduct.cardDesigns.find(item => item.status === "Enabled");
        const cardDesignUrl = cardDesign?.cardDesignUrl;

        return (
          <View style={styles.item}>
            <View style={styles.image}>
              <svg viewBox="0 0 1536 969" />

              {cardDesignUrl != null ? (
                <View style={styles.cardDesignContainer}>
                  <img src={cardDesignUrl} style={IMAGE_STYLE} />
                </View>
              ) : null}
            </View>

            <Space height={24} />

            <LakeHeading
              level={3}
              variant="h5"
              align="center"
              color={currentCardProduct?.id === cardProduct.id ? colors.current[500] : undefined}
            >
              {cardProduct.name}
            </LakeHeading>

            <Space height={12} />

            <LakeText align="center" variant="smallRegular">
              {t("cards.maxSpendingLimit")}
            </LakeText>

            <LakeText align="center" variant="smallSemibold" color={colors.gray[700]}>
              {match(accountHolderType)
                .with("Company", () =>
                  t("card.maxSpendingLimits.perMonth", {
                    value: formatCurrency(
                      Number(cardProduct.companySpendingLimit.amount.value),
                      cardProduct.companySpendingLimit.amount.currency,
                    ),
                  }),
                )
                .with("Individual", () =>
                  t("card.maxSpendingLimits.perMonth", {
                    value: formatCurrency(
                      Number(cardProduct.individualSpendingLimit.amount.value),
                      cardProduct.individualSpendingLimit.amount.currency,
                    ),
                  }),
                )
                .exhaustive()}
            </LakeText>

            <Box alignItems="center">
              {cardProduct.applicableToPhysicalCards ? (
                <>
                  <Space height={24} />

                  <LakeText align="center" variant="smallRegular">
                    {t("cards.availableFormats")}
                  </LakeText>

                  <Space height={4} />

                  <Tag color="shakespear" icon="payment-regular">
                    {t("cards.format.physical")}
                  </Tag>
                </>
              ) : null}
            </Box>
          </View>
        );
      }}
      value={currentCardProduct}
      getId={item => item.id}
      onChange={setCurrentCardProduct}
    />
  );
};
