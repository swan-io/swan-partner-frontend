import { useForwardPagination } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { AccountMembershipFragment, GetEligibleCardMembershipsQuery } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  lineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  names: {
    display: "flex",
    flexGrow: 1,
    flexShrink: 1,
  },
  ellpsis: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  member: {
    marginBottom: spacings[12],
  },
  titleBar: {
    position: "sticky",
    top: 0,
    padding: spacings[12],
    marginHorizontal: -2,
    marginBottom: 2,
    backgroundColor: backgroundColor.default,
    zIndex: 1,
  },
});

export type Member = AccountMembershipFragment;

type Props = {
  initialMemberships?: Member[];
  account: GetEligibleCardMembershipsQuery["account"];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onSubmit: (currentMembers: Member[]) => void;
  setAfter: (cursor: string) => void;
};

export type CardWizardMembersRef = { submit: () => void };

export const CardWizardMembers = forwardRef<CardWizardMembersRef, Props>(
  (
    { initialMemberships, account, style, contentContainerStyle, onSubmit, setAfter }: Props,
    ref,
  ) => {
    const [currentMembers, setCurrentMembers] = useState<Member[]>(() => initialMemberships ?? []);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          if (currentMembers.length >= 1) {
            onSubmit(currentMembers);
          }
        },
      }),
      [currentMembers, onSubmit],
    );

    const selectedIds = useMemo(
      () => new Set(currentMembers.map(item => item.id)),
      [currentMembers],
    );

    const connection = account?.memberships;

    const memberships = useForwardPagination(connection);

    const onScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollTop = event.nativeEvent.contentOffset?.y ?? 0;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const contentHeight = event.nativeEvent.contentSize.height;
        const THRESHOLD = 200;

        if (
          memberships != null &&
          scrollTop + layoutHeight >= contentHeight - THRESHOLD &&
          (memberships.pageInfo.hasNextPage ?? false) &&
          memberships.pageInfo.endCursor != null
        ) {
          setAfter(memberships.pageInfo.endCursor);
        }
      },
      [memberships, setAfter],
    );

    if (memberships == null) {
      return <ErrorView />;
    }

    return (
      <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
        {({ large }) => (
          <ScrollView
            style={style}
            contentContainerStyle={contentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <Box direction="row" justifyContent="end" style={styles.titleBar}>
              <LakeHeading level={3} variant="h5" color={colors.gray[900]}>
                {t("cardWizard.members.cardsAlreadyOwned")}
              </LakeHeading>
            </Box>

            <View>
              {memberships.edges.map(({ node }) => {
                const isSelected = selectedIds.has(node.id);

                const contents = (
                  <View style={styles.lineContainer}>
                    <LakeCheckbox value={isSelected} />
                    <Space width={16} />
                    <Avatar size={large ? 32 : 24} user={node.user} />
                    <Space width={16} />

                    <View style={styles.names}>
                      <LakeHeading level={3} variant="h5" userSelect="none" style={styles.ellpsis}>
                        {getMemberName({ accountMembership: node })}
                      </LakeHeading>

                      <LakeText userSelect="none" style={styles.ellpsis}>
                        {node.email}
                      </LakeText>
                    </View>

                    <Fill minWidth={16} />

                    <Tag color="swan" icon="payment-regular">
                      {node.activeCards.totalCount}
                    </Tag>
                  </View>
                );

                return (
                  <Pressable
                    key={node.id}
                    style={styles.member}
                    onPress={() =>
                      setCurrentMembers(members =>
                        isSelected
                          ? members.filter(item => item.id !== node.id)
                          : [...members, node],
                      )
                    }
                  >
                    {({ hovered }) => (
                      <Tile hovered={hovered} selected={isSelected} paddingVertical={16}>
                        {contents}
                      </Tile>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </ResponsiveContainer>
    );
  },
);
