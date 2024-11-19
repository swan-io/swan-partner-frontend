import { Array, Future, Option, Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import {
  colors,
  fonts,
  negativeSpacings,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  MerchantPaymentMethodFragment,
  MerchantPaymentMethodStatus,
  MerchantProfileFragment,
  RequestMerchantPaymentMethodsDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { formatNestedMessage, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { useTgglFlag } from "../utils/tggl";
import { CheckDeclarationWizard } from "./CheckDeclarationWizard";
import {
  MerchantProfilePaymentMethodCardRequestModal,
  MerchantProfilePaymentMethodCheckRequestModal,
  MerchantProfilePaymentMethodInternalDirectDebitB2BRequestModal,
  MerchantProfilePaymentMethodInternalDirectDebitStandardRequestModal,
  MerchantProfilePaymentMethodSepaDirectDebitB2BRequestModal,
  MerchantProfilePaymentMethodSepaDirectDebitCoreRequestModal,
  MerchantProfilePaymentMethodSepaDirectDebitUpdateModal,
} from "./MerchantProfilePaymentMethodModals";
import { MerchantProfileSettingsEditor } from "./MerchantProfileSettingsEditor";
import { SepaLogo } from "./SepaLogo";

const ONE = 1;
const ZERO = 0;

const styles = StyleSheet.create({
  content: {
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingTop: spacings[4],
  },
  contentDesktop: {
    paddingHorizontal: spacings[40],
    paddingTop: spacings[16],
  },
  merchantNameContainer: {
    flex: 1,
    transition: "300ms ease-in-out opacity",
  },
  merchantNameItem: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  unknownValue: {
    fontStyle: "italic",
  },
  accentColorPreviewCircle: {
    width: 16,
    height: 16,
    borderRadius: radii[8],
  },
  swanLogo: {
    height: 24,
  },
  sepaLogo: {
    paddingVertical: 8,
  },
  modalContents: {
    zIndex: -1,
    marginTop: negativeSpacings[48],
  },
  swanLogoLarge: {
    width: 80,
    height: "auto",
    marginVertical: spacings[12],
  },
  methodTileTopRow: {
    height: spacings[48],
    marginTop: negativeSpacings[16],
    marginRight: negativeSpacings[16],
  },
  stepDot: {
    backgroundColor: colors.current[50],
    borderWidth: 1,
    borderColor: colors.current[100],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  stepDotText: {
    fontFamily: fonts.primary,
    color: colors.current[500],
    textAlign: "center",
    fontSize: 14,
    lineHeight: 24,
  },
});

const UNKNOWN_VALUE = <LakeText style={styles.unknownValue}>{t("common.unknown")}</LakeText>;

const Step = ({ number, children }: { number: number; children: ReactNode }) => (
  <Box direction="row">
    <View style={styles.stepDot}>
      <Text style={styles.stepDotText}>{number}</Text>
    </View>

    <Space width={16} />
    <LakeText>{children}</LakeText>
  </Box>
);

const MerchantProfileSettingsPaymentMethodTile = ({
  title,
  description,
  rollingReserve,
  icon,
  iconLarge,
  status,
  renderRequestEditor,
  renderUpdateEditor,
  onDisable,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  iconLarge: ReactNode;
  rollingReserve: Option<{ percentage: number; rollingDays: number }>;
  status?: MerchantPaymentMethodStatus;
  renderRequestEditor: (config: { visible: boolean; onPressClose: () => void }) => ReactNode;
  renderUpdateEditor?: (config: { visible: boolean; onPressClose: () => void }) => ReactNode;
  onDisable: () => Future<Result<unknown, unknown>>;
}) => {
  const [isRequestEditorOpen, setIsRequestEditorOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdateEditorOpen, setIsUpdateEditorOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const onConfirmDisable = () => {
    setIsDisabling(true);
    onDisable()
      .tap(() => {
        setIsDisabling(false);
      })
      .tapOk(() => {
        setIsDisableModalOpen(false);
      });
  };

  return (
    <>
      <Tile selected={status === "PendingReview" || status === "Enabled"} flexGrow={1}>
        <Box direction="row" alignItems="center" style={styles.methodTileTopRow}>
          {icon}

          <Space width={8} />

          {match(status)
            .with("Disabled", () => (
              <Tag color="gray">{t("merchantProfile.settings.paymentMethods.status.Disabled")}</Tag>
            ))
            .with("Enabled", () => (
              <Tag color="positive">
                {t("merchantProfile.settings.paymentMethods.status.Enabled")}
              </Tag>
            ))
            .with("PendingReview", () => (
              <Tag color="shakespear">
                {t("merchantProfile.settings.paymentMethods.status.PendingReview")}
              </Tag>
            ))
            .with("Rejected", () => (
              <Tag color="negative">
                {t("merchantProfile.settings.paymentMethods.status.Rejected")}
              </Tag>
            ))
            .with("Suspended", () => (
              <Tag color="warning">
                {t("merchantProfile.settings.paymentMethods.status.Suspended")}
              </Tag>
            ))
            .with(P.nullish, () => null)
            .exhaustive()}

          <Fill minWidth={8} />

          {match(status)
            .with(P.nonNullable, () => (
              <LakeButton
                mode="tertiary"
                color="gray"
                icon="info-regular"
                ariaLabel={t("common.details")}
                onPress={() => setIsDetailsModalOpen(true)}
              />
            ))
            .otherwise(() => null)}

          {/*
          Commenting for now, as the mutation doesn't work with a user token yet

          match({ status, renderUpdateEditor })
            .with({ status: "Enabled", renderUpdateEditor: P.nonNullable }, () => (
              <LakeButton
                mode="tertiary"
                color="gray"
                icon="edit-regular"
                ariaLabel={t("common.edit")}
                onPress={() => setIsUpdateEditorOpen(true)}
              />
            ))
            .otherwise(() => null) */}

          {match(status)
            .with(P.nullish, "Disabled", "Rejected", () => (
              <LakeButton
                mode="tertiary"
                color="gray"
                icon="add-circle-regular"
                ariaLabel={t("common.new")}
                onPress={() => setIsRequestEditorOpen(true)}
              />
            ))
            .with("Enabled", "PendingReview", () => (
              <LakeButton
                mode="tertiary"
                color="negative"
                icon="subtract-circle-regular"
                ariaLabel={t("common.disable")}
                onPress={() => setIsDisableModalOpen(true)}
              />
            ))
            .otherwise(() => null)}
        </Box>

        <Space height={4} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {title}
        </LakeText>

        <Space height={4} />
        <LakeText color={colors.gray[500]}>{description}</LakeText>
      </Tile>

      {renderUpdateEditor?.({
        visible: isUpdateEditorOpen,
        onPressClose: () => setIsUpdateEditorOpen(false),
      })}

      {renderRequestEditor({
        visible: isRequestEditorOpen,
        onPressClose: () => setIsRequestEditorOpen(false),
      })}

      <LakeModal
        visible={isDisableModalOpen}
        icon="subtract-circle-regular"
        color="negative"
        title={t("merchantProfile.settings.paymentMethods.disable.title")}
      >
        <LakeText color={colors.gray[600]}>
          {t("merchantProfile.settings.paymentMethods.disable.description")}
        </LakeText>

        <Space height={16} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton grow={true} mode="secondary" onPress={() => setIsDisableModalOpen(false)}>
            {t("common.cancel")}
          </LakeButton>

          <LakeButton
            color="negative"
            mode="primary"
            grow={true}
            onPress={onConfirmDisable}
            loading={isDisabling}
          >
            {t("merchantProfile.settings.paymentMethods.disable.confirm")}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>

      <LakeModal visible={isDetailsModalOpen} onPressClose={() => setIsDetailsModalOpen(false)}>
        <View style={styles.modalContents}>
          {iconLarge}

          <Space height={12} />

          <LakeText variant="medium" color={colors.gray[900]}>
            {title}
          </LakeText>

          <LakeText color={colors.gray[600]}>{description}</LakeText>
          <Space height={24} />

          {match(status)
            .with("Disabled", () => (
              <>
                <LakeAlert
                  variant="neutral"
                  title={t("merchantProfile.settings.details.Disabled")}
                />

                <Space height={24} />
              </>
            ))
            .with("PendingReview", () => (
              <>
                <LakeAlert
                  variant="info"
                  title={t("merchantProfile.settings.details.PendingReview")}
                />

                <Space height={24} />
              </>
            ))
            .with("Rejected", () => (
              <>
                <LakeAlert variant="error" title={t("merchantProfile.settings.details.Rejected")} />
                <Space height={24} />
              </>
            ))
            .with("Suspended", () => (
              <>
                <LakeAlert
                  variant="error"
                  title={t("merchantProfile.settings.details.Suspended")}
                />

                <Space height={24} />
              </>
            ))
            .with("Enabled", () => (
              <LakeLabel
                label={t("merchantProfile.settings.rollingReserve")}
                type="view"
                color="gray"
                render={() => {
                  return (
                    <>
                      <LakeText color={colors.gray[900]}>
                        {t("merchantProfile.settings.rollingReserve.value", {
                          percentage: String(rollingReserve.map(item => item.percentage).getOr(0)),
                          rollingDays: String(
                            rollingReserve.map(item => item.rollingDays).getOr(0),
                          ),
                        })}
                      </LakeText>

                      <Space height={8} />

                      <LakeText color={colors.gray[600]} variant="smallRegular">
                        {t("merchantProfile.settings.rollingReserve.description")}
                      </LakeText>
                    </>
                  );
                }}
              />
            ))
            .otherwise(() => null)}
        </View>
      </LakeModal>
    </>
  );
};

// We use a `Option<Option<PaymentMethod>>` structure to reprensent the possible states:
// - Some(Some(paymentMethod)) shows a payment method that exists
// - Some(None) shows no payment method, but the right to create one
// - None shows that this type of payment method is not allowed
const getPaymentMethod = <T extends MerchantPaymentMethodFragment["__typename"]>({
  merchantPaymentMethods,
  isRequestable,
  type,
}: {
  merchantPaymentMethods: MerchantPaymentMethodFragment[];
  isRequestable: boolean;
  type: T;
}): Option<Option<MerchantPaymentMethodFragment & { __typename: T }>> => {
  const paymentMethod = Array.findMap(
    merchantPaymentMethods.toSorted((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      return bDate < aDate ? -1 : 1;
    }),
    paymentMethod =>
      match(paymentMethod)
        .with({ __typename: type }, () =>
          Option.Some(paymentMethod as MerchantPaymentMethodFragment & { __typename: T }),
        )
        .otherwise(() => Option.None()),
  );

  return match({
    isRequestable,
    paymentMethod,
  })
    .with({ paymentMethod: Option.P.Some(P.select()) }, paymentMethod =>
      Option.Some(Option.Some(paymentMethod)),
    )
    .with({ isRequestable: true }, () => Option.Some(Option.None()))
    .otherwise(() => Option.None());
};

type Props = {
  merchantProfile: MerchantProfileFragment;
  large: boolean;
  params: GetRouteParams<"AccountMerchantsProfileSettings">;
  onUpdate: () => void;
};

export const MerchantProfileSettings = ({ merchantProfile, large, params, onUpdate }: Props) => {
  const checkDeclarationEnabled = useTgglFlag("checks").getOr(false);

  const [requestMerchantPaymentMethods] = useMutation(RequestMerchantPaymentMethodsDocument);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isImageLoaded, setIsImageLoaded] = useState(
    merchantProfile.merchantLogoUrl == null ? true : false,
  );
  const [hasImageErrored, setHasImageErrored] = useState(false);

  const merchantPaymentMethods = merchantProfile.merchantPaymentMethods ?? [];

  const permissions = usePermissions();

  const hasAnyPaymentMethod =
    permissions.canRequestMerchantOnlineCardsPaymentMethod ||
    permissions.canRequestMerchantSepaDirectDebitCorePaymentMethod ||
    permissions.canRequestMerchantSepaDirectDebitB2BPaymentMethod ||
    permissions.canRequestMerchantInternalDirectDebitB2BPaymentMethod ||
    permissions.canRequestMerchantInternalDirectDebitB2BPaymentMethod ||
    permissions.canRequestMerchantChecksPaymentMethod ||
    merchantPaymentMethods.length > 0;

  const cardPaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantOnlineCardsPaymentMethod,
    type: "CardMerchantPaymentMethod",
  });

  const internalDirectDebitB2BPaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantInternalDirectDebitB2BPaymentMethod,
    type: "InternalDirectDebitB2BMerchantPaymentMethod",
  });

  const internalDirectDebitStandardPaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantInternalDirectDebitCorePaymentMethod,
    type: "InternalDirectDebitStandardMerchantPaymentMethod",
  });

  const sepaDirectDebitB2BPaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantSepaDirectDebitB2BPaymentMethod,
    type: "SepaDirectDebitB2BMerchantPaymentMethod",
  });

  const sepaDirectDebitCorePaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantSepaDirectDebitCorePaymentMethod,
    type: "SepaDirectDebitCoreMerchantPaymentMethod",
  });

  const checkPaymentMethod = getPaymentMethod({
    merchantPaymentMethods,
    isRequestable: permissions.canRequestMerchantChecksPaymentMethod,
    type: "CheckMerchantPaymentMethod",
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, large && styles.contentDesktop]}>
      {checkDeclarationEnabled &&
      permissions.canDeclareChecks &&
      checkPaymentMethod
        .flatMap(identity)
        .map(check => check.statusInfo.status === "Enabled")
        .getOr(false) ? (
        <>
          <Box direction="row" alignItems="center">
            <LakeButton
              icon="check-regular"
              size="small"
              color="current"
              onPress={() => {
                Router.push("AccountMerchantsProfileSettings", {
                  ...params,
                  check: "declare",
                });
              }}
            >
              {t("merchantProfile.declareCheckButton")}
            </LakeButton>
          </Box>

          <Space height={32} />
        </>
      ) : null}

      <LakeHeading level={2} variant="h4">
        {t("merchantProfile.settings.information.title")}
      </LakeHeading>

      <Space height={24} />

      <Tile
        footer={match(merchantProfile)
          .with({ statusInfo: { status: "Rejected" } }, () => (
            <LakeAlert
              anchored={true}
              variant="error"
              title={t("merchantProfile.status.rejected.description")}
            />
          ))
          .with({ statusInfo: { status: "Suspended" } }, () => (
            <LakeAlert
              anchored={true}
              variant="warning"
              title={t("merchantProfile.status.suspended.description")}
            />
          ))
          .with({ statusInfo: { status: "Disabled" } }, () => (
            <LakeAlert
              anchored={true}
              variant="neutral"
              title={t("merchantProfile.status.disabled.description")}
            />
          ))
          .with({ statusInfo: { status: "PendingReview" } }, () => (
            <LakeAlert
              anchored={true}
              variant="info"
              title={t("merchantProfile.status.pendingReview.description")}
            />
          ))
          .with({ requestMerchantProfileUpdate: P.nonNullable }, () => (
            <LakeAlert
              anchored={true}
              variant="info"
              title={t("merchantProfile.status.pendingUpdateReview.description")}
            />
          ))
          .otherwise(() => null)}
      >
        <Box direction="row">
          <Box
            direction="row"
            style={[styles.merchantNameContainer, { opacity: isImageLoaded ? ONE : ZERO }]}
            alignItems="center"
          >
            {isNotNullish(merchantProfile.merchantLogoUrl) && !hasImageErrored ? (
              <AutoWidthImage
                height={50}
                sourceUri={merchantProfile.merchantLogoUrl}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setHasImageErrored(true)}
              />
            ) : (
              <LakeHeading variant="h3" level={3} style={styles.merchantNameItem}>
                {merchantProfile.merchantName}
              </LakeHeading>
            )}

            <Space width={24} />

            {match(merchantProfile.statusInfo.status)
              .with("Disabled", () => (
                <Tag color="gray">{t("merchantProfile.status.disabled")}</Tag>
              ))
              .with("Enabled", () => (
                <Tag color="positive">{t("merchantProfile.status.enabled")}</Tag>
              ))
              .with("PendingReview", () => (
                <Tag color="shakespear">{t("merchantProfile.status.pendingReview")}</Tag>
              ))
              .with("Rejected", () => (
                <Tag color="negative">{t("merchantProfile.status.rejected")}</Tag>
              ))
              .with("Suspended", () => (
                <Tag color="warning">{t("merchantProfile.status.suspended")}</Tag>
              ))
              .otherwise(() => null)}
          </Box>

          {/*
          Let's hide the button for now, and we'll add it back
          when the simulator API to validate an edit is available.

          <Fill minWidth={32} />

          <Box direction="row" alignItems="center">
            {match(merchantProfile.statusInfo.status)
              .with("Enabled", "PendingReview", () => (
                <LakeButton
                  mode="tertiary"
                  color="gray"
                  icon="edit-regular"
                  ariaLabel={t("common.edit")}
                  onPress={() => setIsEditModalOpen(true)}
                />
              ))
              .otherwise(() => null)}
          </Box> */}
        </Box>

        <Space height={24} />

        <Grid numColumns={large ? 2 : 1} horizontalSpace={40}>
          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.merchantName.label")}
              render={() => (
                <LakeText color={colors.gray[900]}>{merchantProfile.merchantName}</LakeText>
              )}
            />

            <Separator horizontal={false} space={8} />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.id")}
              render={() => (
                <Box direction="row" alignItems="center" justifyContent="spaceBetween">
                  <LakeText color={colors.gray[900]}>{merchantProfile.id}</LakeText>

                  <LakeCopyButton
                    copyText={t("copyButton.copyTooltip")}
                    copiedText={t("copyButton.copiedTooltip")}
                    valueToCopy={merchantProfile.id}
                    color={colors.gray[900]}
                  />
                </Box>
              )}
            />

            <Separator horizontal={false} space={8} />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.productType.label")}
              render={() =>
                match(merchantProfile.productType)
                  .with("GiftsAndDonations", () => (
                    <LakeText color={colors.gray[900]}>
                      {t("merchantProfile.request.productType.GiftsAndDonations")}
                    </LakeText>
                  ))
                  .with("Goods", () => (
                    <LakeText color={colors.gray[900]}>
                      {t("merchantProfile.request.productType.Goods")}
                    </LakeText>
                  ))
                  .with("Services", () => (
                    <LakeText color={colors.gray[900]}>
                      {t("merchantProfile.request.productType.Services")}
                    </LakeText>
                  ))
                  .with("VirtualGoods", () => (
                    <LakeText color={colors.gray[900]}>
                      {t("merchantProfile.request.productType.VirtualGoods")}
                    </LakeText>
                  ))
                  .exhaustive()
              }
            />

            <Separator horizontal={false} space={8} />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.expectedMonthlyPaymentVolume.label")}
              render={() => (
                <LakeText color={colors.gray[900]}>
                  {`${merchantProfile.expectedMonthlyPaymentVolume.value} ${merchantProfile.expectedMonthlyPaymentVolume.currency}`}
                </LakeText>
              )}
            />

            <Separator horizontal={false} space={8} />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.expectedAverageBasket.label")}
              render={() => (
                <LakeText color={colors.gray[900]}>
                  {`${merchantProfile.expectedAverageBasket.value} ${merchantProfile.expectedAverageBasket.currency}`}
                </LakeText>
              )}
            />

            <Separator horizontal={false} space={8} />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.merchantWebsite.label")}
              render={() =>
                merchantProfile.merchantWebsite == null ? (
                  UNKNOWN_VALUE
                ) : (
                  <LakeText color={colors.gray[900]}>{merchantProfile.merchantWebsite}</LakeText>
                )
              }
            />
          </Box>

          <Box>
            <LakeLabel
              type="view"
              color="gray"
              label={t("merchantProfile.request.accentColor.label")}
              render={() =>
                merchantProfile.accentColor == null ? (
                  UNKNOWN_VALUE
                ) : (
                  <LakeText color={colors.gray[900]}>
                    <View
                      style={[
                        styles.accentColorPreviewCircle,
                        { backgroundColor: merchantProfile.accentColor },
                      ]}
                    />

                    <Space width={8} />

                    {merchantProfile.accentColor}
                  </LakeText>
                )
              }
            />
          </Box>
        </Grid>
      </Tile>

      {hasAnyPaymentMethod ? (
        <>
          <Space height={24} />

          <LakeHeading level={2} variant="h4">
            {t("merchantProfile.settings.paymentMethods.title")}
          </LakeHeading>

          <Space height={24} />

          <Grid numColumns={large ? 3 : 1} horizontalSpace={24} verticalSpace={24}>
            {match(cardPaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t("merchantProfile.settings.paymentMethods.card.title")}
                  description={t("merchantProfile.settings.paymentMethods.card.description")}
                  icon={<Icon name="payment-regular" color={colors.gray[900]} size={24} />}
                  iconLarge={<Icon name="payment-regular" color={colors.gray[900]} size={42} />}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodCardRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: { merchantProfileId: merchantProfile.id, card: { activate: false } },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}

            {match(internalDirectDebitB2BPaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t("merchantProfile.settings.paymentMethods.internalDirectDebitB2B.title")}
                  description={t(
                    "merchantProfile.settings.paymentMethods.internalDirectDebitB2B.description",
                  )}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  icon={<SwanLogo style={styles.swanLogo} />}
                  iconLarge={<SwanLogo style={styles.swanLogoLarge} />}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodInternalDirectDebitB2BRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: {
                        merchantProfileId: merchantProfile.id,
                        internalDirectDebitB2B: { activate: false },
                      },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}

            {match(internalDirectDebitStandardPaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t(
                    "merchantProfile.settings.paymentMethods.internalDirectDebitStandard.title",
                  )}
                  description={t(
                    "merchantProfile.settings.paymentMethods.internalDirectDebitStandard.description",
                  )}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  icon={<SwanLogo style={styles.swanLogo} />}
                  iconLarge={<SwanLogo style={styles.swanLogoLarge} />}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodInternalDirectDebitStandardRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: {
                        merchantProfileId: merchantProfile.id,
                        internalDirectDebitStandard: { activate: false },
                      },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}

            {match(sepaDirectDebitB2BPaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t("merchantProfile.settings.paymentMethods.sepaDirectDebitB2B.title")}
                  description={t(
                    "merchantProfile.settings.paymentMethods.sepaDirectDebitB2B.description",
                  )}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  icon={
                    <View style={styles.sepaLogo}>
                      <SepaLogo height={16} />
                    </View>
                  }
                  iconLarge={<SepaLogo height={24} />}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodSepaDirectDebitB2BRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  renderUpdateEditor={paymentMethod
                    .map(
                      paymentMethod =>
                        ({
                          visible,
                          onPressClose,
                        }: {
                          visible: boolean;
                          onPressClose: () => void;
                        }) => (
                          <MerchantProfilePaymentMethodSepaDirectDebitUpdateModal
                            paymentMethodId={paymentMethod.id}
                            visible={visible}
                            onPressClose={onPressClose}
                            onSuccess={() => {
                              onUpdate();
                            }}
                            initialValues={{
                              useSwanSepaCreditorIdentifier:
                                paymentMethod.useSwanSepaCreditorIdentifier,
                              sepaCreditorIdentifier:
                                paymentMethod.sepaCreditorIdentifier ?? undefined,
                            }}
                          />
                        ),
                    )
                    .toUndefined()}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: {
                        merchantProfileId: merchantProfile.id,
                        sepaDirectDebitB2B: { activate: false },
                      },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}

            {match(sepaDirectDebitCorePaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t("merchantProfile.settings.paymentMethods.sepaDirectDebitCore.title")}
                  description={t(
                    "merchantProfile.settings.paymentMethods.sepaDirectDebitCore.description",
                  )}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  icon={
                    <View style={styles.sepaLogo}>
                      <SepaLogo height={16} />
                    </View>
                  }
                  iconLarge={<SepaLogo height={24} />}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodSepaDirectDebitCoreRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  renderUpdateEditor={paymentMethod
                    .map(
                      paymentMethod =>
                        ({
                          visible,
                          onPressClose,
                        }: {
                          visible: boolean;
                          onPressClose: () => void;
                        }) => (
                          <MerchantProfilePaymentMethodSepaDirectDebitUpdateModal
                            paymentMethodId={paymentMethod.id}
                            visible={visible}
                            onPressClose={onPressClose}
                            onSuccess={() => {
                              onUpdate();
                            }}
                            initialValues={{
                              useSwanSepaCreditorIdentifier:
                                paymentMethod.useSwanSepaCreditorIdentifier,
                              sepaCreditorIdentifier:
                                paymentMethod.sepaCreditorIdentifier ?? undefined,
                            }}
                          />
                        ),
                    )
                    .toUndefined()}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: {
                        merchantProfileId: merchantProfile.id,
                        sepaDirectDebitCore: { activate: false },
                      },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}

            {match(checkPaymentMethod)
              .with(Option.P.Some(P.select()), paymentMethod => (
                <MerchantProfileSettingsPaymentMethodTile
                  title={t("merchantProfile.settings.paymentMethods.check.title")}
                  description={t("merchantProfile.settings.paymentMethods.check.description")}
                  rollingReserve={paymentMethod.flatMap(paymentMethod =>
                    Option.fromNullable(paymentMethod.rollingReserve),
                  )}
                  icon={<Icon name="check-regular" color={colors.gray[900]} size={24} />}
                  iconLarge={<Icon name="check-regular" color={colors.gray[900]} size={42} />}
                  status={paymentMethod
                    .map(paymentMethod => paymentMethod.statusInfo.status)
                    .toUndefined()}
                  renderRequestEditor={({ visible, onPressClose }) => (
                    <MerchantProfilePaymentMethodCheckRequestModal
                      merchantProfileId={merchantProfile.id}
                      visible={visible}
                      onPressClose={onPressClose}
                      onSuccess={() => {
                        onUpdate();
                        onPressClose();
                      }}
                    />
                  )}
                  onDisable={() =>
                    requestMerchantPaymentMethods({
                      input: { merchantProfileId: merchantProfile.id, check: { activate: false } },
                    })
                      .mapOkToResult(data =>
                        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
                      )
                      .mapOkToResult(filterRejectionsToResult)
                      .tapOk(() => onUpdate())
                      .tapError(error => {
                        showToast({ variant: "error", title: translateError(error), error });
                      })
                  }
                />
              ))
              .otherwise(() => null)}
          </Grid>

          <Space height={24} />
        </>
      ) : null}

      <LakeModal
        visible={isEditModalOpen}
        icon="edit-regular"
        title={t("merchantProfile.settings.update.title")}
        maxWidth={850}
      >
        <MerchantProfileSettingsEditor
          merchantProfile={merchantProfile}
          onSuccess={() => {
            onUpdate();
            setIsEditModalOpen(false);
          }}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </LakeModal>

      <LakeModal
        visible={params.check === "next"}
        maxWidth={750}
        icon="check-regular"
        title={t("check.next.title")}
      >
        <LakeText>{t("check.next.description.intro")}</LakeText>
        <Space height={24} />
        <Step number={1}>{t("check.next.description.step1")}</Step>
        <Space height={16} />

        <Step number={2}>
          {formatNestedMessage("check.next.description.step2", {
            colored: text => (
              <LakeText variant="smallMedium" color={colors.current[500]}>
                {text}
              </LakeText>
            ),
          })}
        </Step>

        <Space height={40} />

        <LakeButton
          color="current"
          onPress={() => {
            Router.push("AccountMerchantsProfileSettings", {
              ...params,
              check: undefined,
            });
          }}
        >
          {t("check.next.button")}
        </LakeButton>
      </LakeModal>

      <FullViewportLayer visible={params.check === "declare"}>
        <CheckDeclarationWizard merchantProfileId={merchantProfile.id} params={params} />
      </FullViewportLayer>
    </ScrollView>
  );
};
