import { Link } from "@swan-io/chicane";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { SimpleTitleCell } from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { AccountStatementsPageDocument, AccountStatementsPageQuery } from "../graphql/partner";
import { t } from "../utils/i18n";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  root: {
    height: 300,
    overflow: "hidden",
    borderTopColor: colors.gray[100],
    borderTopWidth: 1,
  },
  cellContainerLarge: {
    paddingLeft: spacings[24],
    paddingRight: spacings[40],
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  cellContainer: {
    paddingRight: spacings[16],
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
};

type ExtraInfo = { large: boolean };
type Statement = GetNode<
  NonNullable<NonNullable<AccountStatementsPageQuery["account"]>["statements"]>
>;

const columns: ColumnConfig<Statement, ExtraInfo>[] = [
  {
    title: "date",
    width: "grow",
    id: "date",
    renderTitle: () => null,
    renderCell: ({ item: { openingDate, type }, extraInfo: { large } }) => {
      const url = type.find(item => item?.__typename === "PdfStatement")?.url;
      return (
        <View style={large ? styles.cellContainerLarge : styles.cellContainer}>
          <SimpleTitleCell text={dayjs(openingDate).format("MMMM YYYY")} />

          {url != null ? (
            <Icon name="open-regular" size={16} color={colors.gray[300]} />
          ) : (
            <LakeText variant="regular" color={colors.gray[300]}>
              {t("accountStatements.notReady")}
            </LakeText>
          )}
        </View>
      );
    },
  },
];

const PER_PAGE = 20;

export const AccountStatementsList = ({ accountId, large }: Props) => {
  const { data, nextData, setAfter } = useUrqlPaginatedQuery(
    {
      query: AccountStatementsPageDocument,
      variables: {
        first: PER_PAGE,
        accountId,
      },
    },
    [accountId],
  );

  return (
    <View style={styles.root}>
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
                  <FixedListViewEmpty icon="lake-inbox-empty" title={t("common.list.noResults")} />
                )}
              />
            ),
          }),
      })}
    </View>
  );
};
