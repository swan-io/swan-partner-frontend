import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, CopyableTextCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountMembershipFragment } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";

type AccountMembership = AccountMembershipFragment;

const styles = StyleSheet.create({
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  rightsIcon: {
    marginHorizontal: spacings[4],
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.gray[200],
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
      { canManageCards: true },
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
            iconName="lake-card-add"
            isAuthorized={accountMembership.canManageCards}
            authorizedMessage={t("members.permission.canManageCards")}
            notAuthorizedMessage={t("members.permission.not.canManageCards")}
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

              {accountMembership.canManageCards ? (
                <Icon
                  name="lake-card-add"
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
    <Cell>
      <LakeHeading variant="h5" level={3} numberOfLines={1}>
        {getMemberName({ accountMembership })}
      </LakeHeading>

      <Space width={16} />

      {match(accountMembership)
        .with({ statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" } }, () => (
          <Tag color="positive">{t("memberships.status.active")}</Tag>
        ))
        .with(
          {
            statusInfo: {
              __typename: "AccountMembershipBindingUserErrorStatusInfo",
              idVerifiedMatchError: true,
            },
          },
          {
            statusInfo: {
              __typename: "AccountMembershipBindingUserErrorStatusInfo",
              emailVerifiedMatchError: true,
            },
            user: { verifiedEmails: [] },
          },
          () => (
            <>
              <Tag color="warning">{t("memberships.status.limitedAccess")}</Tag>
            </>
          ),
        )
        .with({ statusInfo: { __typename: "AccountMembershipBindingUserErrorStatusInfo" } }, () => (
          <>
            <Tag color="negative">{t("memberships.status.conflict")}</Tag>
            <Space width={16} />
            <View style={styles.notificationPill} />
          </>
        ))
        .with({ statusInfo: { __typename: "AccountMembershipInvitationSentStatusInfo" } }, () => (
          <Tag color="shakespear">{t("memberships.status.invitationSent")}</Tag>
        ))
        .with({ statusInfo: { __typename: "AccountMembershipSuspendedStatusInfo" } }, () => (
          <Tag color="warning">{t("memberships.status.temporarilyBlocked")}</Tag>
        ))
        .with({ statusInfo: { __typename: "AccountMembershipDisabledStatusInfo" } }, () => (
          <Tag color="gray">{t("memberships.status.permanentlyBlocked")}</Tag>
        ))
        .with(
          { statusInfo: { __typename: "AccountMembershipConsentPendingStatusInfo" } },
          () => null,
        )
        .exhaustive()}
    </Cell>
  );
};

export const MembershipSummaryCell = ({
  accountMembership,
}: {
  accountMembership: AccountMembership;
}) => {
  return (
    <Cell style={styles.paddedCell}>
      <Box grow={1} shrink={1}>
        <LakeHeading variant="h5" level={3}>
          {getMemberName({ accountMembership })}
        </LakeHeading>

        <Space height={8} />

        {getRightsTag({ accountMembership })}
      </Box>

      <Fill minWidth={16} />

      {getStatusIcon({ accountMembership })}
    </Cell>
  );
};

export const RightsCell = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return <Cell>{getRightsTag({ accountMembership })}</Cell>;
};

export const EmailCell = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return (
    <CopyableTextCell
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
      }) => phoneNumber ?? "—",
    )
    .otherwise(() => accountMembership.user?.mobilePhoneNumber);

  if (mobilePhoneNumber == null) {
    return <TextCell text={"-"} variant="smallRegular" />;
  }

  return (
    <CopyableTextCell
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
    <Cell align="right">
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
          ),
        )
        .otherwise(() => (
          <Space width={24} />
        ))}
    </Cell>
  );
};
