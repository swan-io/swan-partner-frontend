import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Cell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
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
import { colors, spacings } from "@swan-io/lake/src/constants/design";
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
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
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
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { name, type } }) => (
      <Cell>
        <LakeText color={colors.gray[900]} variant="regular" numberOfLines={1}>
          {name}
        </LakeText>

        <Space width={12} />

        {match(type)
          .with("Invoice", () => (
            <Tag color="shakespear">{t("accountDetails.billing.type.Invoice")}</Tag>
          ))
          .with("RefundNote", () => (
            <Tag color="darkPink">{t("accountDetails.billing.type.RefundNote")}</Tag>
          ))
          .otherwise(() => null)}
      </Cell>
    ),
  },
  {
    title: t("accountDetails.billing.date"),
    width: 200,
    id: "date",
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item: { createdAt } }) => (
      <TextCell text={dayjs(createdAt).format("LL")} align="right" />
    ),
  },
  {
    title: t("accountDetails.billing.amount"),
    width: 200,
    id: "invoice",
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item: { amount } }) => (
      <TextCell text={formatCurrency(Number(amount.value), amount.currency)} align="right" />
    ),
  },
  {
    width: 120,
    id: "status",
    title: t("accountDetails.billing.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item: { status } }) => (
      <Cell align="right">
        {match(status)
          .with("Failed", value => <Tag color="negative">{value}</Tag>)
          .with("NotPaid", value => <Tag color="negative">{value}</Tag>)
          .with("Paid", value => <Tag color="positive">{value}</Tag>)
          .with("PaymentDue", value => <Tag color="warning">{value}</Tag>)
          .with("Pending", value => <Tag color="warning">{value}</Tag>)
          .with("Voided", value => <Tag color="gray">{value}</Tag>)
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 120,
    id: "download",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { url, status } }) => {
      return (
        <Cell align="right">
          {isNotNullish(url) &&
          (status === "Paid" || status === "NotPaid" || status === "PaymentDue") ? (
            <Link target="blank" to={url} download={true}>
              <Icon color={colors.gray[500]} size={18} name="arrow-download-filled" />
            </Link>
          ) : (
            <LakeTooltip
              content={t("accountDetails.billing.noDocumentTooltip")}
              placement="right"
              togglableOnFocus={true}
              hideArrow={true}
            >
              <Icon color={colors.gray[300]} size={18} name="arrow-download-filled" tabIndex={0} />
            </LakeTooltip>
          )}
        </Cell>
      );
    },
  },
];

const smallColumns: ColumnConfig<Invoices, ExtraInfo>[] = [
  {
    title: t("accountDetails.billing.name"),
    width: "grow",
    id: "name",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { name, type } }) => (
      <Cell direction="column" style={styles.paddedCell}>
        <LakeText color={colors.gray[900]} numberOfLines={1} variant="regular">
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
      </Cell>
    ),
  },
  {
    title: t("accountDetails.billing.amount"),
    width: 150,
    id: "invoice",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { amount } }) => (
      <TextCell text={formatCurrency(Number(amount.value), amount.currency)} />
    ),
  },
  {
    width: 120,
    id: "status",
    title: t("accountDetails.billing.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { status } }) => (
      <Cell>
        {match(status)
          .with("Failed", value => <Tag color="negative">{value}</Tag>) //pas montré
          .with("NotPaid", value => <Tag color="negative">{value}</Tag>)
          .with("Paid", value => <Tag color="positive">{value}</Tag>)
          .with("PaymentDue", value => <Tag color="warning">{value}</Tag>)
          .with("Pending", value => <Tag color="warning">{value}</Tag>) //pas montré
          .with("Voided", value => <Tag color="gray">{value}</Tag>)
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { url, status } }) => {
      return (
        <Cell align="right">
          {isNotNullish(url) &&
          (status === "Paid" || status === "NotPaid" || status === "PaymentDue") ? (
            <Link target="blank" to={url} download={true}>
              <Icon color={colors.gray[500]} size={18} name="arrow-download-filled" />
            </Link>
          ) : (
            <LakeTooltip
              content={t("accountDetails.billing.noDocumentTooltip")}
              placement="right"
              togglableOnFocus={true}
              hideArrow={true}
            >
              <Icon color={colors.gray[300]} size={18} name="arrow-download-filled" tabIndex={0} />
            </LakeTooltip>
          )}
        </Cell>
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
