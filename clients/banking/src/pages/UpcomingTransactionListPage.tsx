import { Option } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { useCallback, useEffect, useRef, useState } from "react";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import { UpcomingTransactionListPageDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  accountMembershipId: string;
  onUpcomingTransactionCountUpdated?: (count: number | undefined) => void;
};

export const UpcomingTransactionListPage = ({
  accountId,
  accountMembershipId,
  onUpcomingTransactionCountUpdated,
}: Props) => {
  const { canReadOtherMembersCards: canQueryCardOnTransaction } = usePermissions();
  const [data, { isLoading, setVariables }] = useQuery(UpcomingTransactionListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    canQueryCardOnTransaction,
  });

  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const count = data
    .toOption()
    .flatMap(result => result.toOption())
    .flatMap(data => Option.fromNullable(data.account?.transactions?.totalCount))
    .toUndefined();

  useEffect(() => {
    if (count !== undefined) {
      onUpcomingTransactionCountUpdated?.(count);
    }
  }, [onUpcomingTransactionCountUpdated, count]);

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
            count={NUM_TO_RENDER}
            groupHeaderHeight={48}
            headerHeight={48}
            rowHeight={56}
          />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <Connection connection={data.account?.transactions}>
                {transactions => (
                  <>
                    <TransactionList
                      withStickyTabs={true}
                      transactions={transactions?.edges ?? []}
                      getRowLink={({ item }) => (
                        <Pressable onPress={() => setActiveTransactionId(item.id)} />
                      )}
                      pageSize={NUM_TO_RENDER}
                      activeRowId={activeTransactionId ?? undefined}
                      onActiveRowChange={onActiveRowChange}
                      loading={{
                        isLoading,
                        count: 2,
                      }}
                      onEndReached={() => {
                        if (transactions?.pageInfo.hasNextPage ?? false) {
                          setVariables({
                            after: transactions?.pageInfo.endCursor ?? undefined,
                          });
                        }
                      }}
                      renderEmptyList={() => (
                        <EmptyView
                          icon="lake-transfer"
                          borderedIcon={true}
                          title={t("upcomingTransansactionList.noResults")}
                          subtitle={t("upcomingTransansactionList.noResultsDescription")}
                        />
                      )}
                    />

                    <ListRightPanel
                      ref={panelRef}
                      keyExtractor={item => item.id}
                      activeId={activeTransactionId}
                      onActiveIdChange={setActiveTransactionId}
                      onClose={() => setActiveTransactionId(null)}
                      items={transactions?.edges.map(item => item.node) ?? []}
                      render={(transaction, large) => (
                        <TransactionDetail
                          accountMembershipId={accountMembershipId}
                          large={large}
                          transactionId={transaction.id}
                        />
                      )}
                      closeLabel={t("common.closeButton")}
                      previousLabel={t("common.previous")}
                      nextLabel={t("common.next")}
                    />
                  </>
                )}
              </Connection>
            ),
          }),
      })}
    </>
  );
};
