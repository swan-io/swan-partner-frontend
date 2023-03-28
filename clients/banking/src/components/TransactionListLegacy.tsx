import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish, isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactText, useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { P, match } from "ts-pattern";
import { t } from "../utils/i18n";
import { TransactionProps } from "../utils/transactions";
import { BottomCard } from "./BottomCard";
import { EmptyList } from "./EmptyList";
import { Main } from "./Main";
import { Transaction, TransactionRow } from "./TransactionRow";

const truncateTransactionId = (id: string) => id.split("#", 2)[0];

const styles = StyleSheet.create({
  base: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  sectionTitleWrapper: {
    paddingHorizontal: 16,
  },
  desktopSectionTitleWrapper: {
    paddingHorizontal: 80,
  },

  cardContentMobile: {
    paddingLeft: insets.addToLeft(16),
    paddingRight: insets.addToRight(16),
    paddingBottom: insets.addToBottom(16),
  },
  cardContentDesktop: {
    backgroundColor: invariantColors.white,
    paddingHorizontal: 40,
    paddingBottom: 32,
  },
  detailLine: {
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailTitle: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
    flexShrink: 0,
  },
  detailText: {
    ...typography.bodyLarge,
    color: colors.gray[900],
  },
  rejected: {
    color: colors.negative[500],
  },
  loader: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
  },
  desktopLoader: {
    bottom: 32,
  },
});

type DetailLineProps = {
  title: string;
  children: ReactText;
  intent?: "rejected";
};

const DetailLine = ({ title, children, intent }: DetailLineProps) => (
  <Box direction="row" alignItems="center" style={styles.detailLine}>
    <Text numberOfLines={1} style={styles.detailTitle}>
      {title}
    </Text>

    <Fill minWidth={8} />

    <Text numberOfLines={1} style={[styles.detailText, intent === "rejected" && styles.rejected]}>
      {children}
    </Text>
  </Box>
);

type Section<T> = { title: string; data: T[] };
type TransactionsSection = Section<TransactionProps>;

type Props = {
  additionalFetching: boolean;
  loaderColor: string;
  pageSize: number;
  transactions: TransactionProps[];
  onEndReached: () => void;
};

export const TransactionListLegacy = ({
  additionalFetching,
  loaderColor,
  pageSize,
  transactions,
  onEndReached,
}: Props) => {
  const { desktop } = useResponsive();
  const [selectedId, setSelectedId] = useState<string>();
  const [width, setWidth] = useState(0);

  const sections = useMemo<TransactionsSection[]>(() => {
    const result = transactions.reduce((acc, transaction) => {
      const previousSection = acc[transaction.transactionDate];

      acc[transaction.transactionDate] = previousSection
        ? [...previousSection, transaction]
        : [transaction];

      return acc;
    }, {} as Record<string, TransactionProps[]>);

    return Object.keys(result).map(key => {
      const data = result[key] ?? [];
      return { title: key, data };
    });
  }, [transactions]);

  const details = transactions.find(transaction => transaction.id === selectedId);

  const closeDetails = useCallback(() => {
    setSelectedId(undefined);
  }, []);

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    // TODO: Optimize this
    setWidth(nativeEvent.layout.width);
  }, []);

  return (
    <>
      {sections.length > 0 ? (
        <Main.SectionList
          keyExtractor={item => item.id}
          onLayout={handleLayout}
          sections={sections}
          initialNumToRender={pageSize}
          extraData={selectedId}
          onEndReachedThreshold={0.5}
          onEndReached={onEndReached}
          ListFooterComponent={
            additionalFetching ? (
              <LoadingView
                color={loaderColor}
                style={[styles.loader, desktop && styles.desktopLoader]}
              />
            ) : null
          }
          contentContainerStyle={styles.base}
          renderSectionHeader={({ section }) => {
            const isFirstSection = sections[0]?.title === section.title;

            return (
              <View
                style={[styles.sectionTitleWrapper, desktop && styles.desktopSectionTitleWrapper]}
              >
                <Space height={isFirstSection ? 12 : 16} />

                <Heading level={3} size={20}>
                  {section.title}
                </Heading>

                <Space height={12} />
              </View>
            );
          }}
          renderSectionFooter={() => <Space height={16} />}
          renderItem={({ item }) => (
            <TransactionRow
              amount={item.amount.amount}
              currency={item.amount.currency}
              id={item.id}
              isCredit={item.isCredit}
              label={item.label}
              originalAmount={item.originalAmount?.amount}
              originalAmountCurrency={item.originalAmount?.currency}
              onPress={setSelectedId}
              paymentMethodIcon={item.paymentMethodIcon}
              paymentMethodName={item.paymentMethodName}
              selected={selectedId === item.id}
              statusName={item.statusName}
              variant={item.variant}
            />
          )}
        />
      ) : (
        <EmptyList text={t("transactionsList.empty")} />
      )}

      {details && (
        <BottomCard
          onClose={closeDetails}
          style={{ width: desktop ? width - 160 : width }}
          HeaderComponent={
            <Transaction
              amount={details.amount.amount}
              currency={details.amount.currency}
              isCredit={details.isCredit}
              label={details.label}
              originalAmount={details.originalAmount?.amount}
              originalAmountCurrency={details.originalAmount?.currency}
              paymentMethodIcon={details.paymentMethodIcon}
              paymentMethodName={details.paymentMethodName}
              selected={selectedId === details.id}
              statusName={details.statusName}
              variant={details.variant}
            />
          }
        >
          <ScrollView
            contentContainerStyle={desktop ? styles.cardContentDesktop : styles.cardContentMobile}
          >
            {isNotNullish(details.paymentDateTime) && (
              <DetailLine title={t("transaction.paymentDateTime")}>
                {details.paymentDateTime}
              </DetailLine>
            )}

            {isNotNullish(details.bookingDateTime) && (
              <DetailLine title={t("transaction.bookingDateTime")}>
                {details.bookingDateTime}
              </DetailLine>
            )}

            {isNotNullish(details.debtor) && (
              <DetailLine title={t("transaction.debtor")}>{details.debtor}</DetailLine>
            )}

            {isNotNullish(details.executionDateTime) && (
              <DetailLine title={t("transaction.executionDateTime")}>
                {details.executionDateTime}
              </DetailLine>
            )}

            {isNotNullish(details.creditorName) && (
              <DetailLine title={t("transaction.creditorName")}>{details.creditorName}</DetailLine>
            )}

            {isNotNullish(details.rejectedDate) && (
              <DetailLine title={t("transaction.rejectedDate")}>{details.rejectedDate}</DetailLine>
            )}

            {isNotNullish(details.rejectedReason) && (
              <DetailLine title={t("transaction.rejectedReason")} intent="rejected">
                {details.rejectedReason}
              </DetailLine>
            )}

            {isNotNullish(details.merchantCity) && isNotNullish(details.merchantCountry) && (
              <DetailLine title={t("transaction.place")}>
                {`${details.merchantCity} - ${details.merchantCountry}`}
              </DetailLine>
            )}

            {isNotNullish(details.maskedPan) && (
              <DetailLine title={t("transaction.maskedPan")}>{details.maskedPan}</DetailLine>
            )}

            {isNotNullishOrEmpty(details.cardHolder) && (
              <DetailLine title={t("transaction.cardHolder")}>{details.cardHolder}</DetailLine>
            )}

            {isNotNullish(details.creditorIban) && (
              <DetailLine title={t("transaction.creditorIban")}>{details.creditorIban}</DetailLine>
            )}

            {isNotNullish(details.reference) && (
              <DetailLine title={t("transaction.reference")}>{details.reference}</DetailLine>
            )}

            {match(truncateTransactionId(details.id))
              .with(P.string, id => <DetailLine title={t("transaction.id")}>{id}</DetailLine>)
              .otherwise(() => null)}
          </ScrollView>
        </BottomCard>
      )}
    </>
  );
};
