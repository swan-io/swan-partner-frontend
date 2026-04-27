import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { CSSProperties, Ref, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextProps,
  unstable_createElement,
  View,
  ViewProps,
} from "react-native";
import { match } from "ts-pattern";
import { Except } from "type-fest";
import {
  CardInsurancePackage,
  CardInsurancePackageLevel,
  CardProductFundingType,
  CreditLimitStatus,
  GetCardProductsQuery,
} from "../graphql/partner";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  tabsContainer: {
    maxWidth: 500,
    width: "100%",
    marginHorizontal: "auto",
  },
  cardDesignContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    alignSelf: "stretch",
  },
  image: {
    width: "100%",
    maxWidth: 150,
    marginHorizontal: "auto",
    transform: "perspective(1000px) rotateX(50deg) rotateZ(35deg)",
  },
  insurances: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacings[16],
  },
  insurance: {
    flexBasis: `calc(50% - ${spacings[16]} / 2)`,
    padding: spacings[12],
    borderRadius: radii[6],
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  insuranceDisabled: {
    opacity: 0.5,
  },
  link: {
    color: colors.current.primary,
    display: "inline-block",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: radii[8],
  },
  table: {
    borderCollapse: "collapse",
  },
  cell: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    borderBottomStyle: "solid",
  },
  lastCell: {
    borderBottomWidth: 0,
  },
  leftColumnHeading: {
    textAlign: "left",
  },
  centered: {
    textAlign: "center",
  },
  tableIcon: {
    margin: "auto",
  },
  confirmButton: {
    flex: 1,
  },
  modalLink: {
    textDecorationLine: "underline",
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

// const INSURANCE_DOCS_URL = "https://support.swan.io/hc/en-150/articles/27554041478301-Card-insurance";
const INSURANCE_DOCS_URL = null; // undefined at the moment until the page is published

const getTitleModal = (insuranceType: CardInsurancePackage) => {
  return match(insuranceType)
    .with({ level: "Basic" }, { level: "Standard" }, () =>
      t("cardProducts.insurance.titleModal.standard"),
    )
    .with({ level: "Custom" }, () => t("cardProducts.insurance.titleModal.custom"))
    .with({ level: "Premium" }, () => t("cardProducts.insurance.titleModal.premium"))
    .with({ level: "Essential" }, () => t("cardProducts.insurance.titleModal.essential"))
    .exhaustive();
};
type CardProduct = NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>[number];

type AccountHolderType = "Company" | "Individual";

export type CardWizardProductRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardProductRef>;
  accountHolderType: AccountHolderType | undefined;
  accountId: string;
  isLegalRepresentative: boolean;
  creditLimitStatus: CreditLimitStatus | undefined;
  cardProducts: NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>;
  initialCardProduct?: CardProduct;
  onSubmit: (cardProduct: CardProduct) => void;
};

const Table = (props: ViewProps) => unstable_createElement("table", props);
const THead = (props: ViewProps) => unstable_createElement("thead", props);
const Th = (
  props: Except<ViewProps, "style"> & { style?: ViewProps["style"] | TextProps["style"] },
) => unstable_createElement("th", props);
const TBody = (props: ViewProps) => unstable_createElement("tbody", props);
const Tr = (props: ViewProps) => unstable_createElement("tr", props);
const Td = (
  props: Except<ViewProps, "style"> & { style?: ViewProps["style"] | TextProps["style"] },
) => unstable_createElement("td", props);

const YES_ICON = (
  <Icon
    style={styles.tableIcon}
    name="shield-checkmark-regular"
    size={20}
    color={colors.positive[500]}
  />
);

type CardInsuranceDetailProps = {
  insuranceLevel: Exclude<CardInsurancePackageLevel, "Custom">;
};

export const CardInsuranceDetail = ({ insuranceLevel }: CardInsuranceDetailProps) => {
  return (
    <>
      <Space height={16} />

      <View style={styles.tableContainer}>
        <Table style={styles.table}>
          <THead>
            <Tr>
              <Th style={[styles.cell, styles.lastCell, styles.leftColumnHeading]}>
                <LakeText variant="semibold">{t("cardProducts.insurance.coverage")}</LakeText>
              </Th>
              <Th style={[styles.cell, styles.lastCell]}>
                {match(insuranceLevel)
                  .with("Basic", "Standard", () => (
                    <LakeText variant="semibold">{t("cardProducts.insurance.Standard")}</LakeText>
                  ))
                  .with("Premium", () => (
                    <LakeText variant="semibold">{t("cardProducts.insurance.Premium")}</LakeText>
                  ))
                  .with("Essential", () => (
                    <LakeText variant="semibold">{t("cardProducts.insurance.Essential")}</LakeText>
                  ))
                  .otherwise(() => null)}
              </Th>
            </Tr>
          </THead>
          <TBody>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.id")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.eReputation")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.fraudTransaction")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.fraudPhishing")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>
                  {t("cardProducts.insurance.coverage.travelModificationCancelation")}
                </LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => (
                  <Td style={[styles.cell, styles.centered]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.travelRental")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => (
                  <Td style={[styles.cell, styles.centered]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.travelDelay")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => (
                  <Td style={[styles.cell, styles.centered]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={styles.cell}>
                <LakeText>{t("cardProducts.insurance.coverage.travelBagages")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => (
                  <Td style={[styles.cell, styles.centered]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .with("Premium", () => <Td style={styles.cell}>{YES_ICON}</Td>)
                .with("Essential", () => (
                  <Td style={[styles.cell, styles.centered]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .otherwise(() => null)}
            </Tr>
            <Tr>
              <Td style={[styles.cell, styles.lastCell]}>
                <LakeText>{t("cardProducts.insurance.coverage.medicalExpensesAbroad")}</LakeText>
              </Td>
              {match(insuranceLevel)
                .with("Basic", "Standard", () => (
                  <Td style={[styles.cell, styles.centered, styles.lastCell]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .with("Premium", () => <Td style={[styles.cell, styles.lastCell]}>{YES_ICON}</Td>)
                .with("Essential", () => (
                  <Td style={[styles.cell, styles.centered, styles.lastCell]}>
                    <LakeText color={colors.gray[200]}>—</LakeText>
                  </Td>
                ))
                .otherwise(() => null)}
            </Tr>
          </TBody>
        </Table>
      </View>

      {INSURANCE_DOCS_URL != null && (
        <>
          <Space height={16} />

          <LakeText>
            <Link style={styles.link} to={INSURANCE_DOCS_URL} target="blank">
              <Box direction="row" alignItems="center">
                <LakeText color={colors.current.primary}>
                  {match(insuranceLevel)
                    .with("Basic", "Standard", () => t("cardDetail.insurance.readMore.basic"))
                    .with("Premium", () => t("cardDetail.insurance.readMore.premium"))
                    .with("Essential", () => t("cardDetail.insurance.readMore.essential"))
                    .otherwise(() => null)}
                </LakeText>

                <Space width={4} />
                <Icon color={colors.current.primary} name="open-filled" size={16} />
              </Box>
            </Link>
          </LakeText>
        </>
      )}
    </>
  );
};

export const CardWizardProduct = ({
  ref,
  accountId,
  accountHolderType,
  isLegalRepresentative,
  creditLimitStatus,
  cardProducts,
  initialCardProduct,
  onSubmit,
}: Props) => {
  const [currentCardProduct, setCurrentCardProduct] = useState<CardProduct | undefined>(
    () => initialCardProduct ?? cardProducts.find(cardProduct => cardProduct.defaultCardProduct),
  );
  const [fundingType, setFundingType] = useState<CardProductFundingType>("Debit");
  const hasDeferredCardProductsDebit = cardProducts.some(
    cardProduct => cardProduct.fundingType === "DeferredDebit",
  );
  const displayedCardProducts = useMemo(
    () => cardProducts.filter(cardProduct => cardProduct.fundingType === fundingType),
    [cardProducts, fundingType],
  );
  const [showRequestCreditModal, setShowRequestCreditModal] = useBoolean(false);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        if (currentCardProduct == null) {
          return;
        }
        if (
          currentCardProduct.fundingType === "DeferredDebit" &&
          creditLimitStatus !== "Activated"
        ) {
          setShowRequestCreditModal.on();
          return;
        }

        onSubmit(currentCardProduct);
      },
    }),
    [currentCardProduct, creditLimitStatus, setShowRequestCreditModal, onSubmit],
  );

  // Auto submit when there's only one card product available
  useEffect(() => {
    if (cardProducts.length <= 1 && cardProducts[0] != null) {
      onSubmit(cardProducts[0]);
    }
  }, [cardProducts, onSubmit]);

  // Auto select the first card product when changing funding type
  useEffect(() => {
    const defaultCardProduct = displayedCardProducts.find(
      cardProduct => cardProduct.defaultCardProduct,
    );
    setCurrentCardProduct(defaultCardProduct ?? displayedCardProducts[0]);
  }, [displayedCardProducts]);

  const [opened, setOpened] = useDisclosure(false);
  const [insuranceType, setInsuranceType] = useState<CardInsurancePackage>();
  return (
    <>
      {hasDeferredCardProductsDebit && (
        <View style={styles.tabsContainer}>
          <SegmentedControl
            selected={fundingType}
            onValueChange={setFundingType}
            items={[
              { id: "Debit", name: t("cards.fundingType.debit") },
              { id: "DeferredDebit", name: t("cards.fundingType.deferredDebit") },
            ]}
          />
          <Space height={24} />
        </View>
      )}

      <ChoicePicker
        tileColor="current"
        items={displayedCardProducts}
        renderItem={cardProduct => {
          const cardDesign = cardProduct.cardDesigns.find(item => item.status === "Enabled");
          const cardDesignUrl = cardDesign?.cardDesignUrl;
          const defaultInsurancePackage =
            cardProduct.insurance?.defaultInsurancePackage ??
            cardProduct.insurance?.availableInsurancePackages?.[0];

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

              <Space height={40} />

              <LakeHeading level={3} variant="h3">
                {cardProduct.name}
              </LakeHeading>

              <Space height={32} />

              <CardProductLine>
                <>
                  {t("cards.maxSpendingLimit")}
                  <Space width={4} />
                  <LakeText align="center" variant="smallSemibold" color={colors.gray[900]}>
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
                      .otherwise(() => null)}
                  </LakeText>
                </>
              </CardProductLine>

              {cardProduct.applicableToPhysicalCards ? (
                <>
                  <Space height={12} />

                  <CardProductLine>
                    {formatNestedMessage("cards.availableAsPhysical", {
                      bold: text => (
                        <LakeText variant="semibold" color={colors.gray[900]}>
                          {text}
                        </LakeText>
                      ),
                    })}
                  </CardProductLine>
                </>
              ) : null}

              {cardProduct.fundingType === "DeferredDebit" ? (
                <>
                  <Space height={12} />

                  <CardProductLine>{t("cards.manageCashFlow")}</CardProductLine>
                </>
              ) : null}

              {defaultInsurancePackage != null && accountHolderType === "Company" && (
                <>
                  <Space height={12} />

                  <CardProductLine>
                    {t("cardProducts.insurance")}
                    {": "}
                    <Box direction="row" alignItems="center">
                      <LakeText variant="semibold" color={colors.gray[900]}>
                        {match(defaultInsurancePackage)
                          .with({ level: "Basic" }, { level: "Standard" }, () =>
                            t("cardProducts.insurance.Standard"),
                          )
                          .with({ level: "Essential" }, () => t("cardProducts.insurance.Essential"))
                          .with({ level: "Premium" }, () => t("cardProducts.insurance.Premium"))
                          .otherwise(() => null)}
                      </LakeText>

                      <Space width={4} />

                      {defaultInsurancePackage.level !== "Custom" && (
                        <Pressable
                          onPress={() => {
                            setInsuranceType(defaultInsurancePackage);
                            setOpened.open();
                          }}
                        >
                          <Icon name="info-regular" size={16} color={colors.gray[600]} />
                        </Pressable>
                      )}
                    </Box>
                  </CardProductLine>
                </>
              )}
            </View>
          );
        }}
        value={currentCardProduct}
        getId={item => item.id}
        onChange={setCurrentCardProduct}
      />

      <LakeModal
        visible={showRequestCreditModal}
        icon="info-regular"
        color="current"
        title={t("cards.requestCreditLimit.title")}
      >
        <LakeText>
          {formatNestedMessage("cards.requestCreditLimit.description", {
            link: text => (
              <Link to="https://docs.swan.io/" target="blank">
                <LakeText style={styles.modalLink} color={colors.current[500]}>
                  {text}
                </LakeText>
              </Link>
            ),
          })}
        </LakeText>

        <Space height={48} />

        <Box direction="row">
          <LakeButton
            style={styles.confirmButton}
            mode="secondary"
            onPress={setShowRequestCreditModal.off}
          >
            {t("common.cancel")}
          </LakeButton>

          {isLegalRepresentative && (
            <>
              <Space width={24} />

              <LakeButton
                style={styles.confirmButton}
                color="current"
                onPress={() => {
                  setShowRequestCreditModal.off();
                  Router.push("CreditLimitRequest", { accountId, from: "NewCard" });
                }}
              >
                {t("cards.requestCreditLimit.cta")}
              </LakeButton>
            </>
          )}
        </Box>
      </LakeModal>

      {insuranceType !== undefined && insuranceType.level !== "Custom" && (
        <LakeModal
          onPressClose={setOpened.close}
          visible={opened}
          icon="shield-checkmark-regular"
          title={getTitleModal(insuranceType)}
          maxWidth={800}
        >
          <CardInsuranceDetail insuranceLevel={insuranceType.level} />
        </LakeModal>
      )}
    </>
  );
};

const CardProductLine = ({ children }: { children: string | React.ReactNode }) => (
  <Box direction="row" alignItems="center">
    <Icon name="checkmark-filled" size={16} color={colors.gray[600]} />
    <Space width={4} />
    <LakeText variant="light" color={colors.gray[600]}>
      {children}
    </LakeText>
  </Box>
);
