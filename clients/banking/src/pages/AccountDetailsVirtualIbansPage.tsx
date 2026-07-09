import { AsyncData, Option } from "@swan-io/boxed";
import { useDeferredQuery, useMutation, useQuery } from "@swan-io/graphql-client";
import { Cell, CopyableTextCell, HeaderCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
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
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { pollUntilOk } from "@swan-io/lake/src/utils/polling";
import { GetEdge } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { printIbanFormat } from "@swan-io/shared-business/src/utils/validation";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import { VirtualIbanListFilter } from "../components/VirtualIbanListFilter";
import {
  AccountDetailsVirtualIbansPageDocument,
  AccountDetailsVirtualIbansPageQuery,
  AddVirtualIbanDocument,
  CancelVirtualIbanDocument,
  VirtualIbanBankDetailsDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[20],
  },
  headerDesktop: {
    paddingHorizontal: spacings[40],
  },
  bankDetailsLoader: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  large: boolean;
  status: "Enabled" | "Canceled" | undefined;
};

const ENABLED_STATUSES = ["Enabled" as const];
const CANCELED_STATUSES = ["Canceled" as const, "Suspended" as const];

type Account = NonNullable<AccountDetailsVirtualIbansPageQuery["account"]>;
type Edge = GetEdge<Account["virtualIbanEntries"]>;
type ExtraInfo = {
  reload: () => void;
  canCancelVirtualIBAN: boolean;
  accountId: string;
};

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

const actionsColumn: ColumnConfig<Edge, ExtraInfo> = {
  width: 80,
  id: "actions",
  title: "",
  renderTitle: () => null,
  renderCell: ({ item: { node }, extraInfo: { reload, canCancelVirtualIBAN, accountId } }) => (
    <Actions
      accountId={accountId}
      virtualIbanId={node.id}
      onCancel={reload}
      bankDetails={Option.fromNullable(node.bankDetails).filter(b => b.length > 0)}
      canCancel={node.status === "Enabled" && canCancelVirtualIBAN}
      isEnabled={node.status === "Enabled"}
    />
  ),
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
  actionsColumn,
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
  actionsColumn,
];

// Polls for the bank details url, which the backend generates asynchronously after creation.
const BankDetailsButton = ({
  accountId,
  virtualIbanId,
  bankDetails,
  isEnabled,
}: {
  accountId: string;
  virtualIbanId: string;
  bankDetails: Option<string>;
  isEnabled: boolean;
}) => {
  const [, { query: queryBankDetails }] = useDeferredQuery(VirtualIbanBankDetailsDocument);
  const shouldGenerate = isEnabled && bankDetails.isNone();
  // NotAsked = not polling, Loading = polling, Done = settled. On Done without a url,
  // generation gave up.
  const [generationState, setGenerationState] = useState<AsyncData<undefined>>(
    shouldGenerate ? AsyncData.Loading() : AsyncData.NotAsked(),
  );

  useEffect(() => {
    if (!shouldGenerate) {
      setGenerationState(AsyncData.NotAsked());
      return;
    }

    setGenerationState(AsyncData.Loading());

    const future = pollUntilOk(
      () =>
        queryBankDetails({ accountId, id: virtualIbanId }).mapOkToResult(data =>
          Option.fromNullable(data.account?.virtualIbanEntries.edges[0]?.node?.bankDetails)
            .filter(value => value.length > 0)
            .toResult(undefined),
        ),
      { maxAttempts: 20 },
    ).tap(() => setGenerationState(AsyncData.Done(undefined)));

    return () => future.cancel();
    // Keep virtualIbanId in deps: PlainListView keys rows by index, so on reorder this instance is
    // reused for another IBAN — re-running rebinds the poll.
  }, [shouldGenerate, accountId, virtualIbanId, queryBankDetails]);

  return bankDetails.match({
    Some: bankDetails => (
      <LakeTooltip content={t("accountDetails.virtualIbans.downloadBankDetails")}>
        <LakeButton
          mode="tertiary"
          size="small"
          icon="arrow-download-filled"
          ariaLabel={t("accountDetails.virtualIbans.downloadBankDetails")}
          href={bankDetails}
          hrefAttrs={{ download: true, target: "blank" }}
        />
      </LakeTooltip>
    ),
    None: () =>
      generationState.match({
        NotAsked: () => <Space width={40} />,
        Loading: () => (
          <LakeTooltip content={t("accountDetails.virtualIbans.generatingBankDetails")}>
            <View style={styles.bankDetailsLoader}>
              <ActivityIndicator color={colors.gray[400]} size="small" />
            </View>
          </LakeTooltip>
        ),
        Done: () => (
          <LakeTooltip content={t("accountDetails.virtualIbans.bankDetailsUnavailable")}>
            <View style={styles.bankDetailsLoader}>
              <Icon name="warning-regular" size={16} color={colors.gray[400]} />
            </View>
          </LakeTooltip>
        ),
      }),
  });
};

const Actions = ({
  accountId,
  onCancel,
  virtualIbanId,
  bankDetails,
  canCancel,
  isEnabled,
}: {
  accountId: string;
  onCancel: () => void;
  virtualIbanId: string;
  bankDetails: Option<string>;
  canCancel: boolean;
  isEnabled: boolean;
}) => {
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
      <BankDetailsButton
        accountId={accountId}
        virtualIbanId={virtualIbanId}
        bankDetails={bankDetails}
        isEnabled={isEnabled}
      />

      {canCancel ? (
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
      ) : null}
    </>
  );
};

const keyExtractor = ({ node: { id } }: Edge) => id;

export const AccountDetailsVirtualIbansPage = ({
  accountId,
  accountMembershipId,
  large,
  status: statusParam,
}: Props) => {
  const status = statusParam ?? "Enabled";
  const { canCreateVirtualIBAN, canCancelVirtualIBAN } = usePermissions();
  const [addVirtualIban, virtualIbanAddition] = useMutation(AddVirtualIbanDocument);

  const [data, { isLoading, reload, setVariables }] = useQuery(
    AccountDetailsVirtualIbansPageDocument,
    {
      first: 20,
      accountId,
      filters: {
        status: status === "Enabled" ? ENABLED_STATUSES : CANCELED_STATUSES,
      },
    },
  );

  const hasItems = data.match({
    NotAsked: () => false,
    Loading: () => false,
    Done: result =>
      result.match({
        Error: () => false,
        Ok: data => (data.account?.totalVirtualIbans.totalCount ?? 0) > 0,
      }),
  });

  const showFilter = hasItems || statusParam !== undefined;

  const onPressNew = () => {
    addVirtualIban({ accountId })
      .mapOkToResult(data => Option.fromNullable(data.addVirtualIbanEntry).toResult(undefined))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        if (status !== "Enabled") {
          Router.replace("AccountDetailsVirtualIbans", {
            accountMembershipId,
            status: "Enabled",
          });
        } else {
          reload();
        }
      })
      .tapError((error: unknown) => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <>
      {showFilter && (
        <View style={[styles.header, large && styles.headerDesktop]}>
          <VirtualIbanListFilter
            large={large}
            status={status}
            onChangeStatus={newStatus =>
              Router.replace("AccountDetailsVirtualIbans", {
                accountMembershipId,
                status: newStatus,
              })
            }
          >
            {canCreateVirtualIBAN ? (
              <LakeButton
                loading={virtualIbanAddition.isLoading()}
                icon="add-circle-filled"
                size="small"
                color="current"
                onPress={onPressNew}
              >
                {t("common.new")}
              </LakeButton>
            ) : null}
          </VirtualIbanListFilter>
        </View>
      )}

      {data.match({
        NotAsked: () => null,
        Loading: () => <PlainListViewPlaceholder headerHeight={48} rowHeight={56} count={20} />,
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <Connection connection={data.account?.virtualIbanEntries}>
                {virtualIbanEntries => {
                  const edges = virtualIbanEntries?.edges ?? [];

                  return (
                    <PlainListView
                      withoutScroll={!large}
                      data={edges}
                      extraInfo={{ reload, canCancelVirtualIBAN, accountId }}
                      columns={columns}
                      smallColumns={smallColumns}
                      keyExtractor={keyExtractor}
                      onEndReached={() => {
                        if (virtualIbanEntries?.pageInfo.hasNextPage === true) {
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
                          title={
                            hasItems
                              ? t("common.list.noResults")
                              : t("accountDetails.virtualIbans.emptyTitle")
                          }
                          subtitle={
                            hasItems
                              ? t("common.list.noResultsSuggestion")
                              : t("accountDetails.virtualIbans.emptyDescription")
                          }
                        >
                          {!hasItems && canCreateVirtualIBAN ? (
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
                  );
                }}
              </Connection>
            ),
          }),
      })}
    </>
  );
};
