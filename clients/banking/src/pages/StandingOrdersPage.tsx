import { BorderedButton } from "@swan-io/lake/src/components/BorderedButton";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Input } from "@swan-io/lake/src/components/Input";
import { Space } from "@swan-io/lake/src/components/Space";
import { Table, TableColumn } from "@swan-io/lake/src/components/Table";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import dayjs from "dayjs";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { EmptyList } from "../components/EmptyList";
import { Main } from "../components/Main";
import { StandingOrderPeriod, StandingOrdersPageDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { searchInProperties } from "../utils/search";
import { useQueryWithErrorBoundary } from "../utils/urql";

const styles = StyleSheet.create({
  header: {
    flexWrap: "wrap",
  },
  headerDesktop: {
    paddingTop: 56,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
  },
  noPadding: {
    paddingHorizontal: 0,
  },
  empty: {
    ...commonStyles.fill,
  },
});

type StandingOrder = {
  id: string;
  period: StandingOrderPeriod;
  reference?: string;
  label?: string;
  beneficiaryName: string;
  nextExecutionDate: string;
  targetAvailableBalance?: { value: string };
};

type StandingOrderListProps = {
  columns: TableColumn<StandingOrder>[];
  ListHeaderComponent: ReactElement;
  standingOrders: StandingOrder[];
  onStandingOrderClick: (id: string) => void;
};

const StandingOrderListDesktop = ({
  columns,
  ListHeaderComponent,
  standingOrders,
  onStandingOrderClick,
}: StandingOrderListProps) => {
  return (
    <>
      {ListHeaderComponent}

      <Table
        keyExtractor={({ id }) => id}
        columns={columns}
        data={standingOrders}
        onPressLine={({ id }) => onStandingOrderClick(id)}
      />
    </>
  );
};

const StandingOrderListMobile = ({
  columns,
  ListHeaderComponent,
  standingOrders,
  onStandingOrderClick,
}: StandingOrderListProps) => {
  return (
    <Table
      columns={columns}
      keyExtractor={({ id }) => id}
      data={standingOrders}
      hideColumns={true}
      ListHeaderComponent={ListHeaderComponent}
      onPressLine={({ id }) => onStandingOrderClick(id)}
    />
  );
};

type Props = {
  accountId: string;
  accountMembershipId: string;
};

export const StandingOrdersPage = ({ accountId, accountMembershipId }: Props) => {
  const [{ data }] = useQueryWithErrorBoundary({
    query: StandingOrdersPageDocument,
    variables: { accountId },
  });
  const [search, setSearch] = useState("");
  const { desktop, media } = useResponsive();

  const accountInfo = [data.account?.holder.info.name, data.account?.name, data.account?.number]
    .filter(Boolean)
    .join(" - ");

  const standingOrders = useMemo(() => {
    const list =
      data.account?.standingOrders.edges
        .map(e => e.node)
        .filter(node => node.statusInfo.status === "Enabled")
        .map(node => ({
          id: node.id,
          period: node.period,
          label: node.label ?? "",
          nextExecutionDate: node.nextExecutionDate ?? "",
          beneficiaryName: node.sepaBeneficiary.name,
        })) ?? [];

    return searchInProperties(list, ["period", "label", "beneficiaryName"], search);
  }, [data.account?.standingOrders.edges, search]);

  const openStandingOrderPage = useCallback(
    (standingOrderId: string) => {
      Router.push("AccountStandingOrdersEdit", { accountMembershipId, standingOrderId });
    },
    [accountMembershipId],
  );

  const openNewStandingOrderPage = useCallback(() => {
    Router.push("AccountPaymentsStandingOrderNew", { accountMembershipId });
  }, [accountMembershipId]);

  const columns: TableColumn<StandingOrder>[] = useMemo(
    () => [
      {
        key: "beneficiary",
        width: { type: "remainingPercent", value: 30 },
        label: t("recurringTransfer.table.beneficiary"),
        render: standingOrder => standingOrder.beneficiaryName,
      },
      {
        key: "label",
        width: { type: "remainingPercent", value: 30 },
        label: t("recurringTransfer.table.label"),
        render: standingOrder => standingOrder.label,
      },
      {
        key: "period",
        width: { type: "remainingPercent", value: 20 },
        label: t("recurringTransfer.table.period"),
        render: standingOrder => standingOrder.period,
      },
      {
        key: "nextExecutionDate",
        width: { type: "remainingPercent", value: 20 },
        label: t("recurringTransfer.table.nextExecution"),
        render: ({ nextExecutionDate }) =>
          nextExecutionDate !== "" ? dayjs(nextExecutionDate).format("L") : null,
      },
      {
        key: "edit",
        width: { type: "fixed", value: 40 },
        label: "",
        render: () => (
          <Box alignItems="center" justifyContent="center">
            <Icon name="chevron-right-filled" size={20} color={colors.gray[900]} />
          </Box>
        ),
      },
    ],
    [],
  );

  const Header = useMemo(() => {
    return (
      <>
        <Box style={[styles.header, desktop && styles.headerDesktop]}>
          <Heading level={1} size={32}>
            {t("standingOrders.title")}
          </Heading>

          <Space height={16} />
          <Text style={styles.subtitle}>{t("standingOrders.subtitle", { accountInfo })}</Text>
        </Box>

        <Space height={media({ mobile: 24, desktop: 40 })} />

        <Box direction={media({ mobile: "column", desktop: "row" })}>
          <Input
            size="small"
            icon="search-filled"
            placeholder={t("standingOrders.searchPlaceholder")}
            value={search}
            onValueChange={setSearch}
            hideErrorMessage={true}
          />

          <Fill minWidth={16} minHeight={20} />

          <BorderedButton size="small" icon="add-filled" onPress={openNewStandingOrderPage}>
            {t("standingOrders.add")}
          </BorderedButton>
        </Box>

        <Space height={32} />
      </>
    );
  }, [desktop, accountInfo, media, openNewStandingOrderPage, search]);

  return (
    <Main.View>
      {standingOrders.length ? (
        desktop ? (
          <StandingOrderListDesktop
            columns={columns}
            ListHeaderComponent={Header}
            standingOrders={standingOrders}
            onStandingOrderClick={openStandingOrderPage}
          />
        ) : (
          <StandingOrderListMobile
            columns={columns}
            ListHeaderComponent={Header}
            standingOrders={standingOrders}
            onStandingOrderClick={openStandingOrderPage}
          />
        )
      ) : (
        <>
          {Header}

          <EmptyList style={[styles.empty, styles.noPadding]} text={t("standingOrders.empty")} />
        </>
      )}
    </Main.View>
  );
};
