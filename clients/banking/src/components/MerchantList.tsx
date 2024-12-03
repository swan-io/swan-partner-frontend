import { AsyncData, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  MerchantProfileFiltersInput,
  MerchantProfileFragment,
  MerchantProfilesDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  params: { status: "Active" | "Inactive" };
  large: boolean;
};

const PER_PAGE = 20;

type ExtraInfo = undefined;

const columns: ColumnConfig<MerchantProfileFragment, ExtraInfo>[] = [
  {
    id: "name",
    width: "grow",
    title: t("merchantProfile.list.name"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <TextCell variant="medium" color={colors.gray[900]} text={item.merchantName} />
    ),
  },
  {
    id: "paymentMethods",
    width: 200,
    title: t("merchantProfile.list.paymentMethods"),
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
    renderCell: ({ item }) => {
      const paymentMethods = item.merchantPaymentMethods ?? [];
      const activePaymentMethods = paymentMethods.filter(
        item => item.statusInfo.status === "Enabled",
      );

      return (
        <TextCell
          align="right"
          text={String(activePaymentMethods.length)}
          color={colors.gray[500]}
        />
      );
    },
  },
  {
    id: "status",
    width: 200,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Disabled", () => <Tag color="gray">{t("merchantProfile.status.disabled")}</Tag>)
          .with("Enabled", () => <Tag color="positive">{t("merchantProfile.status.enabled")}</Tag>)
          .with("PendingReview", () => (
            <Tag color="shakespear">{t("merchantProfile.status.pendingReview")}</Tag>
          ))
          .with("Rejected", () => (
            <Tag color="negative">{t("merchantProfile.status.rejected")}</Tag>
          ))
          .with("Suspended", () => (
            <Tag color="warning">{t("merchantProfile.status.suspended")}</Tag>
          ))
          .otherwise(() => null)}
      </Cell>
    ),
  },
];

const smallColumns: ColumnConfig<MerchantProfileFragment, ExtraInfo>[] = [
  {
    id: "name",
    width: "grow",
    title: t("merchantProfile.list.name"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TextCell variant="medium" text={item.merchantName} />,
  },
  {
    id: "status",
    width: 200,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Disabled", () => <Tag color="gray">{t("merchantProfile.status.disabled")}</Tag>)
          .with("Enabled", () => <Tag color="positive">{t("merchantProfile.status.enabled")}</Tag>)
          .with("PendingReview", () => (
            <Tag color="shakespear">{t("merchantProfile.status.pendingReview")}</Tag>
          ))
          .with("Rejected", () => (
            <Tag color="negative">{t("merchantProfile.status.rejected")}</Tag>
          ))
          .with("Suspended", () => (
            <Tag color="warning">{t("merchantProfile.status.suspended")}</Tag>
          ))
          .otherwise(() => null)}
      </Cell>
    ),
  },
];

export const MerchantList = ({ accountId, accountMembershipId, params, large }: Props) => {
  const filters: MerchantProfileFiltersInput = useMemo(() => {
    return {
      status: match(params.status)
        .with("Active", () => ["Enabled" as const, "PendingReview" as const])
        .with("Inactive", () => ["Disabled" as const, "Rejected" as const, "Suspended" as const])
        .exhaustive(),
    } as const;
  }, [params.status]);

  const [data, { isLoading, setVariables, reload }] = useQuery(MerchantProfilesDocument, {
    first: PER_PAGE,
    filters,
    accountId,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box
        direction="row"
        alignItems="center"
        style={[styles.filters, large && styles.filtersLarge]}
      >
        <LakeButton
          ariaLabel={t("common.refresh")}
          mode="secondary"
          size="small"
          icon="arrow-counterclockwise-filled"
          loading={isRefreshing}
          onPress={() => {
            setIsRefreshing(true);
            reload().tap(() => setIsRefreshing(false));
          }}
        />

        <Fill minWidth={16} />

        <Box direction="row" alignItems="center" justifyContent="end" grow={0} shrink={1}>
          <Toggle
            mode={large ? "desktop" : "mobile"}
            value={params.status === "Active"}
            onToggle={status =>
              Router.push("AccountMerchantsList", {
                accountMembershipId,
                status: status ? "Active" : "Inactive",
              })
            }
            onLabel={t("merchantProfile.list.Active")}
            offLabel={t("merchantProfile.list.Inactive")}
          />
        </Box>
      </Box>

      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => (
          <Connection connection={data.account?.merchantProfiles}>
            {merchantProfiles => (
              <PlainListView
                withoutScroll={!large}
                data={merchantProfiles?.edges.map(({ node }) => node) ?? []}
                keyExtractor={item => item.id}
                headerHeight={48}
                rowHeight={56}
                groupHeaderHeight={48}
                extraInfo={undefined}
                columns={columns}
                smallColumns={smallColumns}
                onEndReached={() => {
                  if (merchantProfiles?.pageInfo.hasNextPage === true) {
                    setVariables({ after: merchantProfiles.pageInfo.endCursor });
                  }
                }}
                getRowLink={({ item }) => (
                  <Link
                    data-testid="user-card-item"
                    to={Router.AccountMerchantsProfileSettings({
                      accountMembershipId,
                      merchantProfileId: item.id,
                    })}
                  />
                )}
                loading={{ isLoading, count: PER_PAGE }}
                renderEmptyList={() => (
                  <EmptyView
                    icon="lake-merchant"
                    borderedIcon={true}
                    title={t("merchantProfile.list.noResults")}
                  />
                )}
              />
            )}
          </Connection>
        ))
        .exhaustive()}
    </>
  );
};
