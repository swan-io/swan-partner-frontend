import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Path, Svg } from "@swan-io/lake/src/components/Svg";
import { Tile } from "@swan-io/lake/src/components/Tile";
import {
  colors,
  fonts,
  invariantColors,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { StyleSheet, Text, View } from "react-native";
import { t } from "../utils/i18n";
import { WizardLayout } from "./WizardLayout";

const CMC7_EXAMPLE = "00000000 0000000000000 0000000000";

const styles = StyleSheet.create({
  numberDot: {
    backgroundColor: colors.partner[500],
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
  },
  numberDotText: {
    fontFamily: fonts.primary,
    color: invariantColors.white,
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
  },
  grow: {
    flexGrow: 1,
  },
  rlmcLarge: {
    flexGrow: 1,
    maxWidth: 220,
  },
  addButton: {
    borderColor: colors.gray[300],
    borderRadius: radii[8],
    borderStyle: "dashed",
    padding: spacings[20],
  },
  check: {
    borderColor: colors.gray[200],
    borderRadius: radii[8],
    borderWidth: 1,
    backgroundColor: invariantColors.white,
    overflow: "hidden",
    paddingTop: spacings[48],
  },
  checkSvg: {
    paddingHorizontal: spacings[12],
  },
  checkRight: {
    padding: spacings[12],
  },
  checkBottom: {
    backgroundColor: colors.gray[50],
    paddingVertical: spacings[12],
    paddingHorizontal: spacings[16],
  },
  checkText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});

const NumberDot = ({ value }: { value: number }) => (
  <View style={styles.numberDot}>
    <Text style={styles.numberDotText}>{value}</Text>
  </View>
);

const CheckForm = ({
  title,
  large,
  onOpenHelp,
}: {
  title: string;
  large: boolean;
  onOpenHelp: () => void;
}) => {
  return (
    <Tile title={title}>
      <LakeLabel
        label={t("check.form.customLabel")}
        optionalLabel={t("form.optional")}
        render={id => <LakeTextInput id={id} />}
      />

      <Space height={8} />

      <LakeLabel
        label={t("check.form.amount")}
        render={id => <LakeTextInput id={id} unit="EUR" />}
      />

      <Box direction={large ? "row" : "column"} alignItems={large ? "center" : "stretch"}>
        <LakeLabel
          label={t("check.form.cmc7")}
          style={styles.grow}
          help={
            <LakeButton
              mode="tertiary"
              size="small"
              color="gray"
              icon="question-circle-regular"
              onPress={onOpenHelp}
              ariaLabel={t("common.help.whatIsThis")}
            >
              {t("common.help.whatIsThis")}
            </LakeButton>
          }
          render={id => <LakeTextInput id={id} placeholder={CMC7_EXAMPLE} />}
        />

        <Space width={32} />

        <LakeLabel
          label={t("check.form.rlmc")}
          style={large && styles.rlmcLarge}
          help={
            <LakeButton
              mode="tertiary"
              size="small"
              color="gray"
              icon="question-circle-regular"
              ariaLabel={t("common.help.whatIsThis")}
              onPress={onOpenHelp}
            >
              {t("common.help.whatIsThis")}
            </LakeButton>
          }
          render={id => <LakeTextInput id={id} placeholder="00" />}
        />
      </Box>
    </Tile>
  );
};

type Props = {
  onPressClose?: () => void;
};

export const CheckDeclarationWizard = ({ onPressClose }: Props) => {
  const [helpModalVisible, setHelpModal] = useDisclosure(false);

  return (
    <WizardLayout title={t("check.form.title")} onPressClose={onPressClose}>
      {({ large }) => (
        <>
          <LakeHeading level={2} variant="h3">
            {t("check.form.subtitle")}
          </LakeHeading>

          <Space height={8} />
          <LakeText variant="smallRegular">{t("check.form.description")}</LakeText>
          <Space height={32} />
          <CheckForm title="Check 1" large={large} onOpenHelp={setHelpModal.open} />
          <Space height={32} />

          <LakeButton
            mode="secondary"
            direction="column"
            icon="add-circle-regular"
            iconSize={24}
            style={styles.addButton}
          >
            {t("check.form.add")}
          </LakeButton>

          <Space height={16} />

          <ResponsiveContainer breakpoint={800}>
            {({ small }) => (
              <LakeButtonGroup>
                <LakeButton color="current" onPress={() => {}} grow={small} loading={false}>
                  {t("check.form.declare")}
                </LakeButton>
              </LakeButtonGroup>
            )}
          </ResponsiveContainer>

          <LakeModal
            title={t("check.form.modal.title")}
            visible={helpModalVisible}
            onPressClose={setHelpModal.close}
          >
            <Space height={8} />

            <View role="img" style={styles.check}>
              <Svg viewBox="0 0 448 69" style={styles.checkSvg}>
                <Path
                  d="M0 1.91a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm0 28a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm1-15a1 1 0 100 2h300a1 1 0 000-2H1zm333 39a1 1 0 011-1h112a1 1 0 010 2H335a1 1 0 01-1-1zm1 13a1 1 0 000 2h112a1 1 0 000-2H335z"
                  fill={colors.gray[100]}
                />

                <Path d="M334 12.787h113.972v25.934H334z" fill={colors.gray[50]} />
              </Svg>

              <Box
                alignItems="center"
                direction="row"
                justifyContent="end"
                style={styles.checkRight}
              >
                <NumberDot value={2} />
                <Space width={8} />

                <LakeText color={colors.gray[600]} numberOfLines={1} style={styles.checkText}>
                  (00)
                </LakeText>
              </Box>

              <Box alignItems="center" direction="row" style={styles.checkBottom}>
                <NumberDot value={1} />
                <Space width={8} />

                <LakeText color={colors.gray[600]} numberOfLines={1} style={styles.checkText}>
                  {CMC7_EXAMPLE}
                </LakeText>
              </Box>
            </View>

            <Space height={32} />

            <Box direction="row" alignItems="center">
              <NumberDot value={1} />
              <Space width={12} />
              <LakeText variant="smallRegular">{t("check.form.modal.cmc7")}</LakeText>
            </Box>

            <Space height={12} />

            <Box direction="row" alignItems="center">
              <NumberDot value={2} />
              <Space width={12} />
              <LakeText variant="smallRegular">{t("check.form.modal.rlmc")}</LakeText>
            </Box>
          </LakeModal>
        </>
      )}
    </WizardLayout>
  );
};
