import { Option } from "@swan-io/boxed";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { SidebarNavigationTrackerActiveMarker } from "@swan-io/lake/src/components/SidebarNavigationTracker";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  colors,
  negativeSpacings,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { IdentificationLevelFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "none",
    display: "flex",
    flexDirection: "column",
    marginHorizontal: negativeSpacings[32],
    paddingHorizontal: spacings[32],
  },
  button: {
    flexDirection: "row",
    cursor: "pointer",
    alignItems: "center",
    borderRadius: radii[8],
    boxShadow: `0 0 0 1px ${colors.gray[100]}`,
    backgroundColor: backgroundColor.default,
    overflow: "hidden",
    paddingVertical: spacings[12],
    paddingLeft: spacings[16],
    paddingRight: spacings[12],
  },

  informations: {
    ...commonStyles.fill,
  },
});

type Props = {
  firstName: string;
  lastName: string;
  identificationStatusInfo: Option<IdentificationLevelFragment>;
  accountMembershipId: string;
  shouldDisplayIdVerification: boolean;
  hasRequiredIdentificationLevel: boolean | undefined;
};

export const ProfileButton = memo<Props>(
  ({
    firstName,
    lastName,
    identificationStatusInfo,
    accountMembershipId,
    shouldDisplayIdVerification,
    hasRequiredIdentificationLevel,
  }) => {
    const names = [firstName, lastName].filter(isNotEmpty);
    const fullName = names.join(" ");
    const initials = names.map(name => name[0]).join("");

    return (
      <Link style={styles.link} to={Router.AccountProfile({ accountMembershipId })}>
        {({ active }) => (
          <View role="button" style={styles.button}>
            <Avatar size={25} initials={initials} />

            {fullName && (
              <>
                <Space width={16} />

                <View style={styles.informations}>
                  <LakeText
                    numberOfLines={1}
                    userSelect="none"
                    variant="smallMedium"
                    color={colors.gray[700]}
                  >
                    {fullName}
                  </LakeText>

                  {shouldDisplayIdVerification && hasRequiredIdentificationLevel === false
                    ? match(identificationStatusInfo)
                        .with(
                          Option.P.None,
                          Option.P.Some({
                            status: P.union(
                              "NotStarted",
                              "Started",
                              "Invalid",
                              "Canceled",
                              "Expired",
                            ),
                          }),
                          () => (
                            <>
                              <Space height={4} />
                              <Tag color="warning">{t("profile.actionRequired")}</Tag>
                            </>
                          ),
                        )
                        .otherwise(() => null)
                    : null}
                </View>
              </>
            )}

            <Space width={12} />
            <Icon name="chevron-right-filled" size={16} color={colors.gray[700]} />

            {active ? <SidebarNavigationTrackerActiveMarker color={colors.current[500]} /> : null}
          </View>
        )}
      </Link>
    );
  },
);
