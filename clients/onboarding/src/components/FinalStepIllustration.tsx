import { Box } from "@swan-io/lake/src/components/Box";
import { Circle, Path, Svg } from "@swan-io/lake/src/components/Svg";
import { colors } from "@swan-io/lake/src/constants/design";
import transparentize from "polished/lib/color/transparentize";
import { Image, StyleSheet, View } from "react-native";

const SVG_SIZE_DESKTOP = 350;
const SVG_SIZE_MOBILE = 250;

const styles = StyleSheet.create({
  separator: {
    position: "absolute",
    width: "70%",
    height: 2,
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: "auto",
    backgroundColor: colors.gray[100],
  },
  separatorMobile: {
    width: "92%",
  },
  container: {
    overflow: "hidden",
  },
  content: {
    position: "absolute",
    marginHorizontal: "auto",
    top: 68,
    left: 0,
    right: 0,
  },
  contentMobile: {
    top: 48,
  },
  circle: {
    backgroundColor: colors.gray[400],
    position: "absolute",
    zIndex: -1,
  },
  pulse: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderColor: colors.gray[50],
    borderRadius: SVG_SIZE_DESKTOP / 2,
    borderStyle: "solid",
    borderWidth: 1,
    transform: [{ scale: 0 }],

    animationKeyframes: {
      from: { opacity: 0, transform: [{ scale: 1 }] },
      "25%": { opacity: 0.75 },
      to: { opacity: 0, transform: [{ scale: 3 }] },
    },

    animationDuration: "3.5s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
  smallDelay: {
    animationDelay: "1.5s",
  },
  mediumDelay: {
    animationDelay: "3s",
  },
  clientLogo: {
    width: "100%",
    height: 20,
  },
  clientLogoMobile: {
    height: 16,
  },
});
export const FinalStepIllustration = ({
  accentColor,
  projectLogo,
  projectName,
  size = "big",
}: {
  size?: "small" | "big";
  accentColor: string;
  projectLogo: string;
  projectName: string;
}) => {
  const isBig = size === "big";
  const pulseColor = { borderColor: transparentize(0.8, accentColor) };
  const circleSize = (isBig ? SVG_SIZE_DESKTOP : SVG_SIZE_MOBILE) + 25;

  return (
    <Box style={styles.container} direction="row" justifyContent="center">
      <View
        style={[
          styles.circle,
          {
            backgroundColor: accentColor,
            bottom: -circleSize / 2,
            height: circleSize,
            width: circleSize,
            borderRadius: circleSize / 2,
          },
        ]}
      >
        <View
          accessibilityRole="none"
          style={[
            styles.pulse,
            styles.smallDelay,
            pulseColor,
            {
              borderRadius: circleSize / 2,
            },
          ]}
        />

        <View
          accessibilityRole="none"
          style={[
            styles.pulse,
            styles.mediumDelay,
            pulseColor,
            {
              borderRadius: circleSize / 2,
            },
          ]}
        />
      </View>

      <Box style={[styles.content, !isBig && styles.contentMobile]}>
        <Image
          accessibilityLabel={projectName}
          resizeMode="contain"
          style={[styles.clientLogo, !isBig && styles.clientLogoMobile]}
          source={{ uri: projectLogo }}
        />
      </Box>

      <Svg viewBox="0 0 388 326" style={{ height: isBig ? SVG_SIZE_DESKTOP : SVG_SIZE_MOBILE }}>
        <Path d="M334 7H54v319h280V7Z" fill="#fff" />
        <Path d="M53 326h280V117H53v209Z" fill="#F8F8F8" />

        <Path
          d="M74 102a5 5 0 1 1 10 0 5 5 0 0 1-10 0Zm30 0a5 5 0 0 1 5-5h185a5 5 0 0 1 0 10H109a5 5 0 0 1-5-5Zm-10-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm210 5a5 5 0 1 1 10 0 5 5 0 0 1-10 0ZM76.5 137a2.5 2.5 0 1 0 0 5h74a2.5 2.5 0 1 0 0-5h-74Zm0 13a2.5 2.5 0 1 0 0 5h30a2.5 2.5 0 1 0 0-5h-30Zm36.5 2.5a2.5 2.5 0 0 1 2.5-2.5h69a2.5 2.5 0 1 1 0 5h-69a2.5 2.5 0 0 1-2.5-2.5ZM76.5 159a2.5 2.5 0 1 0 0 5h55a2.5 2.5 0 1 0 0-5h-55ZM74 170.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 1 1 0 5h-13a2.5 2.5 0 0 1-2.5-2.5Zm2.5 6.5a2.5 2.5 0 1 0 0 5h29a2.5 2.5 0 1 0 0-5h-29ZM88 188.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM76.5 186a2.5 2.5 0 1 0 0 5h6a2.5 2.5 0 1 0 0-5h-6Zm35.5-6.5a2.5 2.5 0 0 1 2.5-2.5h63a2.5 2.5 0 1 1 0 5h-63a2.5 2.5 0 0 1-2.5-2.5ZM98.5 168a2.5 2.5 0 1 0 0 5h53a2.5 2.5 0 1 0 0-5h-53Zm59.5 2.5a2.5 2.5 0 0 1 2.5-2.5h79a2.5 2.5 0 1 1 0 5h-79a2.5 2.5 0 0 1-2.5-2.5ZM140.5 159a2.5 2.5 0 1 0 0 5h55a2.5 2.5 0 1 0 0-5h-55Zm50.5-6.5a2.5 2.5 0 0 1 2.5-2.5h21a2.5 2.5 0 1 1 0 5h-21a2.5 2.5 0 0 1-2.5-2.5Zm32.5-2.5a2.5 2.5 0 1 0 0 5h50a2.5 2.5 0 1 0 0-5h-50Zm-147 61a2.5 2.5 0 1 0 0 5h74a2.5 2.5 0 1 0 0-5h-74Zm0 13a2.5 2.5 0 1 0 0 5h30a2.5 2.5 0 1 0 0-5h-30Zm36.5 2.5a2.5 2.5 0 0 1 2.5-2.5h69a2.5 2.5 0 1 1 0 5h-69a2.5 2.5 0 0 1-2.5-2.5ZM76.5 233a2.5 2.5 0 1 0 0 5h55a2.5 2.5 0 1 0 0-5h-55ZM74 244.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 1 1 0 5h-13a2.5 2.5 0 0 1-2.5-2.5Zm2.5 6.5a2.5 2.5 0 1 0 0 5h29a2.5 2.5 0 1 0 0-5h-29ZM88 262.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM76.5 260a2.5 2.5 0 1 0 0 5h6a2.5 2.5 0 1 0 0-5h-6Zm35.5-6.5a2.5 2.5 0 0 1 2.5-2.5h63a2.5 2.5 0 1 1 0 5h-63a2.5 2.5 0 0 1-2.5-2.5ZM98.5 242a2.5 2.5 0 1 0 0 5h53a2.5 2.5 0 1 0 0-5h-53Zm59.5 2.5a2.5 2.5 0 0 1 2.5-2.5h79a2.5 2.5 0 1 1 0 5h-79a2.5 2.5 0 0 1-2.5-2.5ZM140.5 233a2.5 2.5 0 1 0 0 5h55a2.5 2.5 0 1 0 0-5h-55Zm50.5-6.5a2.5 2.5 0 0 1 2.5-2.5h21a2.5 2.5 0 1 1 0 5h-21a2.5 2.5 0 0 1-2.5-2.5Zm32.5-2.5a2.5 2.5 0 1 0 0 5h50a2.5 2.5 0 1 0 0-5h-50ZM74 287.5a2.5 2.5 0 0 1 2.5-2.5h74a2.5 2.5 0 1 1 0 5h-74a2.5 2.5 0 0 1-2.5-2.5Zm0 13a2.5 2.5 0 0 1 2.5-2.5h30a2.5 2.5 0 1 1 0 5h-30a2.5 2.5 0 0 1-2.5-2.5Zm41.5-2.5a2.5 2.5 0 1 0 0 5h69a2.5 2.5 0 1 0 0-5h-69ZM74 309.5a2.5 2.5 0 0 1 2.5-2.5h55a2.5 2.5 0 1 1 0 5h-55a2.5 2.5 0 0 1-2.5-2.5Zm2.5 6.5a2.5 2.5 0 1 0 0 5h13a2.5 2.5 0 1 0 0-5h-13Zm0 9c-.82 0-1.54.4-2 1h33a2.5 2.5 0 0 0-2-1h-29Zm36 1h67a2.5 2.5 0 0 0-2-1h-63c-.82 0-1.54.4-2 1ZM96 318.5a2.5 2.5 0 0 1 2.5-2.5h53a2.5 2.5 0 1 1 0 5h-53a2.5 2.5 0 0 1-2.5-2.5Zm64.5-2.5a2.5 2.5 0 1 0 0 5h79a2.5 2.5 0 1 0 0-5h-79Zm-22.5-6.5a2.5 2.5 0 0 1 2.5-2.5h55a2.5 2.5 0 1 1 0 5h-55a2.5 2.5 0 0 1-2.5-2.5Zm55.5-11.5a2.5 2.5 0 1 0 0 5h21a2.5 2.5 0 1 0 0-5h-21Zm27.5 2.5a2.5 2.5 0 0 1 2.5-2.5h50a2.5 2.5 0 1 1 0 5h-50a2.5 2.5 0 0 1-2.5-2.5Z"
          fill="#E1E1E1"
        />

        <Circle cx={194} cy={216} r={34} fill="#F8F8F8" />

        <Path
          d="M253.76 177.09a2.65 2.65 0 0 0-1.5-2.15l-57.1-27.67a2.67 2.67 0 0 0-2.32 0l-57.1 27.66c-.85.41-1.42 1.23-1.5 2.16-.07.83-1.7 20.71 4.6 45 3.72 14.3 9.44 27.13 17 38.13a100.05 100.05 0 0 0 36.93 32.48 2.67 2.67 0 0 0 2.46 0c15-7.75 27.43-18.68 36.92-32.48 7.57-11 13.3-23.83 17-38.14 6.32-24.28 4.68-44.16 4.6-45ZM194 249.63a33.82 33.82 0 0 1-33.85-33.7A33.82 33.82 0 0 1 194 182.2a33.82 33.82 0 0 1 33.85 33.71A33.82 33.82 0 0 1 194 249.64Zm6.36-51.63a11.66 11.66 0 1 1-4.57 22.36l-2.57 2.56-.06-.01h-.06l-3.3-.23a.68.68 0 0 0-.73.72l.23 3.3.02.12-1.08 1.09a.56.56 0 0 0-.07-.02h-.05l-3.3-.23a.68.68 0 0 0-.73.72l.23 3.3c0 .05 0 .09.02.13l-1.38 1.38a1.4 1.4 0 0 1-.87.4l-4.56.41a1.4 1.4 0 0 1-1.53-1.52l.41-4.56c.03-.33.18-.64.4-.87l12.84-12.83a11.62 11.62 0 0 1 2.48-12.8c2.2-2.2 5.12-3.42 8.23-3.42Zm0 16.44a4.8 4.8 0 1 0-3.39-1.4c.9.9 2.11 1.4 3.39 1.4Z"
          fill={accentColor}
        />

        <Path
          d="M67.42 7h253.16a13 13 0 0 1 13 13v306h7V20a20 20 0 0 0-20-20H67.42a20 20 0 0 0-20 20v48.53A7.42 7.42 0 0 0 40 75.96v72.2c0 4.1 3.32 7.43 7.42 7.43v14.82a7.42 7.42 0 0 0-7.42 7.42v29.61c0 4.1 3.32 7.42 7.42 7.42V326h7V20a13 13 0 0 1 13-13Zm273.16 178.23c4.1 0 7.42-3.32 7.42-7.42v-27.76c0-4.1-3.32-7.43-7.42-7.43v42.6ZM164.87 42.08a5.88 5.88 0 0 1 5.88-5.89h27.08a5.88 5.88 0 1 1 0 11.77h-27.08a5.88 5.88 0 0 1-5.88-5.88Zm58.27 0c0 3.25-2.49 5.88-5.55 5.88-3.07 0-5.55-2.63-5.55-5.88s2.48-5.89 5.55-5.89c3.06 0 5.55 2.64 5.55 5.89Z"
          fill="#14191A"
        />
      </Svg>

      <View style={[styles.separator, !isBig && styles.separatorMobile]} />
    </Box>
  );
};
