import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  userInfos: {
    flex: 1, // use this to make ellipsis working well for email
  },
  email: {
    ...typography.bodySmall,
    fontWeight: typography.fontWeights.demi,
    color: colors.gray[900],
  },
  phoneNumber: {
    ...typography.bodySmall,
    color: colors.gray[900],
  },
});

type Props = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  size?: "small" | "large";
};

export const ProfileCard = ({ firstName, lastName, phoneNumber = "", size = "small" }: Props) => {
  const initials = [firstName, lastName]
    .filter(name => name !== "")
    .map(name => name[0])
    .join("");

  return (
    <Box direction="row" alignItems="center">
      <Avatar initials={initials} size={size === "small" ? 32 : 38} />
      <Space width={8} />

      <View style={styles.userInfos}>
        <Text numberOfLines={1} style={styles.email}>
          {firstName} {lastName}
        </Text>

        {isNotEmpty(phoneNumber) && (
          <Text numberOfLines={1} style={styles.phoneNumber}>
            {phoneNumber}
          </Text>
        )}
      </View>
    </Box>
  );
};
