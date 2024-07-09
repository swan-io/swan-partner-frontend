import { Breadcrumbs, useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AccountCountry } from "../graphql/partner";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { BeneficiarySepaWizard } from "./BeneficiarySepaWizard";
import { TypePickerLink } from "./TypePickerLink";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  root: {
    ...commonStyles.fill,
    paddingHorizontal: spacings[24],
    paddingTop: spacings[24],
  },
  rootLarge: {
    paddingHorizontal: spacings[40],
    paddingTop: spacings[40],
  },
  stack: {
    margin: "auto",
    maxWidth: 500,
    paddingVertical: spacings[24],
  },
  stackLarge: {
    paddingVertical: spacings[40],
  },
});

type Props = {
  accountMembershipId: string;
  accountId: string;
  accountCountry: AccountCountry;
  type: GetRouteParams<"AccountPaymentsBeneficiariesNew">["type"];
};

export const BeneficiaryTypePicker = ({
  accountMembershipId,
  accountId,
  accountCountry,
  type,
}: Props) => {
  useCrumb(
    useMemo(
      () => ({
        label: t("beneficiaries.wizards.picker.crumb"),
        link: Router.AccountPaymentsBeneficiariesNew({ accountMembershipId }),
      }),
      [accountMembershipId],
    ),
  );

  const links = useMemo(
    () => [
      {
        url: Router.AccountPaymentsBeneficiariesNew({ accountMembershipId, type: "sepa" }),
        icon: "lake-euro" as const,
        title: t("beneficiaries.wizards.picker.sepa.title"),
        subtitle: t("beneficiaries.wizards.picker.sepa.subtitle"),
      },
    ],
    [accountMembershipId],
  );

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
        {({ large }) => (
          <View style={[styles.root, large && styles.rootLarge]}>
            <Breadcrumbs />

            <Stack
              alignItems="stretch"
              space={12}
              style={[styles.stack, large && styles.stackLarge]}
            >
              {links.map(({ url, icon, title, subtitle }, index) => (
                <TypePickerLink
                  key={index}
                  icon={icon}
                  title={title}
                  subtitle={subtitle}
                  url={url}
                  style={{ animationDelay: `${index * 150}ms` }}
                />
              ))}
            </Stack>
          </View>
        )}
      </ResponsiveContainer>

      <FullViewportLayer visible={type === "sepa"}>
        <BeneficiarySepaWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={() =>
            Router.push("AccountPaymentsBeneficiariesNew", { accountMembershipId })
          }
        />
      </FullViewportLayer>
    </>
  );
};
