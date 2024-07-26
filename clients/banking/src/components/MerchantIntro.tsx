import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import {
  breakpoints,
  colors,
  negativeSpacings,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { Image, StyleSheet } from "react-native";
import merchantProfileDocsImage from "../assets/images/merchant/merchant-profile-docs.jpg";
import merchantProfileImage from "../assets/images/merchant/merchant-profile.jpg";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    marginHorizontal: spacings[24],
  },
  image: {
    aspectRatio: "800 / 370",
    marginTop: negativeSpacings[32],
    marginHorizontal: negativeSpacings[32],
    borderBottomColor: colors.gray[100],
    borderBottomWidth: 1,
  },
  tilesContainer: {
    maxWidth: 832,
  },
  learnMore: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
});

type Props = {
  accountMembershipId: string;
};

// TODO: Handle ChoicePicker-like layout with horizontal scroll and buttons
export const MerchantIntro = ({ accountMembershipId }: Props) => {
  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.container}>
      {({ small }) => (
        <Box direction="column" justifyContent="center" alignItems="center" grow={1}>
          <Fill minHeight={32} />

          <LakeHeading level={1} variant={small ? "h5" : "h3"} align="center">
            {t("merchant.intro.title")}
          </LakeHeading>

          <Space height={small ? 8 : 12} />

          <LakeText color={colors.gray[500]} align="center">
            {t("merchant.intro.description")}
          </LakeText>

          <Space height={small ? 32 : 72} />

          <Box
            direction={small ? "column" : "row"}
            alignItems="stretch"
            style={styles.tilesContainer}
          >
            <Tile flexGrow={1} flexShrink={1} flexBasis="50%">
              <Image source={merchantProfileImage} style={styles.image} resizeMode="cover" />
              <Space height={32} />

              <LakeText variant="medium" color={colors.gray[900]}>
                {t("merchant.intro.merchantProfile.title")}
              </LakeText>

              <Space height={8} />

              <LakeText variant="smallRegular">
                {t("merchant.intro.merchantProfile.description")}
              </LakeText>

              <Fill minHeight={16} />

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton
                  size="small"
                  color="current"
                  icon="add-circle-filled"
                  href={Router.AccountMerchantsRoot({ accountMembershipId, new: "true" })}
                  onPress={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    Router.push("AccountMerchantsRoot", { accountMembershipId, new: "true" });
                  }}
                >
                  {t("merchant.intro.merchantProfile.requestAccess")}
                </LakeButton>
              </LakeButtonGroup>
            </Tile>

            <Space width={32} height={24} />

            <Tile selected={false} flexGrow={1} flexShrink={1} flexBasis="50%">
              <Image source={merchantProfileDocsImage} style={styles.image} resizeMode="cover" />
              <Space height={32} />

              <LakeText variant="medium" color={colors.gray[900]}>
                {t("merchant.intro.merchantProfileDocs.title")}
              </LakeText>

              <Space height={8} />

              <LakeText variant="smallRegular">
                {t("merchant.intro.merchantProfileDocs.description")}
              </LakeText>

              <Fill minHeight={32} />

              <Link to="#" target="blank">
                <LakeText color={colors.current.primary} style={styles.learnMore}>
                  {t("common.learnMore")}

                  <Space width={8} />
                  <Icon name="open-regular" size={16} />
                </LakeText>
              </Link>
            </Tile>
          </Box>

          <Fill minHeight={32} />
        </Box>
      )}
    </ResponsiveContainer>
  );
};
