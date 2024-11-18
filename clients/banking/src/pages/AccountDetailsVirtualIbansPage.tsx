import { Option } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { Cell, CopyableTextCell, HeaderCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { GetEdge } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { printIbanFormat } from "@swan-io/shared-business/src/utils/validation";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import {
  AccountDetailsVirtualIbansPageDocument,
  AccountDetailsVirtualIbansPageQuery,
  AddVirtualIbanDocument,
  CancelVirtualIbanDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[20],
  },
  headerDesktop: {
    paddingHorizontal: spacings[40],
  },
});

type Props = {
  accountId: string;
  large: boolean;
};

type Account = NonNullable<AccountDetailsVirtualIbansPageQuery["account"]>;
type Edge = GetEdge<Account["virtualIbanEntries"]>;
type ExtraInfo = { reload: () => void; canCancelVirtualIBAN: boolean };

const IbanCell = ({ IBAN }: { IBAN: string }) => {
  const formattedIban = useMemo(() => printIbanFormat(IBAN), [IBAN]);

  return (
    <CopyableTextCell
      text={formattedIban}
      copyWording={t("copyButton.copyTooltip")}
      copiedWording={t("copyButton.copiedTooltip")}
    />
  );
};

const columns: ColumnConfig<Edge, ExtraInfo>[] = [
  {
    width: "grow",
    id: "id",
    title: t("accountDetails.virtualIbans.iban"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { node } }) => <IbanCell IBAN={node.IBAN} />,
  },
  {
    width: 200,
    id: "bic",
    title: t("accountDetails.virtualIbans.bic"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { node } }) => (
      <CopyableTextCell
        text={node.BIC}
        copyWording={t("copyButton.copyTooltip")}
        copiedWording={t("copyButton.copiedTooltip")}
      />
    ),
  },
  {
    width: 180,
    id: "status",
    title: t("accountDetails.virtualIbans.status"),
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
    renderCell: ({ item: { node } }) => (
      <Cell align="right">
        {match(node.status)
          .with("Enabled", () => (
            <Tag color="positive">{t("accountDetails.virtualIbans.status.enabled")}</Tag>
          ))
          .with("Canceled", () => (
            <Tag color="negative">{t("accountDetails.virtualIbans.status.canceled")}</Tag>
          ))
          .with("Suspended", () => (
            <Tag color="warning">{t("accountDetails.virtualIbans.status.suspended")}</Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { node }, extraInfo: { reload, canCancelVirtualIBAN } }) =>
      node.status === "Enabled" && canCancelVirtualIBAN ? (
        <Actions virtualIbanId={node.id} onCancel={reload} />
      ) : null,
  },
];

const smallColumns: ColumnConfig<Edge, ExtraInfo>[] = [
  {
    width: "grow",
    id: "id",
    title: t("accountDetails.virtualIbans.iban"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { node } }) => <IbanCell IBAN={node.IBAN} />,
  },
  {
    width: 180,
    id: "status",
    title: t("accountDetails.virtualIbans.status"),
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
    renderCell: ({ item: { node } }) => (
      <Cell align="right">
        {match(node.status)
          .with("Enabled", () => (
            <Tag
              color="positive"
              icon="checkmark-filled"
              ariaLabel={t("accountDetails.virtualIbans.status.enabled")}
            />
          ))
          .with("Canceled", () => (
            <Tag
              color="negative"
              icon="subtract-circle-regular"
              ariaLabel={t("accountDetails.virtualIbans.status.canceled")}
            />
          ))
          .with("Suspended", () => (
            <Tag
              color="warning"
              icon="lock-closed-regular"
              ariaLabel={t("accountDetails.virtualIbans.status.suspended")}
            />
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { node }, extraInfo: { reload } }) =>
      node.status === "Enabled" ? <Actions virtualIbanId={node.id} onCancel={reload} /> : null,
  },
];

const Actions = ({ onCancel, virtualIbanId }: { onCancel: () => void; virtualIbanId: string }) => {
  const [modalVisible, setModalVisible] = useBoolean(false);
  const [cancelVirtualIban, virtualIbanCancelation] = useMutation(CancelVirtualIbanDocument);

  const onPressCancel = () => {
    cancelVirtualIban({ virtualIbanId })
      .mapOkToResult(data => Option.fromNullable(data.cancelVirtualIbanEntry).toResult(undefined))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(onCancel)
      .tapError((error: unknown) =>
        showToast({ variant: "error", error, title: translateError(error) }),
      )
      .tap(setModalVisible.off);
  };

  return (
    <>
      <LakeButton
        icon="subtract-circle-regular"
        size="small"
        mode="tertiary"
        ariaLabel={t("accountDetails.virtualIbans.cancelVirtualIban")}
        onPress={setModalVisible.on}
      />

      <LakeModal
        title={t("accountDetails.virtualIbans.cancel.title")}
        icon="subtract-circle-regular"
        visible={modalVisible}
        onPressClose={setModalVisible.off}
        color="negative"
      >
        <LakeText>{t("accountDetails.virtualIbans.cancel.text")}</LakeText>
        <Space height={16} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            loading={virtualIbanCancelation.isLoading()}
            grow={true}
            color="negative"
            onPress={onPressCancel}
          >
            {t("accountDetails.virtualIbans.cancelVirtualIban")}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};

const keyExtractor = ({ node: { id } }: Edge) => id;

export const AccountDetailsVirtualIbansPage = ({ accountId, large }: Props) => {
  const { canCreateVirtualIBAN, canCancelVirtualIBAN } = usePermissions();
  const [addVirtualIban, virtualIbanAddition] = useMutation(AddVirtualIbanDocument);

  const [data, { isLoading, reload, setVariables }] = useQuery(
    AccountDetailsVirtualIbansPageDocument,
    { first: 20, accountId },
  );

  const onPressNew = () => {
    addVirtualIban({ accountId })
      .mapOkToResult(data => Option.fromNullable(data.addVirtualIbanEntry).toResult(undefined))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(reload)
      .tapError((error: unknown) => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return data.match({
    NotAsked: () => null,
    Loading: () => <PlainListViewPlaceholder headerHeight={48} rowHeight={56} count={20} />,
    Done: result =>
      result.match({
        Error: error => <ErrorView error={error} />,
        Ok: data => (
          <Connection connection={data.account?.virtualIbanEntries}>
            {virtualIbanEntries => {
              const edges = virtualIbanEntries?.edges ?? [];
              const totalCount = virtualIbanEntries?.totalCount ?? 0;

              return (
                <>
                  {canCreateVirtualIBAN && totalCount > 0 && (
                    <View style={[styles.header, large && styles.headerDesktop]}>
                      <LakeButton
                        loading={virtualIbanAddition.isLoading()}
                        icon="add-circle-filled"
                        size="small"
                        color="current"
                        onPress={onPressNew}
                      >
                        {t("common.new")}
                      </LakeButton>
                    </View>
                  )}

                  <PlainListView
                    withoutScroll={!large}
                    data={edges}
                    extraInfo={{ reload, canCancelVirtualIBAN }}
                    columns={columns}
                    smallColumns={smallColumns}
                    keyExtractor={keyExtractor}
                    onEndReached={() => {
                      if (Boolean(virtualIbanEntries?.pageInfo.hasNextPage)) {
                        setVariables({
                          after: virtualIbanEntries?.pageInfo.endCursor ?? undefined,
                        });
                      }
                    }}
                    headerHeight={48}
                    groupHeaderHeight={48}
                    rowHeight={56}
                    loading={{ isLoading, count: 20 }}
                    renderEmptyList={() => (
                      <EmptyView
                        icon="add-circle-regular"
                        title={t("accountDetails.virtualIbans.emptyTitle")}
                        subtitle={t("accountDetails.virtualIbans.emptyDescription")}
                      >
                        {canCreateVirtualIBAN ? (
                          <LakeButtonGroup justifyContent="center">
                            <LakeButton
                              loading={virtualIbanAddition.isLoading()}
                              icon="add-circle-filled"
                              size="small"
                              color="current"
                              onPress={onPressNew}
                            >
                              {t("common.new")}
                            </LakeButton>
                          </LakeButtonGroup>
                        ) : null}
                      </EmptyView>
                    )}
                  />
                </>
              );
            }}
          </Connection>
        ),
      }),
  });
};
