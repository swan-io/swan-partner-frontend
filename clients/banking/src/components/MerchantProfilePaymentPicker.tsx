import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
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
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
};

export const MerchantProfilePaymentPicker = ({ params }: Props) => {
  const { merchantProfileId, accountMembershipId } = params;
  const links = useMemo(
    () => [
      {
        url: Router.AccountMerchantsProfilePaymentLinkList({
          accountMembershipId,
          merchantProfileId,
          new: "true",
        }),
        icon: "arrow-swap-regular" as const,
        title: t("merchantProfile.payments.tile.paymentLink"),
        subtitle: t("merchantProfile.payments.tile.paymentLink.subtitle"),
      },
      {
        url: Router.AccountMerchantsProfileSettings({
          accountMembershipId,
          merchantProfileId,
          check: "declare",
        }),
        icon: "lake-clock-arrow-swap" as const,
        title: t("merchantProfile.payments.tile.check"),
        subtitle: t("merchantProfile.payments.tile.check.subtitle"),
      },
    ],
    [accountMembershipId, merchantProfileId],
  );

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
        {({ large }) => (
          <View style={[styles.base, large && styles.desktop]}>
            {/* <Breadcrumbs /> */}

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

      <FullViewportLayer visible={params.new === "true"}>
        <p>check</p>
      </FullViewportLayer>

      <FullViewportLayer visible={params.check === "declare"}>
        <p>paymentlink</p>
      </FullViewportLayer>
    </>
  );
};
