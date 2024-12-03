import { AsyncData, Future, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Popover } from "@swan-io/lake/src/components/Popover";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ProjectEnvTag } from "@swan-io/lake/src/components/ProjectEnvTag";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  EndorseSandboxUserDocument,
  SandboxUserDocument,
  SandboxUsersDocument,
} from "../graphql/partner-admin";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";

const easeInOutQuad = "cubic-bezier(0.45, 0, 0.55, 1)";

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  placeholder: {
    height: spacings[24],
  },
  container: {
    animationKeyframes: {
      from: {
        opacity: 0,
      },
    },
    animationDuration: "300ms",
    animationTimingFunction: easeInOutQuad,
  },
  textContent: {
    flexGrow: 1,
    flexShrink: 1,
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: 140,
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.sandbox[200],
  },
  contents: {
    marginRight: negativeSpacings[8],
  },
  icon: {
    paddingRight: 6, // hardcoded for visual centering
  },
  loader: {
    paddingVertical: spacings[48],
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
  selected: {
    color: colors.gray[800],
  },
  itemText: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  value: {
    justifyContent: "center",
    height: 40,
    paddingHorizontal: spacings[24],
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  selectListTitle: {
    paddingHorizontal: spacings[24],
    paddingTop: spacings[12],
  },
  listContent: {
    paddingVertical: 12,
  },
});

const PER_PAGE = 20;

type ItemProps = {
  firstName?: string | null;
  lastName?: string | null;
  onPress: () => Future<unknown>;
  isActive: boolean;
};

const Item = ({ onPress, isActive, firstName, lastName }: ItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Pressable
      role="listitem"
      onPress={() => {
        setIsLoading(true);
        onPress().tap(() => setIsLoading(false));
      }}
      style={({ hovered, pressed }) => [
        styles.value,
        styles.item,
        hovered && styles.hoveredItem,
        pressed && styles.pressedItem,
        isActive && styles.activeItem,
      ]}
    >
      <Box direction="row" alignItems="center">
        <LakeText
          variant="regular"
          color={colors.gray[900]}
          numberOfLines={1}
          style={[styles.itemText, isActive && styles.selected]}
        >
          {firstName} {lastName}
        </LakeText>

        <Fill minWidth={12} />

        {isActive ? (
          <Icon color={colors.positive[500]} name="checkmark-filled" size={16} />
        ) : isLoading ? (
          <ActivityIndicator color={colors.gray[500]} size={16} />
        ) : (
          <Space width={16} />
        )}
      </Box>
    </Pressable>
  );
};

type PickerContentsProps = {
  onEndorse: () => void;
};

export const SandboxUserPickerContents = ({ onEndorse }: PickerContentsProps) => {
  const [sandboxUsers, { setVariables }] = useQuery(SandboxUsersDocument, {
    first: PER_PAGE,
    orderBy: {
      field: "createdAt",
      direction: "Asc",
    },
  });
  const [endorseSandboxUser] = useMutation(EndorseSandboxUserDocument);

  return match(sandboxUsers)
    .with(AsyncData.P.NotAsked, () => null)
    .with(AsyncData.P.Loading, () => (
      <LoadingView color={colors.current[500]} style={styles.loader} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P._)), () => null)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ sandboxUser, sandboxUsers }) => {
      return (
        <Box grow={1}>
          <Connection connection={sandboxUsers}>
            {sandboxUsers => (
              <FlatList
                role="list"
                style={styles.list}
                data={sandboxUsers?.edges ?? []}
                contentContainerStyle={styles.listContent}
                keyExtractor={item => `SandboxUserSelector${item.node.id}`}
                renderItem={({ item: { node } }) => (
                  <Item
                    firstName={node.firstName}
                    lastName={node.lastName}
                    isActive={sandboxUser.id === node.id}
                    onPress={() => {
                      return endorseSandboxUser({ input: { id: node.id } })
                        .mapOkToResult(filterRejectionsToResult)
                        .tapError(error =>
                          showToast({ variant: "error", title: translateError(error) }),
                        )
                        .tapOk(() => onEndorse());
                    }}
                  />
                )}
                onEndReached={() => {
                  const endCursor = sandboxUsers?.pageInfo.endCursor;
                  if (endCursor != null) {
                    setVariables({ after: endCursor });
                  }
                }}
              />
            )}
          </Connection>
        </Box>
      );
    })
    .exhaustive();
};

export const SandboxUserPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const referenceRef = useRef<View>(null);

  const [sandboxUser] = useQuery(SandboxUserDocument, {});

  return (
    <>
      {match(sandboxUser)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <View style={styles.placeholder} />)
        .with(
          AsyncData.P.Done(
            Result.P.Ok(P.select({ sandboxUser: { firstName: P.string, lastName: P.string } })),
          ),
          ({ sandboxUser: { firstName, lastName } }) => (
            <View ref={referenceRef} style={styles.root}>
              <Pressable onPress={() => setIsOpen(true)} style={styles.container}>
                <Tag color="sandbox" icon="beaker-regular">
                  <Box direction="row" alignItems="center" style={styles.contents}>
                    <LakeText
                      numberOfLines={1}
                      variant="smallMedium"
                      color={colors.sandbox.primary}
                      style={styles.textContent}
                    >
                      {firstName} {lastName}
                    </LakeText>

                    <Space width={12} />
                    <View style={styles.separator} />
                    <Space width={4} />

                    <Icon
                      color={colors.sandbox.primary}
                      style={styles.icon}
                      name={isOpen ? "chevron-up-filled" : "chevron-down-filled"}
                      size={16}
                    />
                  </Box>
                </Tag>
              </Pressable>
            </View>
          ),
        )
        .otherwise(() => (
          <ProjectEnvTag projectEnv="Sandbox" />
        ))}

      <Popover
        referenceRef={referenceRef}
        matchReferenceWidth={true}
        visible={isOpen}
        onDismiss={() => setIsOpen(false)}
      >
        <LakeText variant="regular" color={colors.current.primary} style={styles.selectListTitle}>
          {t("sandboxUser.impersonatedAs")}
        </LakeText>

        <SandboxUserPickerContents
          onEndorse={() => {
            window.location.replace(Router.ProjectRootRedirect());
          }}
        />
      </Popover>
    </>
  );
};

export const SandboxUserTag = ({ onPress }: { onPress: () => void }) => {
  const referenceRef = useRef<View>(null);

  const [sandboxUser] = useQuery(SandboxUserDocument, {});

  return (
    <>
      {match(sandboxUser)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <View style={styles.placeholder} />)
        .with(
          AsyncData.P.Done(
            Result.P.Ok(P.select({ sandboxUser: { firstName: P.string, lastName: P.string } })),
          ),
          ({ sandboxUser: { firstName, lastName } }) => (
            <View ref={referenceRef} style={styles.root}>
              <Pressable onPress={onPress} style={styles.container}>
                <Tag color="sandbox" icon="beaker-regular">
                  <Box direction="row" alignItems="center" style={styles.contents}>
                    <LakeText
                      numberOfLines={1}
                      variant="smallMedium"
                      color={colors.sandbox.primary}
                    >
                      {firstName} {lastName}
                    </LakeText>

                    <Space width={12} />
                    <View style={styles.separator} />
                    <Space width={4} />

                    <Icon
                      color={colors.sandbox.primary}
                      style={styles.icon}
                      name="chevron-right-filled"
                      size={16}
                    />
                  </Box>
                </Tag>
              </Pressable>
            </View>
          ),
        )
        .otherwise(() => (
          <View style={styles.placeholder} />
        ))}
    </>
  );
};
