import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import {
  CellAction,
  CopyableRegularTextCell,
  EndAlignedCell,
  SimpleRegularTextCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountMembershipFragment } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";

type AccountMembership = AccountMembershipFragment;

const styles = StyleSheet.create({
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
  },
  name: {
    ...commonStyles.fill,
    flexDirection: "row",
    alignItems: "center",
  },
  rightsIcon: {
    marginHorizontal: spacings[4],
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.gray[200],
    height: 28,
    marginHorizontal: spacings[4],
  },
  notificationPill: {
    width: 5,
    height: 5,
    backgroundColor: colors.negative[500],
    borderRadius: 5,
  },
  permissionsContainer: {
    padding: 4,
  },
});

const getStatusIcon = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return match(accountMembership.statusInfo)
    .with({ __typename: "AccountMembershipEnabledStatusInfo" }, () => (
      <Tag color="positive" icon="checkmark-filled" />
    ))
    .with(
      { __typename: "AccountMembershipBindingUserErrorStatusInfo", idVerifiedMatchError: true },
      () => <Tag color="warning" icon="warning-regular" />,
    )
    .with({ __typename: "AccountMembershipBindingUserErrorStatusInfo" }, () => (
      <>
        <View style={styles.notificationPill} />
        <Space width={16} />
        <Tag color="negative" icon="warning-regular" />
      </>
    ))
    .with({ __typename: "AccountMembershipInvitationSentStatusInfo" }, () => (
      <Tag color="shakespear" icon="mail-regular" />
    ))
    .with({ __typename: "AccountMembershipSuspendedStatusInfo" }, () => (
      <Tag color="warning" icon="lock-closed-regular" />
    ))
    .with({ __typename: "AccountMembershipDisabledStatusInfo" }, () => (
      <Tag color="gray" icon="subtract-circle-regular" />
    ))
    .with({ __typename: "AccountMembershipConsentPendingStatusInfo" }, () => null)
    .exhaustive();
};

const PermissionLine = ({
  iconName,
  isAuthorized,
  authorizedMessage,
  notAuthorizedMessage,
}: {
  iconName: IconName;
  isAuthorized: boolean;
  authorizedMessage: string;
  notAuthorizedMessage: string;
}) => (
  <Box direction="row" alignItems="center">
    <Icon
      name={iconName}
      size={20}
      color={isAuthorized ? colors.gray.contrast : colors.gray[500]}
    />

    <Space width={8} />

    <LakeText variant="smallRegular" color={isAuthorized ? colors.gray.contrast : colors.gray[500]}>
      {isAuthorized ? authorizedMessage : notAuthorizedMessage}
    </LakeText>
  </Box>
);

const getRightsTag = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  const hasSomeRights = match(accountMembership)
    .with(
      { canViewAccount: true },
      { canInitiatePayments: true },
      { canManageBeneficiaries: true },
      { canManageAccountMembership: true },
      () => true,
    )
    .otherwise(() => false);

  const hasSomeCards = accountMembership.activeCards.totalCount > 0;

  return (
    <LakeTooltip
      placement="right"
      content={
        <View style={styles.permissionsContainer}>
          <PermissionLine
            iconName="eye-regular"
            isAuthorized={accountMembership.canViewAccount}
            authorizedMessage={t("members.permission.canViewAccount")}
            notAuthorizedMessage={t("members.permission.not.canViewAccount")}
          />

          <Space height={4} />

          <PermissionLine
            iconName="arrow-swap-regular"
            isAuthorized={accountMembership.canInitiatePayments}
            authorizedMessage={t("members.permission.canInitiatePayments")}
            notAuthorizedMessage={t("members.permission.not.canInitiatePayments")}
          />

          <Space height={4} />

          <PermissionLine
            iconName="person-add-regular"
            isAuthorized={accountMembership.canManageBeneficiaries}
            authorizedMessage={t("members.permission.canManageBeneficiaries")}
            notAuthorizedMessage={t("members.permission.not.canManageBeneficiaries")}
          />

          <Space height={4} />

          <PermissionLine
            iconName="settings-regular"
            isAuthorized={accountMembership.canManageAccountMembership}
            authorizedMessage={t("members.permission.canManageAccountMembership")}
            notAuthorizedMessage={t("members.permission.not.canManageAccountMembership")}
          />

          <Space height={4} />

          <PermissionLine
            iconName="payment-regular"
            isAuthorized={accountMembership.activeCards.totalCount > 0}
            authorizedMessage={t("members.permission.hasCard", {
              count: accountMembership.activeCards.totalCount,
            })}
            notAuthorizedMessage={t("members.permission.hasCard", {
              count: accountMembership.activeCards.totalCount,
            })}
          />
        </View>
      }
    >
      {match({ hasSomeRights, hasSomeCards })
        .with({ hasSomeRights: true }, { hasSomeCards: true }, () => (
          <Tag color="gray">
            <>
              {accountMembership.canViewAccount ? (
                <Icon
                  name="eye-regular"
                  size={16}
                  color={colors.swan[500]}
                  style={styles.rightsIcon}
                />
              ) : null}

              {accountMembership.canInitiatePayments ? (
                <Icon
                  name="arrow-swap-regular"
                  size={16}
                  color={colors.swan[500]}
                  style={styles.rightsIcon}
                />
              ) : null}

              {accountMembership.canManageBeneficiaries ? (
                <Icon
                  name="person-add-regular"
                  size={16}
                  color={colors.swan[500]}
                  style={styles.rightsIcon}
                />
              ) : null}

              {accountMembership.canManageAccountMembership ? (
                <Icon
                  name="settings-regular"
                  size={16}
                  color={colors.swan[500]}
                  style={styles.rightsIcon}
                />
              ) : null}

              {hasSomeRights && hasSomeCards ? <View style={styles.separator} /> : null}

              {hasSomeCards ? (
                <>
                  <Icon
                    name="payment-regular"
                    size={16}
                    color={colors.swan[500]}
                    style={styles.rightsIcon}
                  />

                  <LakeText color={colors.swan[500]} variant="smallRegular">
                    {accountMembership.activeCards.totalCount}
                  </LakeText>
                </>
              ) : null}
            </>
          </Tag>
        ))
        .otherwise(() => null)}
    </LakeTooltip>
  );
};

export const FullNameAndStatusCell = ({
  accountMembership,
}: {
  accountMembership: AccountMembership;
}) => {
  return (
    <View style={styles.cell}>
      <View style={styles.name}>
        <LakeHeading variant="h5" level={3}>
          {getMemberName({ accountMembership })}
        </LakeHeading>

        <Space width={16} />

        {match(accountMembership.statusInfo)
          .with({ __typename: "AccountMembershipEnabledStatusInfo" }, () => (
            <Tag color="positive">{t("memberships.status.active")}</Tag>
          ))
          .with(
            {
              __typename: "AccountMembershipBindingUserErrorStatusInfo",
              idVerifiedMatchError: true,
            },
            () => (
              <>
                <Tag color="warning">{t("memberships.status.limitedAccess")}</Tag>
              </>
            ),
          )
          .with({ __typename: "AccountMembershipBindingUserErrorStatusInfo" }, () => (
            <>
              <Tag color="negative">{t("memberships.status.conflict")}</Tag>
              <Space width={16} />
              <View style={styles.notificationPill} />
            </>
          ))
          .with({ __typename: "AccountMembershipInvitationSentStatusInfo" }, () => (
            <Tag color="shakespear">{t("memberships.status.invitationSent")}</Tag>
          ))
          .with({ __typename: "AccountMembershipSuspendedStatusInfo" }, () => (
            <Tag color="warning">{t("memberships.status.temporarilyBlocked")}</Tag>
          ))
          .with({ __typename: "AccountMembershipDisabledStatusInfo" }, () => (
            <Tag color="gray">{t("memberships.status.permanentlyBlocked")}</Tag>
          ))
          .with({ __typename: "AccountMembershipConsentPendingStatusInfo" }, () => null)
          .exhaustive()}
      </View>
    </View>
  );
};

export const MembershipSummaryCell = ({
  accountMembership,
}: {
  accountMembership: AccountMembership;
}) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.name}>
        <View>
          <LakeHeading variant="h5" level={3}>
            {getMemberName({ accountMembership })}
          </LakeHeading>

          <Space height={8} />

          {getRightsTag({ accountMembership })}
        </View>

        <Fill minWidth={16} />

        {getStatusIcon({ accountMembership })}

        <Space width={8} />
        <Icon name="chevron-right-filled" color={colors.gray[200]} size={16} />
      </View>
    </View>
  );
};

export const RightsCell = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return <View style={styles.cell}>{getRightsTag({ accountMembership })}</View>;
};

export const EmailCell = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return (
    <CopyableRegularTextCell
      variant="smallMedium"
      text={accountMembership.email}
      copyWording={t("copyButton.copyTooltip")}
      copiedWording={t("copyButton.copiedTooltip")}
    />
  );
};

export const PhoneNumberCell = ({
  accountMembership,
}: {
  accountMembership: AccountMembership;
}) => {
  const mobilePhoneNumber = match(accountMembership)
    .with(
      {
        statusInfo: {
          __typename: P.union(
            "AccountMembershipInvitationSentStatusInfo",
            "AccountMembershipBindingUserErrorStatusInfo",
          ),
        },
      },
      ({
        statusInfo: {
          restrictedTo: { phoneNumber },
        },
      }) => phoneNumber,
    )
    .otherwise(() => accountMembership.user?.mobilePhoneNumber);
  if (mobilePhoneNumber == null) {
    return <SimpleRegularTextCell text={"-"} variant="smallRegular" />;
  }
  return (
    <CopyableRegularTextCell
      variant="smallMedium"
      text={mobilePhoneNumber}
      copyWording={t("copyButton.copyTooltip")}
      copiedWording={t("copyButton.copiedTooltip")}
    />
  );
};

export const MembershipActionsCell = ({
  accountMembership,
  currentUserAccountMembershipId,
  isHovered: isRowHovered,
  onPressCancel,
}: {
  accountMembership: AccountMembershipFragment;
  currentUserAccountMembershipId: string;
  isHovered: boolean;
  onPressCancel: ({ accountMembershipId }: { accountMembershipId: string }) => void;
}) => {
  return (
    <EndAlignedCell>
      <CellAction>
        <Box direction="row" justifyContent="end" alignItems="center">
          {match({
            accountMembership,
            isCurrentUserMembership: currentUserAccountMembershipId === accountMembership.id,
          })
            .with(
              {
                accountMembership: {
                  statusInfo: { __typename: P.not("AccountMembershipDisabledStatusInfo") },
                  legalRepresentative: P.not(true),
                },
                isCurrentUserMembership: false,
              },
              ({ accountMembership: { id: accountMembershipId } }) => (
                <>
                  <Pressable
                    onPress={event => {
                      event.stopPropagation();
                      event.preventDefault();
                      onPressCancel({ accountMembershipId });
                    }}
                  >
                    {({ hovered }) => (
                      <Icon
                        name="subtract-circle-regular"
                        color={
                          hovered
                            ? colors.negative[500]
                            : isRowHovered
                            ? colors.gray[700]
                            : colors.gray[500]
                        }
                        size={16}
                      />
                    )}
                  </Pressable>

                  <Space width={8} />
                </>
              ),
            )
            .otherwise(() => null)}

          <Icon
            name="chevron-right-filled"
            color={isRowHovered ? colors.gray[900] : colors.gray[500]}
            size={16}
          />
        </Box>
      </CellAction>
    </EndAlignedCell>
  );
};
