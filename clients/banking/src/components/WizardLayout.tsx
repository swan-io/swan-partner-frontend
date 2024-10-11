import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  header: {
    paddingVertical: spacings[12],
  },
  headerContents: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 1336,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1172,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
});

type Props = {
  children: ReactNode | ComponentProps<typeof ResponsiveContainer>["children"];
  title: string;
  onPressClose?: () => void;
  headerEnd?: ReactNode | ComponentProps<typeof ResponsiveContainer>["children"];
};

export const WizardLayout = ({ children, title, onPressClose, headerEnd }: Props) => (
  <ResponsiveContainer style={styles.fill} breakpoint={breakpoints.medium}>
    {context => (
      <View style={styles.fill}>
        <View style={styles.header}>
          <View style={[styles.headerContents, !context.large && styles.mobileZonePadding]}>
            {onPressClose != null ? (
              <>
                <LakeButton
                  ariaLabel={t("common.closeButton")}
                  mode="tertiary"
                  icon="dismiss-regular"
                  onPress={onPressClose}
                />

                <Space width={context.large ? 32 : 8} />
              </>
            ) : (
              <>
                <Space height={48} width={48} />
                <Space width={context.large ? 32 : 8} />
              </>
            )}

            <View style={styles.fill}>
              <LakeHeading level={2} variant="h3">
                {title}
              </LakeHeading>
            </View>

            {typeof headerEnd === "function" ? headerEnd(context) : headerEnd}
          </View>
        </View>

        <Separator />

        <ScrollView
          contentContainerStyle={[styles.contents, context.large && styles.desktopContents]}
        >
          {typeof children === "function" ? children(context) : children}
        </ScrollView>
      </View>
    )}
  </ResponsiveContainer>
);
