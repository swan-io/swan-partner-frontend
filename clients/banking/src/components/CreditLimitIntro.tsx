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
import deferredDebitDocsImage from "../assets/images/credit-limit/deferred-debit-doc.jpg";
import requestLimitImage from "../assets/images/credit-limit/request-limit.jpg";
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
  accountId: string;
};

export const CreditLimitIntro = ({ accountId }: Props) => {
  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.container}>
      {({ small }) => (
        <Box direction="column" justifyContent="center" alignItems="center" grow={1}>
          <Fill minHeight={32} />

          <LakeHeading level={1} variant={small ? "h5" : "h3"} align="center">
            {t("accountDetails.creditLimit.intro.title")}
          </LakeHeading>

          <Space height={small ? 8 : 12} />

          <LakeText color={colors.gray[500]} align="center">
            {t("accountDetails.creditLimit.intro.description")}
          </LakeText>

          <Space height={small ? 32 : 72} />

          <Box
            direction={small ? "column" : "row"}
            alignItems="stretch"
            style={styles.tilesContainer}
          >
            <Tile flexGrow={1} flexShrink={1} flexBasis="50%">
              <Image source={requestLimitImage} style={styles.image} resizeMode="cover" />
              <Space height={32} />

              <LakeText variant="medium" color={colors.gray[900]}>
                {t("accountDetails.creditLimit.intro.request.title")}
              </LakeText>

              <Space height={8} />

              <LakeText variant="smallRegular">
                {t("accountDetails.creditLimit.intro.request.description")}
              </LakeText>

              <Fill minHeight={16} />

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton
                  size="small"
                  color="current"
                  href={Router.CreditLimitRequest({ accountId })}
                  onPress={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    Router.push("CreditLimitRequest", { accountId });
                  }}
                >
                  {t("accountDetails.creditLimit.intro.request.cta")}
                </LakeButton>
              </LakeButtonGroup>
            </Tile>

            <Space width={32} height={24} />

            <Tile selected={false} flexGrow={1} flexShrink={1} flexBasis="50%">
              <Image source={deferredDebitDocsImage} style={styles.image} resizeMode="cover" />
              <Space height={32} />

              <LakeText variant="medium" color={colors.gray[900]}>
                {t("accountDetails.creditLimit.intro.learn.title")}
              </LakeText>

              <Space height={8} />

              <LakeText variant="smallRegular">
                {t("accountDetails.creditLimit.intro.learn.description")}
              </LakeText>

              <Fill minHeight={32} />

              <Link to="https://docs.swan.io/" target="blank">
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
