import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { MerchantPaymentsQuery } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { CheckDeclarationWizard } from "./CheckDeclarationWizard";
import { MerchantProfilePaymentLinkNew } from "./MerchantProfilePaymentLinkNew";
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
  shouldEnableCheckTile: boolean;
  shouldEnablePaymentLinkTile: boolean;
  merchantProfile: NonNullable<MerchantPaymentsQuery["merchantProfile"]>;
  closeModal: () => void;
  setShouldShowTopbar: React.Dispatch<React.SetStateAction<boolean>>;
};

export const MerchantProfilePaymentPicker = ({
  closeModal,
  params,
  shouldEnableCheckTile,
  shouldEnablePaymentLinkTile,
  merchantProfile,
  setShouldShowTopbar,
}: Props) => {
  const { merchantProfileId, accountMembershipId } = params;

  const permissions = usePermissions();

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
        {({ large }) => (
          <View style={[styles.base, large && styles.desktop]}>
            <Stack alignItems="stretch" space={12} style={styles.stack}>
              {shouldEnablePaymentLinkTile && (
                <TypePickerLink
                  style={{ animationDelay: `${0 * 150}ms` }}
                  icon="arrow-swap-regular"
                  title={t("merchantProfile.payments.tile.paymentLink")}
                  subtitle={t("merchantProfile.payments.tile.paymentLink.subtitle")}
                  url={Router.AccountMerchantsProfilePaymentsList({
                    accountMembershipId,
                    merchantProfileId,
                    new: "true",
                  })}
                />
              )}

              {shouldEnableCheckTile && permissions.canRequestMerchantChecksPaymentMethod && (
                <TypePickerLink
                  style={{ animationDelay: `${1 * 150}ms` }}
                  icon="lake-clock-arrow-swap"
                  title={t("merchantProfile.payments.tile.check")}
                  subtitle={t("merchantProfile.payments.tile.check.subtitle")}
                  url={Router.AccountMerchantsProfileSettings({
                    accountMembershipId,
                    merchantProfileId,
                    check: "declare",
                  })}
                />
              )}
            </Stack>
          </View>
        )}
      </ResponsiveContainer>

      <FullViewportLayer visible={params.new === "true"}>
        <MerchantProfilePaymentLinkNew
          accentColor={merchantProfile.accentColor ?? undefined}
          merchantLogoUrl={merchantProfile.merchantLogoUrl ?? undefined}
          merchantName={merchantProfile.merchantName}
          merchantProfileId={merchantProfileId}
          paymentMethods={merchantProfile.merchantPaymentMethods ?? []}
          onPressClose={() => {
            setShouldShowTopbar(true);
            closeModal();
            Router.push("AccountMerchantsProfilePaymentsList", {
              accountMembershipId,
              merchantProfileId,
              new: undefined,
            });
          }}
          accountMembershipId={accountMembershipId}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={params.check === "declare"}>
        <CheckDeclarationWizard merchantProfileId={merchantProfile.id} params={params} />
      </FullViewportLayer>
    </>
  );
};
