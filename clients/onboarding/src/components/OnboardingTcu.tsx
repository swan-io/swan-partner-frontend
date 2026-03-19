import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Ref } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatNestedMessage, t } from "../utils/i18n";

const styles = StyleSheet.create({
  tcuCheckbox: {
    top: 3, // center checkbox with text
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    color: colors.partner[500],
    textDecorationLine: "underline",
  },
  linkIcon: {
    marginLeft: 4,
    display: "inline-block",
    verticalAlign: "middle",
  },
});

type Props = {
  ref: Ref<View>;
  value: boolean;
  error: string | undefined;
  onChange: (value: boolean) => void;
  tcuUrl: string;
  tcuDocumentUri: string;
  partnerName: string | undefined;
};

export const OnboardingTcu = ({ ref, value, error, onChange, tcuUrl, tcuDocumentUri, partnerName = "" }: Props) => (
    <Box>
      <Space height={32} />

      <Pressable
        ref={ref}
        role="checkbox"
        aria-checked={value}
        onPress={() => onChange(!value)}
        style={styles.tcuCheckbox}
      >
        <LakeCheckbox value={value} isError={isNotNullish(error)} />
        <Space width={8} />

        <LakeText>
          {formatNestedMessage("step.finalize.terms", {
            firstLink: (
              <Link target="blank" to={tcuUrl} style={styles.link}>
                {t("emailPage.firstLink")}

                <Icon name="open-filled" size={16} style={styles.linkIcon} />
              </Link>
            ),
            secondLink: (
              <Link target="blank" to={tcuDocumentUri} style={styles.link}>
                {t("emailPage.secondLink", { partner: partnerName })}

                <Icon name="open-filled" size={16} style={styles.linkIcon} />
              </Link>
            ),
          })}
        </LakeText>
      </Pressable>

      <Space height={4} />
      <LakeText color={colors.negative[500]}>{error ?? " "}</LakeText>
    </Box>
);
