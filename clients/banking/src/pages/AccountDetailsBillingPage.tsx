import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  CellAction,
  EndAlignedCell,
  SimpleHeaderCell,
  SimpleRegularTextCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import {
  AccountDetailsBillingPageDocument,
  AccountDetailsBillingPageQuery,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

const styles = StyleSheet.create({
  regularText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexGrow: 1,
    whiteSpace: "nowrap",
  },
});

type Props = {
  accountId: string;
  large: boolean;
};

type ExtraInfo = undefined;

type Invoices = GetNode<
  NonNullable<NonNullable<AccountDetailsBillingPageQuery["account"]>["invoices"]>
>;

const columns: ColumnConfig<Invoices, ExtraInfo>[] = [
  {
    title: t("accountDetails.billing.name"),
    width: "grow",
    id: "name",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { name, type } }) => (
      <StartAlignedCell>
        <Box direction="column">
          <LakeText color={colors.gray[900]} style={styles.regularText} variant="regular">
            {name}
          </LakeText>

          <Space height={4} />

          {match(type)
            .with("Invoice", () => (
              <Tag color="shakespear">{t("accountDetails.billing.type.Invoice")}</Tag>
            ))
            .with("RefundNote", () => (
              <Tag color="darkPink">{t("accountDetails.billing.type.RefundNote")}</Tag>
            ))
            .otherwise(() => null)}
        </Box>
      </StartAlignedCell>
    ),
  },
  {
    title: t("accountDetails.billing.date"),
    width: 200,
    id: "date",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item: { createdAt } }) => (
      <SimpleRegularTextCell text={dayjs(createdAt).format("LL")} textAlign="right" />
    ),
  },
  {
    title: t("accountDetails.billing.amount"),
    width: 200,
    id: "invoice",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item: { amount } }) => (
      <SimpleRegularTextCell
        text={formatCurrency(Number(amount.value), amount.currency)}
        textAlign="right"
      />
    ),
  },
  {
    width: 120,
    id: "status",
    title: t("accountDetails.billing.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item: { status } }) => (
      <EndAlignedCell>
        {match(status)
          .with("Failed", value => <Tag color="negative">{value}</Tag>)
          .with("NotPaid", value => <Tag color="negative">{value}</Tag>)
          .with("Paid", value => <Tag color="positive">{value}</Tag>)
          .with("PaymentDue", value => <Tag color="warning">{value}</Tag>)
          .with("Pending", value => <Tag color="warning">{value}</Tag>)
          .with("Voided", value => <Tag color="gray">{value}</Tag>)
          .exhaustive()}
      </EndAlignedCell>
    ),
  },
  {
    width: 120,
    id: "download",
    title: t("accountDetails.billing.actions"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item: { url, status } }) => {
      return (
        <EndAlignedCell>
          {isNotNullish(url) &&
          (status === "Paid" || status === "NotPaid" || status === "PaymentDue") ? (
            <Link target="blank" to={url} download={true}>
              <CellAction>
                <Icon color={colors.gray[500]} size={18} name="arrow-download-filled" />
              </CellAction>
            </Link>
          ) : (
            <CellAction>
              <LakeTooltip
                content={t("accountDetails.billing.noDocumentTooltip")}
                placement="right"
                togglableOnFocus={true}
                hideArrow={true}
              >
                <Icon
                  color={colors.gray[300]}
                  size={18}
                  name="arrow-download-filled"
                  tabIndex={0}
                />
              </LakeTooltip>
            </CellAction>
          )}
        </EndAlignedCell>
      );
    },
  },
];

const smallColumns: ColumnConfig<Invoices, ExtraInfo>[] = [
  {
    title: t("accountDetails.billing.name"),
    width: "grow",
    id: "name",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { name, type } }) => (
      <StartAlignedCell>
        <Box direction="column">
          <LakeText color={colors.gray[900]} style={styles.regularText} variant="regular">
            {name}
          </LakeText>

          <Space height={4} />

          {match(type)
            .with("Invoice", () => (
              <Tag color="shakespear">{t("accountDetails.billing.type.Invoice")}</Tag>
            ))
            .with("RefundNote", () => (
              <Tag color="darkPink">{t("accountDetails.billing.type.RefundNote")}</Tag>
            ))
            .otherwise(() => null)}
        </Box>
      </StartAlignedCell>
    ),
  },

  {
    title: t("accountDetails.billing.amount"),
    width: 150,
    id: "invoice",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { amount } }) => (
      <SimpleRegularTextCell text={formatCurrency(Number(amount.value), amount.currency)} />
    ),
  },
  {
    width: 120,
    id: "status",
    title: t("accountDetails.billing.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { status } }) => (
      <StartAlignedCell>
        {match(status)
          .with("Failed", value => <Tag color="negative">{value}</Tag>) //pas montré
          .with("NotPaid", value => <Tag color="negative">{value}</Tag>)
          .with("Paid", value => <Tag color="positive">{value}</Tag>)
          .with("PaymentDue", value => <Tag color="warning">{value}</Tag>)
          .with("Pending", value => <Tag color="warning">{value}</Tag>) //pas montré
          .with("Voided", value => <Tag color="gray">{value}</Tag>)
          .exhaustive()}
      </StartAlignedCell>
    ),
  },
  {
    width: 48,
    id: "download",
    title: t("accountDetails.billing.actions"),
    renderTitle: () => null,
    renderCell: ({ item: { url, status } }) => {
      return (
        <EndAlignedCell>
          {isNotNullish(url) &&
          (status === "Paid" || status === "NotPaid" || status === "PaymentDue") ? (
            <Link target="blank" to={url} download={true}>
              <CellAction>
                <Icon color={colors.gray[500]} size={18} name="arrow-download-filled" />
              </CellAction>
            </Link>
          ) : (
            <CellAction>
              <LakeTooltip
                content={t("accountDetails.billing.noDocumentTooltip")}
                placement="right"
                togglableOnFocus={true}
                hideArrow={true}
              >
                <Icon
                  color={colors.gray[300]}
                  size={18}
                  name="arrow-download-filled"
                  tabIndex={0}
                />
              </LakeTooltip>
            </CellAction>
          )}
        </EndAlignedCell>
      );
    },
  },
];

const PER_PAGE = 20;

export const AccountDetailsBillingPage = ({ accountId, large }: Props) => {
  const [data, { isLoading, setVariables }] = useQuery(AccountDetailsBillingPageDocument, {
    accountId,
    first: PER_PAGE,
  });

  return data.match({
    NotAsked: () => null,
    Loading: () => (
      <PlainListViewPlaceholder count={20} groupHeaderHeight={0} headerHeight={48} rowHeight={72} />
    ),
    Done: result =>
      result.match({
        Ok: ({ account }) => (
          <Connection connection={account?.invoices}>
            {invoices => (
              <PlainListView
                withoutScroll={!large}
                data={invoices?.edges?.map(({ node }) => node) ?? []}
                keyExtractor={item => item.id}
                headerHeight={48}
                rowHeight={72}
                groupHeaderHeight={48}
                extraInfo={undefined}
                columns={columns}
                smallColumns={smallColumns}
                loading={{
                  isLoading,
                  count: PER_PAGE,
                }}
                onEndReached={() => {
                  if (invoices?.pageInfo.hasNextPage === true) {
                    setVariables({ after: invoices?.pageInfo.endCursor ?? undefined });
                  }
                }}
                renderEmptyList={() => (
                  <EmptyView
                    icon="lake-receipt"
                    borderedIcon={true}
                    title={t("accountDetails.billing.emptyTitle")}
                    subtitle={t("accountDetails.billing.emptyDescription")}
                  />
                )}
              />
            )}
          </Connection>
        ),
        Error: error => <ErrorView error={error} />,
      }),
  });
};
