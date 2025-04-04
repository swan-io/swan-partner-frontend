import { AsyncData, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, CopyableTextCell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
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
    width: 400,
    title: t("merchantProfile.list.name"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell direction="row">
        <Box style={{ width: "100px" }} alignItems="center">
          {isNotNullish(item.merchantLogoUrl) ? (
            <AutoWidthImage
              maxWidth={70}
              style={{ width: "100%" }}
              height={50}
              sourceUri={item.merchantLogoUrl}
            />
          ) : (
            <Icon size={16} name="image-regular" color="gray" />
          )}
        </Box>
        <TextCell variant="medium" color={colors.gray[900]} text={item.merchantName} />
      </Cell>
    ),
  },
  {
    id: "productType",
    width: 200,
    title: t("merchantProfile.list.productType"),
    renderTitle: ({ title }) => <HeaderCell align="left" text={title} />,
    renderCell: ({ item }) => (
      <TextCell
        align="left"
        text={match(item.productType)
          .with("GiftsAndDonations", () =>
            t("merchantProfile.request.productType.GiftsAndDonations"),
          )
          .with("Goods", () => t("merchantProfile.request.productType.Goods"))
          .with("Services", () => t("merchantProfile.request.productType.Services"))
          .with("VirtualGoods", () => t("merchantProfile.request.productType.VirtualGoods"))
          .exhaustive()}
      />
    ),
  },
  {
    id: "website",
    width: 300,
    title: t("merchantProfile.list.website"),
    renderTitle: ({ title }) => <HeaderCell align="left" text={title} />,
    renderCell: ({ item }) =>
      isNotNullish(item.merchantWebsite) ? (
        <CopyableTextCell
          textToCopy={item.merchantWebsite}
          text={item.merchantWebsite}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      ) : null,
  },
  {
    id: "status",
    width: 200,
    title: t("merchantProfile.list.status"),
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
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
    renderTitle: () => null,
    renderCell: ({ item }) => (
      <Cell direction="row">
        <Box style={{ width: "80px" }} alignItems="center">
          {isNotNullish(item.merchantLogoUrl) ? (
            <AutoWidthImage
              maxWidth={70}
              style={{ width: "100%" }}
              height={50}
              sourceUri={item.merchantLogoUrl}
            />
          ) : (
            <Icon size={16} name="image-regular" color="gray" />
          )}
        </Box>
        <TextCell variant="medium" color={colors.gray[900]} text={item.merchantName} />
      </Cell>
    ),
  },
  {
    id: "status",
    width: 200,
    title: t("merchantProfile.list.status"),
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
                rowHeight={104}
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
