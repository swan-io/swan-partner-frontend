import { useQuery } from "@swan-io/graphql-client";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { SidebarNavigationTrackerActiveMarker } from "@swan-io/lake/src/components/SidebarNavigationTracker";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import {
  backgroundColor,
  colors,
  negativeSpacings,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import {
  AccountAreaQuery,
  Amount,
  GetAccountMembershipsDocument,
  GetAccountMembershipsQuery,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";

const styles = StyleSheet.create({
  container: {
    marginHorizontal: negativeSpacings[32],
    paddingHorizontal: spacings[32],
  },
  base: {
    borderRadius: radii[8],
    boxShadow: `0 0 0 1px ${colors.gray[100]}`,
    backgroundColor: backgroundColor.default,
    overflow: "hidden",
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[12],
    paddingHorizontal: spacings[20],
    transitionDuration: "150ms",
    transitionProperty: "background-color",
  },
  hoveredAccount: {
    backgroundColor: backgroundColor.accented,
  },
  accountIdentifier: {
    flexShrink: 1,
    flexGrow: 1,
    alignItems: "stretch",
  },
  balance: {
    paddingVertical: spacings[12],
    paddingHorizontal: spacings[20],
    borderTopWidth: 1,
    borderColor: colors.gray[100],
  },
  activationLink: {
    backgroundColor: backgroundColor.accented,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacings[20],
    paddingVertical: spacings[12],
    height: 48,
    transitionDuration: "150ms",
    transitionProperty: "background-color",
    borderTopWidth: 1,
    borderColor: colors.gray[100],
  },
  activationLinkHovered: {
    backgroundColor: backgroundColor.default,
  },
  list: {
    maxHeight: 220,
  },
  item: {
    transitionDuration: "150ms",
    transitionProperty: "background-color",
  },
  activeItem: {
    backgroundColor: colors.gray[50],
  },
  hoveredItem: {
    backgroundColor: colors.gray[50],
  },
  pressedItem: {
    backgroundColor: colors.gray[100],
  },
  bottomGradient: {
    pointerEvents: "none",
    height: 50,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(to bottom, ${backgroundColor.accentedTransparent}, ${backgroundColor.accented})`,
    opacity: 0,
    transition: "200ms ease-in-out opacity",
  },
  visibleBottomGradient: {
    opacity: 1,
  },
  loader: {
    paddingVertical: spacings[48],
  },
});

type ItemProps = {
  onPress?: (event: GestureResponderEvent) => void;
  isActive: boolean;
  membership: GetNode<
    NonNullable<NonNullable<GetAccountMembershipsQuery["user"]>["accountMemberships"]>
  >;
};

const Item = ({ onPress, isActive, membership }: ItemProps) => {
  if (membership == null) {
    return null;
  }
  return (
    <Pressable
      role="listitem"
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.account,
        styles.item,
        hovered && styles.hoveredItem,
        pressed && styles.pressedItem,
        isActive && styles.activeItem,
      ]}
    >
      <View style={styles.accountIdentifier}>
        <LakeHeading variant="h5" level={3} color={colors.gray[900]} numberOfLines={3}>
          {membership.canViewAccount && membership.account != null
            ? membership.account.name
            : membership.email}
        </LakeHeading>

        {membership.canViewAccount && membership.account != null ? (
          <LakeText variant="smallRegular" numberOfLines={1} color={colors.gray[500]}>
            {membership.account.holder.info.name}
          </LakeText>
        ) : null}
      </View>

      {isActive ? (
        <>
          <Space width={12} />
          <Icon color={colors.positive[500]} name="checkmark-filled" size={16} />
        </>
      ) : (
        <Space width={16} />
      )}
    </Pressable>
  );
};

type Props = {
  accountMembershipId: string;
  onPressItem: (accountMembershipId: string) => void;
};

export const AccountPicker = ({ accountMembershipId, onPressItem }: Props) => {
  const [accountMemberships, { setVariables }] = useQuery(GetAccountMembershipsDocument, {
    first: 10,
    filters: { status: ["BindingUserError", "ConsentPending", "Enabled", "InvitationSent"] },
  });

  const [showScrollAid, setShowScrollAid] = useState(false);

  const handleScroll = useCallback(() => {
    setShowScrollAid(false);
  }, []);

  useEffect(() => {
    accountMemberships.match({
      NotAsked: () => {},
      Loading: () => {},
      Done: result => {
        result.match({
          Ok: ({ user }) => setShowScrollAid((user?.accountMemberships.edges.length ?? 0) > 3),
          Error: () => {},
        });
      },
    });
  }, [accountMemberships]);

  return accountMemberships.match({
    NotAsked: () => null,
    Loading: () => <LoadingView color={colors.current[500]} style={styles.loader} />,
    Done: result =>
      result.match({
        Ok: ({ user }) =>
          user == null ? null : (
            <View>
              <Connection connection={user.accountMemberships}>
                {accountMemberships => (
                  <FlatList
                    role="list"
                    style={styles.list}
                    data={accountMemberships.edges}
                    keyExtractor={item => `AccountSelector${item.node.id}`}
                    onScroll={handleScroll}
                    renderItem={({ item }) => (
                      <Item
                        membership={item.node}
                        isActive={accountMembershipId === item.node.id}
                        onPress={() => {
                          onPressItem(item.node.id);
                        }}
                      />
                    )}
                    onEndReached={() => {
                      const endCursor = accountMemberships.pageInfo.endCursor;
                      if (endCursor != null) {
                        setVariables({ after: endCursor });
                      }
                    }}
                  />
                )}
              </Connection>

              <View
                style={[styles.bottomGradient, showScrollAid && styles.visibleBottomGradient]}
              />
            </View>
          ),
        Error: () => null,
      }),
  });
};

export type AccountActivationTag =
  | "actionRequired"
  | "pending"
  | "none"
  | "refused"
  | "suspended"
  | "closing"
  | "closed";

type AccountPickerButtonProps = {
  desktop: boolean;
  accountMembershipId: string;
  activationTag: AccountActivationTag;
  activationLinkActive: boolean;
  hasMultipleMemberships: boolean;
  onPress: () => void;
  onPressActivationLink?: () => void;
  selectedAccountMembership: NonNullable<AccountAreaQuery["accountMembership"]>;
  availableBalance?: Amount;
};

export const AccountPickerButton = forwardRef<View, AccountPickerButtonProps>(
  (
    {
      accountMembershipId,
      activationTag,
      activationLinkActive,
      hasMultipleMemberships,
      selectedAccountMembership,
      desktop,
      onPress,
      onPressActivationLink,
      availableBalance,
    },
    ref,
  ) => {
    return (
      <View style={styles.container}>
        <View style={styles.base}>
          <Pressable
            ref={ref}
            style={({ hovered }) => [styles.account, hovered && styles.hoveredAccount]}
            disabled={!hasMultipleMemberships}
            onPress={onPress}
          >
            <View style={styles.accountIdentifier}>
              <LakeHeading variant="h5" level={3} numberOfLines={3} color={colors.gray[900]}>
                {selectedAccountMembership.account != null
                  ? selectedAccountMembership.account.name
                  : selectedAccountMembership.email}
              </LakeHeading>

              {selectedAccountMembership.account != null ? (
                <LakeText variant="smallRegular" numberOfLines={1} color={colors.gray[500]}>
                  {selectedAccountMembership.account.holder.info.name}
                </LakeText>
              ) : null}
            </View>

            {hasMultipleMemberships ? (
              <Icon name={desktop ? "chevron-down-filled" : "chevron-right-filled"} size={16} />
            ) : (
              <Space width={16} />
            )}
          </Pressable>

          {isNotNullish(availableBalance) && desktop && (
            <View style={styles.balance}>
              <LakeText variant="semibold" color={colors.gray[900]}>
                {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
              </LakeText>
            </View>
          )}

          {activationTag !== "none" && (
            <View>
              {match(activationTag)
                .with("refused", () => (
                  <View style={styles.activationLink}>
                    <Tag color="negative" size="small">
                      {t("accountActivation.menuTag.refused")}
                    </Tag>
                  </View>
                ))
                .with("suspended", () => (
                  <View style={styles.activationLink}>
                    <Tag color="warning" size="small">
                      {t("accountActivation.menuTag.suspended")}
                    </Tag>
                  </View>
                ))
                .with("closing", () => (
                  <View style={styles.activationLink}>
                    <Tag color="warning" size="small">
                      {t("accountActivation.menuTag.closing")}
                    </Tag>
                  </View>
                ))
                .with("closed", () => (
                  <View style={styles.activationLink}>
                    <Tag color="negative" size="small">
                      {t("accountActivation.menuTag.closed")}
                    </Tag>
                  </View>
                ))
                .otherwise(activationTag => (
                  <Link
                    to={Router.AccountActivation({ accountMembershipId })}
                    onPress={onPressActivationLink}
                    style={({ hovered }) => [
                      styles.activationLink,
                      hovered && styles.activationLinkHovered,
                    ]}
                  >
                    {match(activationTag)
                      .with("actionRequired", () => (
                        <Tag color="warning" size="small">
                          {t("accountActivation.menuTag.actionRequired")}
                        </Tag>
                      ))
                      .with("pending", () => (
                        <Tag color="shakespear" size="small">
                          {t("accountActivation.menuTag.pending")}
                        </Tag>
                      ))
                      .exhaustive()}

                    <Icon name="arrow-right-filled" size={16} color={colors.gray[500]} />
                  </Link>
                ))}

              {activationLinkActive && (
                <SidebarNavigationTrackerActiveMarker color={colors.current[500]} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  },
);
