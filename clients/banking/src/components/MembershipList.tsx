import { Option } from "@swan-io/boxed";
import { HeaderCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { ReactElement, useState } from "react";
import { AccountMembershipFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import { MembershipCancelConfirmationModal } from "./MembershipCancelConfirmationModal";
import {
  EmailCell,
  FullNameAndStatusCell,
  MembershipActionsCell,
  MembershipSummaryCell,
  PhoneNumberCell,
  RightsCell,
} from "./MembershipListCells";

type ExtraInfo = {
  onPressCancel: ({ accountMembershipId }: { accountMembershipId: string }) => void;
  currentUserAccountMembershipId: string;
};

const columns: ColumnConfig<AccountMembershipFragment, ExtraInfo>[] = [
  {
    id: "name",
    width: "grow",
    title: t("membershipList.fullName"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <FullNameAndStatusCell accountMembership={item} />,
  },
  {
    id: "rights",
    width: 210,
    title: t("membershipList.rights"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <RightsCell accountMembership={item} />,
  },
  {
    id: "email",
    width: 230,
    title: t("membershipList.email"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <EmailCell accountMembership={item} />,
  },
  {
    id: "phone",
    width: 180,
    title: t("membershipList.phoneNumber"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <PhoneNumberCell accountMembership={item} />,
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({
      item,
      extraInfo: { currentUserAccountMembershipId, onPressCancel },
      isHovered,
    }) => (
      <MembershipActionsCell
        accountMembership={item}
        onPressCancel={onPressCancel}
        currentUserAccountMembershipId={currentUserAccountMembershipId}
        isHovered={isHovered}
      />
    ),
  },
];

const smallColumns: ColumnConfig<AccountMembershipFragment, ExtraInfo>[] = [
  {
    id: "all",
    width: "grow",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => <MembershipSummaryCell accountMembership={item} />,
  },
];

type Props = {
  accountMembershipId: string;
  memberships: AccountMembershipFragment[];
  editingAccountMembershipId?: string;
  onActiveRowChange: (element: HTMLElement) => void;
  onEndReached: () => void;
  loading: {
    count: number;
    isLoading: boolean;
  };
  getRowLink: (item: LinkConfig<AccountMembershipFragment, ExtraInfo>) => ReactElement;
  onRefreshRequest: () => void;
  large: boolean;
};

export const MembershipList = ({
  memberships,
  accountMembershipId,
  onEndReached,
  editingAccountMembershipId,
  onActiveRowChange,
  loading,
  getRowLink,
  onRefreshRequest,
  large,
}: Props) => {
  const [cancelConfirmationModalModal, setCancelConfirmationModalModal] = useState<Option<string>>(
    Option.None(),
  );

  const onCancelSuccess = () => {
    setCancelConfirmationModalModal(Option.None());
    onRefreshRequest();
  };

  return (
    <>
      <PlainListView
        withoutScroll={!large}
        data={memberships}
        keyExtractor={item => item.id}
        headerHeight={48}
        rowHeight={56}
        groupHeaderHeight={48}
        extraInfo={{
          onPressCancel: ({ accountMembershipId }) =>
            setCancelConfirmationModalModal(Option.Some(accountMembershipId)),
          currentUserAccountMembershipId: accountMembershipId,
        }}
        columns={columns}
        activeRowId={editingAccountMembershipId}
        onActiveRowChange={onActiveRowChange}
        smallColumns={smallColumns}
        onEndReached={onEndReached}
        getRowLink={getRowLink}
        loading={loading}
        renderEmptyList={() => (
          <EmptyView icon="lake-people" borderedIcon={true} title={t("common.noResults")} />
        )}
      />

      <MembershipCancelConfirmationModal
        visible={cancelConfirmationModalModal.isSome()}
        onPressClose={() => setCancelConfirmationModalModal(Option.None())}
        accountMembershipId={cancelConfirmationModalModal.toUndefined()}
        onSuccess={onCancelSuccess}
      />
    </>
  );
};
