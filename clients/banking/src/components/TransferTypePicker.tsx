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
import { useTgglFlag } from "../utils/tggl";
import { TransferBulkWizard } from "./TransferBulkWizard";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRecurringWizard } from "./TransferRecurringWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { TypePickerLink } from "./TypePickerLink";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  base: {
    ...commonStyles.fill,
    paddingHorizontal: spacings[24],
    paddingTop: spacings[24],
  },
  desktop: {
    paddingHorizontal: spacings[40],
    paddingTop: spacings[40],
  },
  stack: {
    margin: "auto",
    maxWidth: 500,
    paddingVertical: spacings[24],
  },
});

type Props = {
  accountMembershipId: string;
  accountId: string;
  accountCountry: AccountCountry;
  type: GetRouteParams<"AccountPaymentsNew">["type"];
};

export const TransferTypePicker = ({
  accountMembershipId,
  accountId,
  accountCountry,
  type,
}: Props) => {
  const ictEnabled = useTgglFlag("initiate_international_credit_transfer_outgoing");

  useCrumb(
    useMemo(
      () => ({
        label: t("transfer.newTransfer"),
        link: Router.AccountPaymentsNew({ accountMembershipId }),
      }),
      [accountMembershipId],
    ),
  );

  const links = useMemo(
    () => [
      {
        url: Router.AccountPaymentsNew({ accountMembershipId, type: "transfer" }),
        icon: "arrow-swap-regular" as const,
        title: t("transfer.tile.transfer.title"),
        subtitle: t("transfer.tile.transfer.subtitle"),
      },
      {
        url: Router.AccountPaymentsNew({ accountMembershipId, type: "recurring" }),
        icon: "lake-clock-arrow-swap" as const,
        title: t("transfer.tile.recurringTransfer.title"),
        subtitle: t("transfer.tile.recurringTransfer.subtitle"),
      },
      ...(ictEnabled.getOr(false)
        ? [
            {
              url: Router.AccountPaymentsNew({ accountMembershipId, type: "international" }),
              icon: "earth-regular" as const,
              title: t("transfer.tile.internationalTransfer.title"),
              subtitle: t("transfer.tile.internationalTransfer.subtitle"),
            },
          ]
        : []),
      {
        url: Router.AccountPaymentsNew({ accountMembershipId, type: "bulk" }),
        icon: "lake-document-csv" as const,
        title: t("transfer.tile.bulkTransfer.title"),
        subtitle: t("transfer.tile.bulkTransfer.subtitle"),
      },
    ],
    [ictEnabled, accountMembershipId],
  );

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
        {({ large }) => (
          <View style={[styles.base, large && styles.desktop]}>
            <Breadcrumbs />

            <Stack alignItems="stretch" space={12} style={styles.stack}>
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

      <FullViewportLayer visible={type === "transfer"}>
        <TransferRegularWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={type === "recurring"}>
        <TransferRecurringWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={type === "international"}>
        <TransferInternationalWizard
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={type === "bulk"}>
        <TransferBulkWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
        />
      </FullViewportLayer>
    </>
  );
};
