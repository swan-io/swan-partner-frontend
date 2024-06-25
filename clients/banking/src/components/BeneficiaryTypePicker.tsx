import { Box } from "@swan-io/lake/src/components/Box";
import { Breadcrumbs, useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { View } from "react-native";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { useTgglFlag } from "../utils/tggl";

export const BeneficiaryTypePicker = ({ accountMembershipId }: { accountMembershipId: string }) => {
  const ictEnabled = useTgglFlag("initiate_international_credit_transfer_outgoing");

  useCrumb(
    useMemo(
      () => ({
        label: "New beneficiary",
        link: Router.AccountPaymentsBeneficiariesNew({ accountMembershipId }),
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
    <ResponsiveContainer
      breakpoint={breakpoints.large}
      style={{
        ...commonStyles.fill,
      }}
    >
      {({ large }) => (
        <View
          style={[
            {
              ...commonStyles.fill,
              paddingHorizontal: spacings[24],
              paddingTop: spacings[24],
            },
            large && {
              paddingHorizontal: spacings[40],
              paddingTop: spacings[40],
            },
          ]}
        >
          <Breadcrumbs />

          <Stack
            grow={1}
            alignItems="center"
            justifyContent="center"
            space={12}
            style={[
              {
                alignItems: "stretch",
                margin: "auto",
                padding: spacings[24],
              },
              large && {
                padding: spacings[40],
              },
            ]}
          >
            {links.map(({ url, icon, title, subtitle }, index) => (
              <Pressable
                key={index}
                role="button"
                // onPress={() => pushUnsafe(url)}
                style={[
                  {
                    ...animations.fadeAndSlideInFromTop.enter,
                    animationFillMode: "backwards",
                  },
                  {
                    animationDelay: `${index * 150}ms`,
                  },
                ]}
              >
                {({ hovered }) => (
                  // TODO: Extract this and reuse it in TransferTypePicker
                  <Tile hovered={hovered}>
                    <Box direction="row" alignItems="center">
                      <Icon name={icon} size={42} color={colors.current[500]} />
                      <Space width={24} />

                      <View style={{}}>
                        <LakeHeading level={2} variant="h5" color={colors.gray[900]}>
                          {title}
                        </LakeHeading>

                        <LakeText variant="smallRegular">{subtitle}</LakeText>
                      </View>

                      <Fill minWidth={24} />
                      <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
                    </Box>
                  </Tile>
                )}
              </Pressable>
            ))}
          </Stack>
        </View>
      )}
    </ResponsiveContainer>
  );
};
