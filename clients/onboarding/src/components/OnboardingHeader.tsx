import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { ProjectEnvTag } from "@swan-io/lake/src/components/ProjectEnvTag";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { env } from "../utils/env";
import { languages, locale, setPreferredLanguage } from "../utils/i18n";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
    maxWidth: 1280,
    marginHorizontal: "auto",
  },
  containerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: spacings[24],
  },
  logo: {
    maxWidth: "120px",
  },
  languagesSelect: {
    alignItems: "flex-end",
  },
});

type Props = {
  projectName: string;
  projectLogo: string;
};

export const OnboardingHeader = ({ projectName, projectLogo }: Props) => {
  const isSandbox = env.SWAN_ENVIRONMENT !== "LIVE";

  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  return (
    <ResponsiveContainer>
      {({ large, small }) => (
        <Box
          direction="row"
          alignItems="center"
          justifyContent="center"
          style={[styles.container, large && styles.containerDesktop]}
        >
          <AutoWidthImage
            ariaLabel={projectName}
            sourceUri={projectLogo}
            height={small ? 30 : 40}
            resizeMode="contain"
            style={styles.logo}
          />

          {isSandbox && (
            <>
              <Space width={12} />
              <ProjectEnvTag projectEnv="Sandbox" iconOnly={small} />
            </>
          )}

          <Fill minWidth={12} />

          <View>
            <LakeSelect
              value={locale.language}
              items={languageOptions}
              hideErrors={true}
              mode="borderless"
              style={styles.languagesSelect}
              onValueChange={locale => {
                setPreferredLanguage(locale);
              }}
            />
          </View>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
