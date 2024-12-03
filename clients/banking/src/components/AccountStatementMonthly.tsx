import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Cell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { ErrorView } from "../components/ErrorView";
import { AccountStatementsPageDocument, AccountStatementsPageQuery } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Connection } from "./Connection";

const styles = StyleSheet.create({
  columnHeaders: {
    paddingHorizontal: spacings[32],
  },
  containerRowLarge: {
    paddingHorizontal: spacings[32],
  },
  containerRow: {
    paddingHorizontal: spacings[8],
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
    title: t("accountStatements.period"),
    width: "grow",
    id: "period",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { openingDate } }) => (
      <TextCell variant="medium" text={dayjs(openingDate).format("MMMM YYYY")} />
    ),
  },
  {
    title: t("accountStatements.generated"),
    width: 150,
    id: "generated",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { createdAt, status } }) => {
      return status === "Available" ? (
        <TextCell variant="smallMedium" text={dayjs(createdAt).format("MMM, DD YYYY")} />
      ) : null;
    },
  },
  {
    title: "notReady",
    width: 180,
    id: "notReady",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? null : (
        <TextCell
          align="right"
          color={colors.gray[300]}
          variant="smallMedium"
          text={t("accountStatements.notReady")}
        />
      );
    },
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? (
        <Cell align="center">
          <Icon name="open-regular" size={16} color={colors.gray[300]} />
        </Cell>
      ) : null;
    },
  },
];

const smallColumns: ColumnConfig<Statement, ExtraInfo>[] = [
  {
    title: t("accountStatements.period"),
    width: "grow",
    id: "period",
    renderTitle: () => null,
    renderCell: ({ item: { openingDate } }) => (
      <TextCell variant="medium" text={dayjs(openingDate).format("MMMM YYYY")} />
    ),
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return (
        <Cell align="right">
          {status === "Available" ? (
            <Icon name="open-regular" size={16} color={colors.gray[300]} />
          ) : (
            <BorderedIcon
              name="clock-regular"
              padding={4}
              size={24}
              color="warning"
              borderRadius={4}
            />
          )}
        </Cell>
      );
    },
  },
];

const PER_PAGE = 20;

export const AccountStatementMonthly = ({ accountId, large }: Props) => {
  const [data, { isLoading, setVariables }] = useQuery(AccountStatementsPageDocument, {
    first: PER_PAGE,
    accountId,
    filters: { period: "Monthly" },
  });

  return (
    <>
      {data.match({
        NotAsked: () => null,
        Loading: () => <PlainListViewPlaceholder count={20} headerHeight={48} rowHeight={48} />,
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: ({ account }) => (
              <>
                <Space height={24} />

                <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
                  {() => (
                    <Connection connection={account?.statements}>
                      {statements => (
                        <PlainListView
                          headerStyle={styles.columnHeaders}
                          rowStyle={() => (large ? styles.containerRowLarge : styles.containerRow)}
                          breakpoint={breakpoints.medium}
                          data={statements?.edges?.map(({ node }) => node) ?? []}
                          keyExtractor={item => item.id}
                          headerHeight={48}
                          rowHeight={48}
                          groupHeaderHeight={48}
                          extraInfo={{ large }}
                          columns={columns}
                          getRowLink={({ item }) => {
                            const availableItem =
                              item.status === "Available" ? Option.Some(item) : Option.None();
                            return availableItem
                              .flatMap(item =>
                                Array.findMap(item.type, item => Option.fromNullable(item?.url)),
                              )
                              .map(url => <Link to={url} target="_blank" />)
                              .getOr(<View />);
                          }}
                          loading={{
                            isLoading,
                            count: NUM_TO_RENDER,
                          }}
                          onEndReached={() => {
                            if (statements?.pageInfo.hasNextPage ?? false) {
                              setVariables({
                                after: statements?.pageInfo.endCursor ?? undefined,
                              });
                            }
                          }}
                          renderEmptyList={() => (
                            <EmptyView icon="lake-inbox-empty" title={t("common.list.noResults")} />
                          )}
                          smallColumns={smallColumns}
                        />
                      )}
                    </Connection>
                  )}
                </ResponsiveContainer>
              </>
            ),
          }),
      })}
    </>
  );
};
