import { AsyncData, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  EndAlignedCell,
  SimpleHeaderCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useMemo } from "react";
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
  root: {
    ...commonStyles.fill,
  },
  filters: {
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
  endFilters: {
    flexGrow: 0,
    flexShrink: 1,
  },
  mobileCell: {
    paddingHorizontal: spacings[16],
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  params: { status: "Active" | "Inactive" };
};

const PER_PAGE = 20;

type ExtraInfo = undefined;

const columns: ColumnConfig<MerchantProfileFragment, ExtraInfo>[] = [
  {
    id: "name",
    width: "grow",
    title: t("merchantProfile.list.name"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <StartAlignedCell>
        <LakeText variant="medium" color={colors.gray[900]}>
          {item.merchantName}
        </LakeText>
      </StartAlignedCell>
    ),
  },
  {
    id: "paymentMethods",
    width: 200,
    title: t("merchantProfile.list.paymentMethods"),
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: ({ item }) => {
      const paymentMethods = item.merchantPaymentMethods ?? [];
      const activePaymentMethods = paymentMethods.filter(
        item => item.statusInfo.status === "Enabled",
      );

      return (
        <EndAlignedCell>
          <LakeText variant="regular">{activePaymentMethods.length}</LakeText>
        </EndAlignedCell>
      );
    },
  },
  {
    id: "status",
    width: 200,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => (
      <EndAlignedCell>
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
      </EndAlignedCell>
    ),
  },
  {
    id: "actions",
    width: 42,
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Box direction="row" justifyContent="end" alignItems="center">
            <Icon
              name="chevron-right-filled"
              color={isHovered ? colors.gray[900] : colors.gray[500]}
              size={16}
            />
          </Box>
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

const smallColumns: ColumnConfig<MerchantProfileFragment, ExtraInfo>[] = [
  {
    id: "name",
    width: "grow",
    title: t("merchantProfile.list.name"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <LakeText variant="medium" color={colors.gray[900]} style={styles.mobileCell}>
        {item.merchantName}
      </LakeText>
    ),
  },
  {
    id: "status",
    width: 200,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => (
      <EndAlignedCell>
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
      </EndAlignedCell>
    ),
  },
  {
    id: "actions",
    width: 42,
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Box direction="row" justifyContent="end" alignItems="center">
            <Icon
              name="chevron-right-filled"
              color={isHovered ? colors.gray[900] : colors.gray[500]}
              size={16}
            />
          </Box>
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

export const MerchantList = ({ accountId, accountMembershipId, params }: Props) => {
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

  const { desktop } = useResponsive();

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
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
              onPress={() => {
                reload();
              }}
            />

            <Fill minWidth={16} />

            <Box direction="row" alignItems="center" justifyContent="end" style={styles.endFilters}>
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
            .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
              <ErrorView error={error} />
            ))
            .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => (
              <Connection connection={data.account?.merchantProfiles}>
                {merchantProfiles => (
                  <PlainListView
                    withoutScroll={!desktop}
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
                      <FixedListViewEmpty
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
      )}
    </ResponsiveContainer>
  );
};
