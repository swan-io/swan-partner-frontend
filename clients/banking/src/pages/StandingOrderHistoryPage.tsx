import { Box } from "@swan-io/lake/src/components/Box";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useQuery } from "urql";
import { ErrorView } from "../components/ErrorView";
import { TransactionListLegacy } from "../components/TransactionListLegacy";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";
import {
  StandingOrderPeriod,
  StandingOrdersHistoryPageDocument,
  StandingOrdersHistoryPageQueryVariables,
} from "../graphql/partner";
import { t, TranslationKey } from "../utils/i18n";
import { getTransactions, TransactionProps } from "../utils/transactions";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  headerDesktop: {
    paddingTop: 56,
    paddingHorizontal: 80,
  },
  account: {
    ...typography.bodyLarge,
    textAlign: "center",
    color: colors.gray[400],
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  standingOrderId: string;
  canQueryCardOnTransaction: boolean;
};

export const StandingOrderHistoryPage = ({ standingOrderId, canQueryCardOnTransaction }: Props) => {
  const accentColor = useLegacyAccentColor();

  const { desktop, media } = useResponsive();

  const [variables, setVariables] = useState<StandingOrdersHistoryPageQueryVariables>({
    standingOrderId,
    orderBy: { field: "createdAt", direction: "Desc" },
    first: NUM_TO_RENDER,
    canQueryCardOnTransaction,
  });

  const [{ fetching, data, error }] = useQuery({
    query: StandingOrdersHistoryPageDocument,
    variables,
    context: useMemo(() => ({ suspense: false }), []),
  });

  const hasBeenFetchedOnce = Boolean(data ?? error);
  const initialFetching = fetching && !hasBeenFetchedOnce;
  const additionalFetching = fetching && hasBeenFetchedOnce;

  const standingOrder = data?.standingOrder;
  const transactions = useMemo(() => {
    let list: TransactionProps[] = [];

    standingOrder?.payments.edges
      .filter(({ node }) => Boolean(node.transactions?.totalCount))
      .forEach(({ node }) => (list = [...list, ...getTransactions(node.transactions)]));

    return list;
  }, [standingOrder?.payments]);

  const periodMapping: Record<StandingOrderPeriod, TranslationKey> = {
    Daily: "payments.new.standingOrder.details.daily",
    Weekly: "payments.new.standingOrder.details.weekly",
    Monthly: "payments.new.standingOrder.details.monthly",
  };

  const pageInfo = standingOrder?.payments.pageInfo;
  const hasNextPage = Boolean(pageInfo?.hasNextPage);
  const endCursor = pageInfo?.endCursor;

  if (initialFetching) {
    return <LoadingView color={accentColor} />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  return (
    <>
      <Box style={[styles.header, desktop && styles.headerDesktop]}>
        <Heading align="center" level={1} size={media({ mobile: 24, desktop: 32 })}>
          {t("standingOrders.history.title")}
        </Heading>

        <Text numberOfLines={1} style={styles.account}>
          {t(periodMapping[standingOrder?.period ?? "Daily"])} -{" "}
          {standingOrder?.sepaBeneficiary.name ?? ""}
        </Text>

        <Space height={media({ mobile: 16, desktop: 32 })} />
      </Box>

      <TransactionListLegacy
        transactions={transactions}
        pageSize={NUM_TO_RENDER}
        additionalFetching={additionalFetching}
        loaderColor={accentColor}
        onEndReached={() => {
          setVariables(
            (prevVariables): StandingOrdersHistoryPageQueryVariables =>
              prevVariables.after === endCursor || !hasNextPage
                ? prevVariables
                : { ...prevVariables, after: endCursor },
          );
        }}
      />
    </>
  );
};
