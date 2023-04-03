import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  CopyableRegularTextCell,
  EndAlignedCell,
  SimpleHeaderCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { GetEdge } from "@swan-io/lake/src/utils/types";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useMutation } from "urql";
import { ErrorView } from "../components/ErrorView";
import {
  AccountDetailsVirtualIbansPageDocument,
  AccountDetailsVirtualIbansPageQuery,
  AddVirtualIbanDocument,
  CancelVirtualIbanDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { printIbanFormat } from "../utils/iban";
import { parseOperationResult } from "../utils/urql";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
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
};

type Account = NonNullable<AccountDetailsVirtualIbansPageQuery["account"]>;
type Edge = GetEdge<Account["virtualIbanEntries"]>;
type ExtraInfo = { reload: () => void };

const IbanCell = ({ IBAN }: { IBAN: string }) => {
  const formattedIban = useMemo(() => printIbanFormat(IBAN), [IBAN]);

  return (
    <CopyableRegularTextCell
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
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { node } }) => <IbanCell IBAN={node.IBAN} />,
  },
  {
    width: 200,
    id: "bic",
    title: t("accountDetails.virtualIbans.bic"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { node } }) => (
      <CopyableRegularTextCell
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
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: ({ item: { node } }) => (
      <EndAlignedCell>
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
      </EndAlignedCell>
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

const smallColumns: ColumnConfig<Edge, ExtraInfo>[] = [
  {
    width: "grow",
    id: "id",
    title: t("accountDetails.virtualIbans.iban"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { node } }) => <IbanCell IBAN={node.IBAN} />,
  },
  {
    width: 180,
    id: "status",
    title: t("accountDetails.virtualIbans.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: ({ item: { node } }) => (
      <EndAlignedCell>
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
      </EndAlignedCell>
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
  const [{ fetching }, cancelVirtualIban] = useMutation(CancelVirtualIbanDocument);

  const onPressCancel = () => {
    cancelVirtualIban({ virtualIbanId })
      .then(parseOperationResult)
      .then(onCancel)
      .catch(() => showToast({ variant: "error", title: t("error.generic") }))
      .finally(setModalVisible.off);
  };

  return (
    <>
      <LakeButton
        icon="subtract-circle-regular"
        size="small"
        mode="tertiary"
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
          <LakeButton loading={fetching} grow={true} color="negative" onPress={onPressCancel}>
            {t("accountDetails.virtualIbans.cancelVirtualIban")}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};

const keyExtractor = ({ node: { id } }: Edge) => id;

export const AccountDetailsVirtualIbansPage = ({ accountId }: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();
  const [{ fetching: adding }, addVirtualIban] = useMutation(AddVirtualIbanDocument);

  const { data, nextData, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: AccountDetailsVirtualIbansPageDocument,
      variables: { first: 20, accountId },
    },
    [accountId],
  );

  const onPressNew = () => {
    addVirtualIban({ accountId })
      .then(parseOperationResult)
      .then(reload)
      .catch(() => showToast({ variant: "error", title: t("error.generic") }));
  };

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) =>
        data.match({
          NotAsked: () => null,
          Loading: () => (
            <PlainListViewPlaceholder
              headerHeight={48}
              rowHeight={56}
              rowVerticalSpacing={4}
              count={20}
            />
          ),
          Done: result =>
            result.match({
              Error: () => <ErrorView />,
              Ok: data => {
                const entries = data.account?.virtualIbanEntries;
                const edges = entries?.edges ?? [];
                const unlimited = data.account?.paymentLevel === "Unlimited";

                return (
                  <>
                    {edges.length > 0 && unlimited && (
                      <View style={[styles.header, large && styles.headerDesktop]}>
                        <LakeButton
                          loading={adding}
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
                      withoutScroll={!desktop}
                      data={edges}
                      extraInfo={{ reload }}
                      columns={columns}
                      smallColumns={smallColumns}
                      keyExtractor={keyExtractor}
                      onEndReached={() => {
                        if (Boolean(entries?.pageInfo.hasNextPage)) {
                          setAfter(entries?.pageInfo.endCursor ?? undefined);
                        }
                      }}
                      headerHeight={48}
                      groupHeaderHeight={48}
                      rowHeight={56}
                      loading={{ isLoading: nextData.isLoading(), count: 20 }}
                      renderEmptyList={() => (
                        <FixedListViewEmpty
                          icon="add-circle-regular"
                          title={t("accountDetails.virtualIbans.emptyTitle")}
                          subtitle={t("accountDetails.virtualIbans.emptyDescription")}
                        >
                          {unlimited && (
                            <LakeButtonGroup justifyContent="center">
                              <LakeButton
                                loading={adding}
                                icon="add-circle-filled"
                                size="small"
                                color="current"
                                onPress={onPressNew}
                              >
                                {t("common.new")}
                              </LakeButton>
                            </LakeButtonGroup>
                          )}
                        </FixedListViewEmpty>
                      )}
                    />
                  </>
                );
              },
            }),
        })
      }
    </ResponsiveContainer>
  );
};
