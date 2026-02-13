import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { colors } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingRepresentative } from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 12,
  },
  footerItem: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  footerItemHover: {
    backgroundColor: colors.gray[0],
  },
  separator: {
    height: 1,
    width: "100%",
    flexShrink: 1,
    backgroundColor: colors.gray[100],
  },
  separatorContainer: {
    gap: "24px",
    paddingHorizontal: 24,
  },
});

type RepresentativeItem = Item<string> & {
  roles: string;
  fullName: string;
};

type props = {
  representatives: OnboardingRepresentative[];
  value?: string;
  error?: string;
  onChange: (value: string) => void;
};

export const RepresentativeFormsInput = ({ representatives, value, onChange, error }: props) => {
  const items: RepresentativeItem[] = useMemo(() => {
    return representatives
      .map(representative => {
        return match(representative)
          .with(
            {
              __typename: "OnboardingIndividualRepresentative",
              firstName: P.string,
              lastName: P.string,
              roles: P.array(P.string),
            },
            ({ roles, firstName, lastName }) => ({
              name: `${firstName} ${lastName} - ${roles.join(", ")}`,
              fullName: `${firstName} ${lastName}`,
              value: lastName,
              roles: roles.join(", "),
            }),
          )
          .with(
            {
              __typename: "OnboardingCompanyRepresentative",
              entityName: P.string,
              roles: P.array(P.string),
            },
            ({ roles, entityName }) => ({
              name: `${entityName} - ${roles.join(", ")}`,
              fullName: `${entityName}`,
              value: entityName,
              roles: roles.join(", "),
            }),
          )
          .otherwise(() => null);
      })
      .filter(item => item !== null);
  }, [representatives]);

  return (
    <LakeLabel
      label={t("company.step.organisation.representativeLabel")}
      render={id => (
        <LakeSelect
          id={id}
          placeholder={t("company.step.organisation.representativePlaceholder")}
          value={value}
          onValueChange={onChange}
          items={items}
          error={error}
          renderItem={item => (
            <Box direction="column">
              <LakeText color={colors.gray[900]}>{item.fullName}</LakeText>
              <LakeText variant="smallRegular" color={colors.gray[600]}>
                {item.roles}
              </LakeText>
            </Box>
          )}
          PopoverFooter={({ close }) => (
            <View style={styles.footer}>
              <Box
                direction="row"
                alignItems="center"
                justifyContent="center"
                style={styles.separatorContainer}
              >
                <View style={styles.separator} />
                <LakeText variant="smallRegular">
                  {t("company.step.organisation.representative.or")}
                </LakeText>
                <View style={styles.separator} />
              </Box>
              <Pressable
                style={({ hovered }) => [styles.footerItem, hovered && styles.footerItemHover]}
                onPress={() => {
                  onChange("");
                  close();
                }}
              >
                <LakeText>{t("company.step.organisation.representative.unlisted")}</LakeText>
              </Pressable>
            </View>
          )}
        />
      )}
    />
  );
};
