import { Box } from "@swan-io/lake/src/components/Box";
import { Breadcrumbs, useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { useTgglFlag } from "../utils/tggl";
import { TypePickerLink } from "./TypePickerLink";

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch",
    margin: "auto",
    padding: spacings[24],
  },
  header: {
    paddingTop: spacings[24],
    paddingHorizontal: spacings[24],
  },
  headerDesktop: {
    paddingTop: spacings[40],
    paddingHorizontal: spacings[40],
  },
});

type Props = {
  accountMembershipId: string;
};

export const TransferTypePicker = ({ accountMembershipId }: Props) => {
  const ictEnabled = useTgglFlag("initiate_international_credit_transfer_outgoing");

  useCrumb(
    useMemo(() => {
      return {
        label: t("transfer.newTransfer"),
        link: Router.AccountPaymentsNew({ accountMembershipId }),
      };
    }, [accountMembershipId]),
  );

  const links = useMemo(() => {
    return [
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
    ];
  }, [ictEnabled, accountMembershipId]);

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large}>
        {({ small }) => (
          <Box direction="row" style={small ? styles.header : styles.headerDesktop}>
            <Breadcrumbs />
          </Box>
        )}
      </ResponsiveContainer>

      <Stack space={12} style={styles.container}>
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
    </>
  );
};
