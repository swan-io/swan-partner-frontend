import { Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FixedListViewEmpty, LinkConfig } from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  CopyableRegularTextCell,
  EndAlignedCell,
  SimpleHeaderCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { ReactElement, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { PaymentLinkFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
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
  cell: {
    display: "flex",
    paddingHorizontal: spacings[16],
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    width: 1,
  },
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  transactionSummary: {
    flexShrink: 1,
    flexGrow: 1,
  },
  overflowingText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
  paymentLinks: PaymentLinkFragment[];
  params: { status: "Active" | "Archived"; search: string };
  getRowLink: (item: LinkConfig<PaymentLinkFragment, ExtraInfo>) => ReactElement;
  activeRowId: string | undefined;
  onActiveRowChange: (element: HTMLElement) => void;
  onEndReached: () => void;
  onPressReload: () => Future<unknown>;
  isLoading: boolean;
  large: boolean;
};

type ExtraInfo = undefined;

const PaymentLinkCell = ({ paymentLink }: { paymentLink: PaymentLinkFragment }) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.transactionSummary}>
        <LakeText variant="smallRegular" style={styles.overflowingText}>
          {paymentLink.label}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
        </LakeText>
      </View>
    </View>
  );
};
const columns: ColumnConfig<PaymentLinkFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: 300,
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <StartAlignedCell>
        <LakeText variant="medium" color={colors.gray[900]}>
          {item.label}
        </LakeText>
      </StartAlignedCell>
    ),
  },
  {
    id: "link",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.link"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <CopyableRegularTextCell
        text={item.url}
        textToCopy={item.url}
        copyWording={t("copyButton.copyTooltip")}
        copiedWording={t("copyButton.copiedTooltip")}
      />
    ),
  },
  // {
  //   id: "creationDate",
  //   width: 200,
  //   title: t("merchantProfile.paymentLink.list.creationDate"),
  //   renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
  //   renderCell: ({ item }) => <SimpleRegularTextCell text={item.requestedExecutionAt} />,
  // },
  {
    id: "status",
    width: 150,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
        {match(item.statusInfo.status)
          .with("Active", () => (
            <Tag color="positive"> {t("merchantProfile.paymentLink.status.active")} </Tag>
          ))
          .with("Completed", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.completed")} </Tag>
          ))
          .with("Expired", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.expired")} </Tag>
          ))
          .exhaustive()}
      </EndAlignedCell>
    ),
  },
  {
    id: "amount",
    width: 200,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(item.amount.value), item.amount.currency)}
        </LakeText>
      </EndAlignedCell>
    ),
  },
  {
    width: 48,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[900] : colors.gray[500]}
            size={16}
          />
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

const smallColumns: ColumnConfig<PaymentLinkFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: () => null,
    renderCell: ({ item }) => <PaymentLinkCell paymentLink={item} />,
  },
  {
    id: "status",
    width: 150,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
        {match(item.statusInfo.status)
          .with("Active", () => (
            <Tag color="positive"> {t("merchantProfile.paymentLink.status.active")} </Tag>
          ))
          .with("Completed", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.completed")} </Tag>
          ))
          .with("Expired", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.expired")} </Tag>
          ))
          .exhaustive()}
      </EndAlignedCell>
    ),
  },
  {
    width: 48,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[700] : colors.gray[200]}
            size={16}
          />
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

export const MerchantProfilePaymentLinksList = ({
  paymentLinks,
  onEndReached,
  onPressReload,
  merchantProfileId,
  accountMembershipId,
  large,
  params,
  getRowLink,
  activeRowId,
  onActiveRowChange,
  isLoading,
}: Props) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const search = nullishOrEmptyToUndefined(params.search);

  return (
    <>
      <Space height={24} />

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
            onPressReload().tap(() => setIsRefreshing(false));
          }}
        />

        <Fill minWidth={16} />

        <Box direction="row" alignItems="center" justifyContent="end" style={styles.endFilters}>
          <Toggle
            mode={large ? "desktop" : "mobile"}
            value={params.status === "Active"}
            onToggle={status =>
              Router.push("AccountMerchantsProfilePaymentLinkList", {
                accountMembershipId,
                merchantProfileId,
                status: status ? "Active" : "Archived",
              })
            }
            onLabel={t("merchantProfile.list.Active")}
            offLabel={t("merchantProfile.list.Inactive")}
          />

          <Fill minWidth={16} />

          <LakeSearchField
            initialValue={search ?? ""}
            placeholder={t("common.search")}
            onChangeText={search => {
              Router.replace("AccountMerchantsProfilePaymentLinkList", {
                accountMembershipId,
                merchantProfileId,
                ...params,
                search,
              });
            }}
          />
        </Box>
      </Box>

      <Space height={24} />

      <PlainListView
        withoutScroll={!large}
        data={paymentLinks}
        keyExtractor={item => item.id}
        headerHeight={48}
        rowHeight={56}
        groupHeaderHeight={48}
        extraInfo={undefined}
        columns={columns}
        smallColumns={smallColumns}
        getRowLink={getRowLink}
        onActiveRowChange={onActiveRowChange}
        activeRowId={activeRowId}
        onEndReached={onEndReached}
        loading={{
          isLoading,
          count: 5,
        }}
        renderEmptyList={() => (
          <FixedListViewEmpty
            icon="lake-transfer"
            borderedIcon={true}
            title={t("merchantProfile.paymentLinks.noResults")}
          />
        )}
      />
    </>
  );
};