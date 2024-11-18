import { Breadcrumbs, useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AccountCountry } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { useTgglFlag } from "../utils/tggl";
import { TransferBulkWizard } from "./TransferBulkWizard";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRecurringWizard } from "./TransferRecurringWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { TypePickerLink } from "./TypePickerLink";
import { WizardLayout } from "./WizardLayout";

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
  params: GetRouteParams<"AccountPaymentsNew">;
};

export const TransferTypePicker = ({
  accountMembershipId,
  accountId,
  accountCountry,
  params,
}: Props) => {
  const ictEnabled = useTgglFlag("initiate_international_credit_transfer_outgoing");
  const permissions = usePermissions();

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
      ...(permissions.canInitiateCreditTransfer
        ? [
            {
              url: Router.AccountPaymentsNew({ accountMembershipId, type: "transfer" }),
              icon: "arrow-swap-regular" as const,
              title: t("transfer.tile.transfer.title"),
              subtitle: t("transfer.tile.transfer.subtitle"),
            },
          ]
        : []),
      ...(permissions.canCreateStandingOrder
        ? [
            {
              url: Router.AccountPaymentsNew({ accountMembershipId, type: "recurring" }),
              icon: "lake-clock-arrow-swap" as const,
              title: t("transfer.tile.recurringTransfer.title"),
              subtitle: t("transfer.tile.recurringTransfer.subtitle"),
            },
          ]
        : []),
      ...(permissions.canInitiateCreditTransfer && ictEnabled.getOr(false)
        ? [
            {
              url: Router.AccountPaymentsNew({ accountMembershipId, type: "international" }),
              icon: "earth-regular" as const,
              title: t("transfer.tile.internationalTransfer.title"),
              subtitle: t("transfer.tile.internationalTransfer.subtitle"),
            },
          ]
        : []),
      ...(permissions.canInitiateCreditTransferToNewBeneficiary
        ? [
            {
              url: Router.AccountPaymentsNew({ accountMembershipId, type: "bulk" }),
              icon: "lake-document-csv" as const,
              title: t("transfer.tile.bulkTransfer.title"),
              subtitle: t("transfer.tile.bulkTransfer.subtitle"),
            },
          ]
        : []),
    ],
    [ictEnabled, accountMembershipId, permissions],
  );

  const onPressClose = useCallback(
    () => Router.push("AccountPaymentsNew", { accountMembershipId }),
    [accountMembershipId],
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

      <FullViewportLayer
        visible={params.type === "transfer" && permissions.canInitiateCreditTransfer}
      >
        <WizardLayout title={t("transfer.newTransfer")} onPressClose={onPressClose}>
          {({ large }) => (
            <TransferRegularWizard
              large={large}
              accountCountry={accountCountry}
              accountId={accountId}
              accountMembershipId={accountMembershipId}
              onPressClose={onPressClose}
            />
          )}
        </WizardLayout>
      </FullViewportLayer>

      <FullViewportLayer
        visible={params.type === "recurring" && permissions.canCreateStandingOrder}
      >
        <TransferRecurringWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={onPressClose}
        />
      </FullViewportLayer>

      <FullViewportLayer
        visible={params.type === "international" && permissions.canInitiateCreditTransfer}
      >
        <TransferInternationalWizard
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={onPressClose}
        />
      </FullViewportLayer>

      <FullViewportLayer
        visible={params.type === "bulk" && permissions.canInitiateCreditTransferToNewBeneficiary}
      >
        <TransferBulkWizard
          accountCountry={accountCountry}
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onPressClose={onPressClose}
        />
      </FullViewportLayer>
    </>
  );
};
