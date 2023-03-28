import { AsyncData, Option, Result } from "@swan-io/boxed";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { useCallback, useEffect, useRef, useState } from "react";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import { UpcomingTransactionListPageDocument } from "../graphql/partner";
import { t } from "../utils/i18n";

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  canQueryCardOnTransaction: boolean;
  onReceiveData: () => void;
};

export const UpcomingTransactionListPage = ({
  accountId,
  canQueryCardOnTransaction,
  onReceiveData,
}: Props) => {
  const { data, nextData, setAfter } = useUrqlPaginatedQuery(
    {
      query: UpcomingTransactionListPageDocument,
      variables: {
        accountId,
        first: 20,
        canQueryCardOnTransaction,
      },
    },
    [canQueryCardOnTransaction],
  );

  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const transactions = data
    .toOption()
    .flatMap(result => result.toOption())
    .flatMap(data => Option.fromNullable(data.account?.transactions))
    .map(({ edges }) => edges.map(({ node }) => node))
    .getWithDefault([]);

  useEffect(() => {
    match(data)
      .with(AsyncData.pattern.Done(Result.pattern.Ok(P._)), () => {
        onReceiveData();
      })
      .otherwise(() => {});
  }, [data, onReceiveData]);

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  return (
    <>
      {data.match({
        NotAsked: () => null,
        Loading: () => (
          <PlainListViewPlaceholder
            count={20}
            rowVerticalSpacing={0}
            groupHeaderHeight={48}
            headerHeight={48}
            rowHeight={48}
          />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <TransactionList
                withStickyTabs={true}
                transactions={data.account?.transactions?.edges ?? []}
                getRowLink={({ item }) => (
                  <Pressable onPress={() => setActiveTransactionId(item.id)} />
                )}
                pageSize={NUM_TO_RENDER}
                activeRowId={activeTransactionId ?? undefined}
                onActiveRowChange={onActiveRowChange}
                loading={{
                  isLoading: nextData.isLoading(),
                  count: 20,
                }}
                onEndReached={() => {
                  if (data.account?.transactions?.pageInfo.hasNextPage ?? false) {
                    setAfter(data.account?.transactions?.pageInfo.endCursor ?? undefined);
                  }
                }}
                renderEmptyList={() => (
                  <FixedListViewEmpty
                    icon="lake-transfer"
                    borderedIcon={true}
                    title={t("upcomingTransansactionList.noResults")}
                    subtitle={t("upcomingTransansactionList.noResultsDescription")}
                  />
                )}
              />
            ),
          }),
      })}

      <ListRightPanel
        ref={panelRef}
        keyExtractor={item => item.id}
        activeId={activeTransactionId}
        onActiveIdChange={setActiveTransactionId}
        onClose={() => setActiveTransactionId(null)}
        items={transactions}
        render={(transaction, large) => (
          <TransactionDetail large={large} transaction={transaction} />
        )}
        closeLabel={t("common.closeButton")}
        previousLabel={t("common.previous")}
        nextLabel={t("common.next")}
      />
    </>
  );
};
