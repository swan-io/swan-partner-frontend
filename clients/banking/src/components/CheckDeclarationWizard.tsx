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
import { useState } from "react";
import { Text, View } from "react-native";
import { t } from "../utils/i18n";
import { WizardLayout } from "./WizardLayout";

const NumberDot = ({ value }: { value: number }) => (
  <Box
    alignItems="center"
    justifyContent="center"
    style={{
      backgroundColor: colors.partner[500],
      height: 20,
      width: 20,
      borderRadius: 10,
    }}
  >
    <Text
      style={{
        fontFamily: fonts.primary,
        fontStyle: "italic",
        fontSize: 12,
        color: invariantColors.white,
        textAlign: "center",
        lineHeight: "1" as unknown as number,
      }}
    >
      {value}
    </Text>
  </Box>
);

const CheckForm = ({ large, onOpenHelp }: { large: boolean; onOpenHelp: () => void }) => {
  return (
    <Tile title="Check 1">
      <LakeLabel
        label={"Custom label"}
        optionalLabel={t("form.optional")}
        render={id => <LakeTextInput id={id} />}
      />

      <Space height={8} />

      <LakeLabel label={"Amount"} render={id => <LakeTextInput id={id} unit="EUR" />} />

      <Box direction={large ? "row" : "column"} alignItems={large ? "center" : "stretch"}>
        <LakeLabel
          label={"CMC7"}
          style={{ flexGrow: 1 }}
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
          render={id => <LakeTextInput id={id} placeholder="00000000 0000000000000 0000000000" />}
        />

        <Space width={32} />

        <LakeLabel
          label={"RLMC"}
          style={
            large && {
              flexGrow: 1,
              maxWidth: 220,
            }
          }
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
  const [checks, setChecks] = useState([]);

  return (
    <WizardLayout title={"Declare a check payment"} onPressClose={onPressClose}>
      {({ large }) => (
        <>
          <LakeHeading level={2} variant="h3">
            {"Enter details about your check"}
          </LakeHeading>

          <Space height={8} />

          <LakeText variant="smallRegular">
            {
              "Checks must be from a French financial institution and for an amount less than 10000€ (ten thousand euros)."
            }
          </LakeText>

          <Space height={32} />
          <CheckForm large={large} onOpenHelp={setHelpModal.open} />
          <Space height={32} />

          <LakeButton
            mode="secondary"
            direction="column"
            icon="add-circle-regular"
            iconSize={24}
            style={{
              borderColor: colors.gray[300],
              borderRadius: radii[8],
              borderStyle: "dashed",
              padding: spacings[20],
            }}
          >
            Add a check
          </LakeButton>

          <Space height={16} />

          <ResponsiveContainer breakpoint={800}>
            {({ small }) => (
              <LakeButtonGroup>
                <LakeButton color="current" onPress={() => {}} grow={small} loading={false}>
                  {"Declare"}
                </LakeButton>
              </LakeButtonGroup>
            )}
          </ResponsiveContainer>

          <LakeModal
            title={"What are CMC7 and RLMC?"}
            visible={helpModalVisible}
            onPressClose={setHelpModal.close}
          >
            <Space height={8} />

            <View
              role="img"
              style={{
                backgroundColor: invariantColors.white,
                borderRadius: radii[8],
                borderWidth: 1,
                overflow: "hidden",
                borderColor: colors.gray[200],
                paddingTop: spacings[48],
              }}
            >
              <Svg
                viewBox="0 0 448 69"
                style={{
                  paddingHorizontal: spacings[12],
                }}
              >
                <Path
                  d="M0 1.91a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm0 28a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm1-15a1 1 0 100 2h300a1 1 0 000-2H1zm333 39a1 1 0 011-1h112a1 1 0 010 2H335a1 1 0 01-1-1zm1 13a1 1 0 000 2h112a1 1 0 000-2H335z"
                  fill={colors.gray[100]}
                />

                <Path d="M334 12.787h113.972v25.934H334z" fill={colors.gray[50]} />
              </Svg>

              <Box
                direction="row"
                alignItems="center"
                justifyContent="end"
                style={{
                  padding: spacings[12],
                }}
              >
                <NumberDot value={2} />
                <Space width={8} />

                <LakeText
                  color={colors.gray[600]}
                  numberOfLines={1}
                  style={{
                    fontStyle: "italic",
                    fontSize: 12,
                  }}
                >
                  (00)
                </LakeText>
              </Box>

              <Box
                direction="row"
                alignItems="center"
                style={{
                  backgroundColor: colors.gray[50],
                  paddingVertical: spacings[12],
                  paddingHorizontal: spacings[16],
                }}
              >
                <NumberDot value={1} />
                <Space width={8} />

                <LakeText
                  color={colors.gray[600]}
                  numberOfLines={1}
                  style={{
                    fontStyle: "italic",
                    fontSize: 12,
                  }}
                >
                  00000000 0000000000000 0000000000
                </LakeText>
              </Box>
            </View>

            <Space height={32} />

            <Box direction="row" alignItems="center">
              <NumberDot value={1} />
              <Space width={12} />

              <LakeText variant="smallRegular">
                {"CMC7 is a 31-character code printed at the bottom of your check."}
              </LakeText>
            </Box>

            <Space height={12} />

            <Box direction="row" alignItems="center">
              <NumberDot value={2} />
              <Space width={12} />

              <LakeText variant="smallRegular">
                {"RLMC is a 2-digit key printed underneath the location and date of your check."}
              </LakeText>
            </Box>
          </LakeModal>
        </>
      )}
    </WizardLayout>
  );
};
