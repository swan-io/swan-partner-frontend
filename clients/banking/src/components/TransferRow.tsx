import { Box } from "@swan-io/lake/src/components/Box";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { PlaceholderShape } from "./PlaceholderShape";

const styles = StyleSheet.create({
  part: {
    flexGrow: 0,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
  },
});

type Part = { title: string; subtitle?: string };

type Props = {
  from: Part;
  to: Part | "placeholder";
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const TransferRow = ({ from, to, style, vertical = false }: Props) => {
  return (
    <Box alignItems="center" direction={vertical ? "column" : "row"} style={style}>
      <Box alignItems={vertical ? "center" : "stretch"} style={styles.part}>
        <Heading numberOfLines={1} level={3} size={20}>
          {from.title}
        </Heading>

        <Text numberOfLines={1} style={styles.subtitle}>
          {from.subtitle}
        </Text>
      </Box>

      <Space height={8} width={20} />

      <Icon
        color={colors.gray[400]}
        size={18}
        name={vertical ? "arrow-down-filled" : "arrow-right-filled"}
      />

      <Space height={8} width={20} />

      <Box alignItems={vertical ? "center" : "stretch"} style={styles.part}>
        {to === "placeholder" ? (
          <>
            {vertical && <Space height={8} />}

            <PlaceholderShape height={16} width={240} />
            <Space height={8} />
            <PlaceholderShape height={16} width={160} />
          </>
        ) : (
          <>
            <Heading numberOfLines={1} level={3} size={20}>
              {to.title}
            </Heading>

            <Text numberOfLines={1} style={styles.subtitle}>
              {to.subtitle}
            </Text>
          </>
        )}
      </Box>
    </Box>
  );
};
