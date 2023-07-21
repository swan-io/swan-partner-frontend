import { Link } from "@swan-io/chicane";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  SimpleRegularTextCell,
  SimpleTitleCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { ErrorView } from "../components/ErrorView";
import { AccountStatementsPageDocument, AccountStatementsPageQuery } from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  cellContainerLarge: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  cellContainer: {
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  large: boolean;
  accountMembershipId: string;
};

type ExtraInfo = { large: boolean };
type Statement = GetNode<
  NonNullable<NonNullable<AccountStatementsPageQuery["account"]>["statements"]>
>;

const columns: ColumnConfig<Statement, ExtraInfo>[] = [
  {
    title: "date",
    width: 200,
    id: "date",
    renderTitle: () => null,
    renderCell: ({ item: { openingDate }, extraInfo: { large } }) => (
      <View style={large ? styles.cellContainerLarge : styles.cellContainer}>
        <SimpleTitleCell text={dayjs(openingDate).format("MMMM YYYY")} />
      </View>
    ),
  },
  {
    title: "createdAt",
    width: "grow",
    id: "createdAt",
    renderTitle: () => null,
    renderCell: ({ item: { createdAt } }) => (
      <SimpleRegularTextCell
        textAlign="right"
        variant="smallMedium"
        text={dayjs(createdAt).format("MMM, DD YYYY")}
      />
    ),
  },
  {
    title: "notReady",
    width: 250,
    id: "notReady",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? null : (
        <SimpleRegularTextCell
          color={colors.gray[300]}
          textAlign="right"
          variant="smallMedium"
          text={t("accountStatements.notReady")}
        />
      );
    },
  },
  {
    title: "download",
    width: 50,
    id: "download",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? (
        <Icon name="open-regular" size={16} color={colors.gray[300]} />
      ) : null;
    },
  },
];

const PER_PAGE = 20;

export const AccountStatementMonthly = ({ accountId, large }: Props) => {
  const { data, nextData, setAfter } = useUrqlPaginatedQuery(
    {
      query: AccountStatementsPageDocument,
      variables: {
        first: PER_PAGE,
        accountId,
        filters: { period: "Monthly" },
      },
    },
    [accountId],
  );

  return (
    <>
      {data.match({
        NotAsked: () => null,
        Loading: () => (
          <PlainListViewPlaceholder
            count={20}
            rowVerticalSpacing={0}
            headerHeight={0}
            rowHeight={48}
          />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: ({ account }) => (
              <>
                <Space height={24} />

                <PlainListView
                  data={account?.statements?.edges?.map(({ node }) => node) ?? []}
                  keyExtractor={item => item.id}
                  headerHeight={48}
                  rowHeight={48}
                  groupHeaderHeight={48}
                  extraInfo={{ large }}
                  columns={columns}
                  getRowLink={({ item }) => {
                    const url = item.type.find(item => item?.__typename === "PdfStatement")?.url;
                    return url != null ? <Link to={url} target="_blank" /> : <View />;
                  }}
                  loading={{
                    isLoading: nextData.isLoading(),
                    count: NUM_TO_RENDER,
                  }}
                  onEndReached={() => {
                    if (account?.statements?.pageInfo.hasNextPage ?? false) {
                      setAfter(account?.statements?.pageInfo.endCursor ?? undefined);
                    }
                  }}
                  renderEmptyList={() => (
                    <FixedListViewEmpty
                      icon="lake-inbox-empty"
                      title={t("common.list.noResults")}
                    />
                  )}
                />
              </>
            ),
          }),
      })}
    </>
  );
};
