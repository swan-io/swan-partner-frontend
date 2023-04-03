import { Link } from "@swan-io/chicane";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  EndAlignedCell,
  SimpleHeaderCell,
  SimpleRegularTextCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import {
  AccountDetailsBillingPageDocument,
  AccountDetailsBillingPageQuery,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

type Props = {
  accountId: string;
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
    renderCell: ({ item: { name } }) => <SimpleRegularTextCell text={name} />,
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
                placement="top"
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
    renderCell: ({ item: { name } }) => <SimpleRegularTextCell text={name} />,
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
                placement="top"
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

export const AccountDetailsBillingPage = ({ accountId }: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();
  const { data, nextData, setAfter } = useUrqlPaginatedQuery(
    {
      query: AccountDetailsBillingPageDocument,
      variables: {
        accountId,
        first: PER_PAGE,
      },
    },
    [accountId],
  );

  return data.match({
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
        Ok: ({ account }) => (
          <PlainListView
            withoutScroll={!desktop}
            data={account?.invoices?.edges?.map(({ node }) => node) ?? []}
            keyExtractor={item => item.id}
            headerHeight={48}
            rowHeight={48}
            groupHeaderHeight={48}
            extraInfo={undefined}
            columns={columns}
            smallColumns={smallColumns}
            loading={{
              isLoading: nextData.isLoading(),
              count: PER_PAGE,
            }}
            onEndReached={() => {
              if (account?.invoices?.pageInfo.hasNextPage === true) {
                setAfter(account?.invoices?.pageInfo.endCursor ?? undefined);
              }
            }}
            renderEmptyList={() => (
              <FixedListViewEmpty
                icon="lake-receipt"
                borderedIcon={true}
                title={t("accountDetails.billing.emptyTitle")}
                subtitle={t("accountDetails.billing.emptyDescription")}
              />
            )}
          />
        ),
        Error: error => <ErrorView error={error} />,
      }),
  });
};
