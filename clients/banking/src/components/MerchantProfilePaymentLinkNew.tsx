import { Array, Dict, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Accordion } from "@swan-io/lake/src/components/Accordion";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  animations,
  backgroundColor,
  breakpoints,
  colors,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import {
  isNotNullish,
  isNotNullishOrEmpty,
  nullishOrEmptyToUndefined,
} from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { combineValidators, toOptionalValidator, useForm } from "@swan-io/use-form";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  CreatePaymentLinkDocument,
  MerchantPaymentMethod,
  MerchantPaymentMethodType,
  PaymentLinkConnectionFragment,
} from "../graphql/partner";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  validateArrayRequired,
  validateNumeric,
  validateRequired,
  validateUrl,
} from "../utils/validations";

const PREVIEW_CONTAINER_VERTICAL_SPACING = 16;
const PREVIEW_TOP_BAR_HEIGHT = 16;
const IFRAME_ORIGINAL_HEIGHT = 1000;

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  header: {
    paddingVertical: spacings[12],
  },
  headerContents: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 1520,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  title: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    left: 0,
    right: 0,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1520,
    paddingHorizontal: spacings[24],
    paddingTop: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
  tile: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tileContents: { flexGrow: 1 },
  optionsDesktop: {
    padding: spacings[32],
    maxWidth: 350,
  },
  optionsMobile: { padding: spacings[32] },
  accordion: { paddingHorizontal: 0 },
  preview: {
    flexGrow: 1,
    backgroundColor: backgroundColor.default,
  },
  previewContainer: {
    margin: spacings[32],
    marginBottom: 0,
    flexGrow: 1,
  },
  previewFrameContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: radii[8],
    paddingTop: spacings[PREVIEW_TOP_BAR_HEIGHT],
    backgroundColor: colors.gray[100],
    boxShadow: `0 0 0 3px ${colors.gray[100]}`,
    overflow: "hidden",
  },
});

const formatPaymentMethodsName = (paymentMethodType: MerchantPaymentMethodType) => {
  return match(paymentMethodType)
    .with("Card", () => t("merchantProfile.paymentLink.paymentMethod.card"))
    .with(P.union("SepaDirectDebitB2b", "SepaDirectDebitCore"), () =>
      t("merchantProfile.paymentLink.paymentMethod.SepaDirectDebit"),
    )
    .with("Check", () => t("merchantProfile.paymentLink.paymentMethod.checks"))
    .with(P.union("InternalDirectDebitB2b", "InternalDirectDebitStandard"), () =>
      t("merchantProfile.paymentLink.paymentMethod.internalDirectDebit"),
    )
    .exhaustive();
};
const previewItems = [
  {
    id: "desktop",
    name: "",
    icon: <Icon name="laptop-regular" size={24} />,
  },
  {
    id: "mobile",
    name: "",
    icon: <Icon name="phone-regular" size={24} />,
  },
] as const;

const Container = ({
  children,
}: {
  children: (values: { height: number; width: number }) => ReactNode;
}) => {
  const [availableDimensions, setAvailableDiemensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  return (
    <View
      onLayout={event => {
        setAvailableDiemensions({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        });
      }}
      style={commonStyles.fill}
    >
      {availableDimensions != null ? children(availableDimensions) : null}
    </View>
  );
};

type DataPreviewProps = {
  cancelRedirectUrl: string | undefined;
  label: string | undefined;
  amount: string | undefined;
  card: string | undefined;
  sepaDirectDebit: string | undefined;
  paymentMethodIds: string[];
};

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
  accentColor: string | undefined;
  merchantLogoUrl: string | undefined;
  merchantName: string | undefined;
  paymentMethods: Pick<MerchantPaymentMethod, "id" | "statusInfo" | "updatedAt" | "type">[];
  paymentLinks: PaymentLinkConnectionFragment | null | undefined;
  onPressClose: () => void;
};

export const MerchantProfilePaymentLinkNew = ({
  merchantProfileId,
  accountMembershipId,
  paymentLinks,
  paymentMethods,
  accentColor,
  merchantLogoUrl,
  merchantName,
  onPressClose,
}: Props) => {
  const [selectedPreview, setSelectedPreview] = useState<"desktop" | "mobile">("desktop");

  const selectablePaymentMethods = useMemo(() => {
    const cardPaymentMethod = Array.findMap(paymentMethods, paymentMethod =>
      match(paymentMethod)
        .with(
          {
            statusInfo: { status: "Enabled" },
            type: "Card",
          },
          () => Option.Some(paymentMethod),
        )
        .otherwise(() => Option.None()),
    );

    const sepaDirectDebitPaymentMethod = Array.findMap(paymentMethods, paymentMethod =>
      match(paymentMethod)
        .with(
          {
            statusInfo: { status: "Enabled" },
            type: P.union("SepaDirectDebitB2b", "SepaDirectDebitCore"),
          },
          () => Option.Some(paymentMethod),
        )
        .otherwise(() => Option.None()),
    );

    return Array.filterMap([cardPaymentMethod, sepaDirectDebitPaymentMethod], identity);
  }, [paymentMethods]);

  const { Field, submitForm, listenFields } = useForm<{
    label: string;
    amount: string;
    reference: string;
    externalReference: string;
    paymentMethodIds: string[];
    cancelRedirectUrl: string;
    customerName: string;
    customerIban: string;
    redirectUrl: string;
  }>({
    label: {
      initialValue: "",
      sanitize: trim,
      validate: validateRequired,
    },
    amount: {
      initialValue: "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateNumeric({ min: 0 })),
    },
    reference: {
      initialValue: "",
      sanitize: trim,
    },
    externalReference: {
      initialValue: "",
      sanitize: trim,
    },
    paymentMethodIds: {
      initialValue: selectablePaymentMethods.map(paymentMethod => paymentMethod.id),
      validate: validateArrayRequired,
    },
    cancelRedirectUrl: {
      initialValue: "",
      sanitize: trim,
      validate: toOptionalValidator(validateUrl),
    },
    customerName: {
      initialValue: "",
      sanitize: trim,
    },
    customerIban: {
      initialValue: "",
      sanitize: trim,
    },
    redirectUrl: {
      initialValue: "",
      sanitize: trim,
      validate: toOptionalValidator(validateUrl),
    },
  });

  const [createMerchantPaymentLink, merchantPaymentLinkCreation] = useMutation(
    CreatePaymentLinkDocument,
    {
      connectionUpdates: [
        ({ data, prepend }) =>
          match(data.createMerchantPaymentLink)
            .with(
              { __typename: "CreateMerchantPaymentLinkSuccessPayload" },
              ({ merchantPaymentLink }) => {
                return Option.Some(
                  prepend(paymentLinks, [
                    { __typename: "MerchantPaymentLinkEdge", node: merchantPaymentLink },
                  ]),
                );
              },
            )
            .otherwise(() => Option.None()),
      ],
    },
  );

  const [dataPreview, setDataPreview] = useState<DataPreviewProps>({
    cancelRedirectUrl: undefined,
    label: undefined,
    amount: undefined,
    card: undefined,
    sepaDirectDebit: undefined,
    paymentMethodIds: selectablePaymentMethods.map(paymentMethod => paymentMethod.id),
  });

  const updateDataPreview = useDebounce((partialDataPreview: Partial<DataPreviewProps>) => {
    const entries = Dict.entries(partialDataPreview).map(
      ([key, value]) => [key, typeof value === "string" ? value.trim() : value] as const,
    );

    setDataPreview(prevState => ({ ...prevState, ...Dict.fromEntries(entries) }));
  }, 500);

  useEffect(() => {
    listenFields(
      ["amount", "cancelRedirectUrl", "label", "paymentMethodIds"],
      ({ amount, cancelRedirectUrl, label, paymentMethodIds }) => {
        updateDataPreview({
          amount: amount.value,
          cancelRedirectUrl: cancelRedirectUrl.value,
          label: label.value,
          paymentMethodIds: paymentMethodIds.value,
        });
      },
    );
  }, [listenFields, updateDataPreview]);

  const previewUrl = useMemo(() => {
    const { amount, cancelRedirectUrl, label, paymentMethodIds } = dataPreview;

    const url = new URL(env.PAYMENT_URL);
    url.pathname = "/preview";

    if (accentColor != null) {
      url.searchParams.append("accentColor", accentColor);
    }
    if (merchantLogoUrl != null) {
      url.searchParams.append("logo", merchantLogoUrl);
    }
    if (merchantName != null) {
      url.searchParams.append("merchantName", merchantName);
    }
    if (cancelRedirectUrl != null) {
      url.searchParams.append("cancelUrl", cancelRedirectUrl);
    }
    if (isNotNullishOrEmpty(label)) {
      url.searchParams.append("label", label);
    }
    if (isNotNullishOrEmpty(amount) && !isNaN(Number(amount))) {
      url.searchParams.append("amount", amount);
    }

    url.searchParams.append("currency", "EUR");

    paymentMethodIds.forEach(paymentMethodId => {
      const paymentMethod = selectablePaymentMethods.find(item => item.id === paymentMethodId);

      if (paymentMethod == null) {
        return;
      }

      if (paymentMethod.type === "Card") {
        url.searchParams.append("card", "true");
      }
      if (
        paymentMethod.type === "SepaDirectDebitB2b" ||
        paymentMethod.type === "SepaDirectDebitCore"
      ) {
        url.searchParams.append("sepaDirectDebit", "true");
      }
    });

    return url.toString();
  }, [accentColor, dataPreview, merchantLogoUrl, merchantName, selectablePaymentMethods]);

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isSome()) {
          const { label, amount, paymentMethodIds } = option.get();

          return createMerchantPaymentLink({
            input: {
              merchantProfileId,
              label,
              amount: {
                value: amount,
                currency: "EUR",
              },
              paymentMethodIds,
              customer: {
                name: values.customerName
                  .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
                  .toUndefined(),
                iban: values.customerIban
                  .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
                  .toUndefined(),
              },
              redirectUrl: values.redirectUrl
                .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
                .toUndefined(),
              cancelRedirectUrl: values.cancelRedirectUrl
                .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
                .toUndefined(),
            },
          })
            .mapOk(data => data.createMerchantPaymentLink)
            .mapOkToResult(filterRejectionsToResult)
            .tapError(error => showToast({ variant: "error", title: translateError(error), error }))
            .tapOk(({ merchantPaymentLink }) => {
              Router.replace("AccountMerchantsProfilePaymentLinkDetails", {
                accountMembershipId,
                merchantProfileId,
                paymentLinkId: merchantPaymentLink.id,
              });
            });
        }
      },
    });
  };

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null && (
                <>
                  <LakeButton
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                    ariaLabel={t("common.closeButton")}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              )}

              <View style={styles.headerTitle}>
                <View style={styles.title}>
                  <TransitionView {...animations.fadeAndSlideInFromRight}>
                    <LakeHeading level={2} variant="h3">
                      {t("merchantProfile.paymentLink.button.new")}
                    </LakeHeading>
                  </TransitionView>
                </View>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.contents, large && styles.desktopContents]}
          >
            <Tile style={styles.tile}>
              <Box
                direction={large ? "row" : "column"}
                style={styles.tileContents}
                alignItems="stretch"
              >
                <Box style={large ? styles.optionsDesktop : styles.optionsMobile}>
                  <Field name="label">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("merchantProfile.paymentLink.new.customLabel")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            value={value}
                            onChangeText={onChange}
                            error={error}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <Field name="amount">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("merchantProfile.paymentLink.new.amount")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            value={value.replace(",", ".")}
                            unit="EUR"
                            onChangeText={onChange}
                            error={error}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <Field name="reference">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("merchantProfile.paymentLink.new.reference")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            value={value}
                            onChangeText={onChange}
                            error={error}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <Field name="externalReference">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("merchantProfile.paymentLink.new.externalReference")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            value={value}
                            onChangeText={onChange}
                            error={error}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <Accordion
                    style={styles.accordion}
                    contentContainerStyle={styles.accordion}
                    trigger={
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {t("merchantProfile.paymentLink.new.paymentMethods")}
                      </LakeText>
                    }
                  >
                    <Field name="paymentMethodIds">
                      {({ value, onChange, error }) => (
                        <>
                          {selectablePaymentMethods.map(paymentMethod => (
                            <LakeLabelledCheckbox
                              isError={isNotNullish(error)}
                              key={paymentMethod.id}
                              label={formatPaymentMethodsName(paymentMethod.type)}
                              value={value.includes(paymentMethod.id)}
                              onValueChange={isChecked => {
                                onChange(
                                  isChecked
                                    ? [...value, paymentMethod.id]
                                    : value.filter(
                                        paymentMethodId => paymentMethodId !== paymentMethod.id,
                                      ),
                                );
                              }}
                            />
                          ))}

                          {error != null && (
                            <LakeText variant="smallRegular" color={colors.negative[500]}>
                              {error}
                            </LakeText>
                          )}
                        </>
                      )}
                    </Field>
                  </Accordion>

                  <Accordion
                    style={styles.accordion}
                    contentContainerStyle={styles.accordion}
                    trigger={
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {t("merchantProfile.paymentLink.new.customer")}
                      </LakeText>
                    }
                  >
                    <Field name="customerName">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("merchantProfile.paymentLink.new.customerName")}
                          optionalLabel={t("form.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              value={value}
                              onChangeText={onChange}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Field name="customerIban">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("merchantProfile.paymentLink.new.customerIban")}
                          optionalLabel={t("form.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              value={value}
                              onChangeText={onChange}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </Accordion>

                  <Accordion
                    style={styles.accordion}
                    contentContainerStyle={styles.accordion}
                    trigger={
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {t("merchantProfile.paymentLink.new.redirections")}
                      </LakeText>
                    }
                  >
                    <Field name="redirectUrl">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("merchantProfile.paymentLink.new.redirectUrl")}
                          optionalLabel={t("form.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              value={value}
                              onChangeText={onChange}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Field name="cancelRedirectUrl">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("merchantProfile.paymentLink.new.cancelRedirectUrl")}
                          optionalLabel={t("form.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              value={value}
                              onChangeText={onChange}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </Accordion>
                </Box>

                {large && (
                  <Box style={styles.preview}>
                    <Box style={styles.previewContainer}>
                      <SegmentedControl
                        minItemWidth={250}
                        items={previewItems}
                        selected={selectedPreview}
                        onValueChange={id => {
                          setSelectedPreview(id);
                        }}
                      />

                      <Container>
                        {({ width, height }) => {
                          const scaleFactor = Math.min(
                            (height -
                              PREVIEW_CONTAINER_VERTICAL_SPACING * 2 -
                              PREVIEW_TOP_BAR_HEIGHT) /
                              IFRAME_ORIGINAL_HEIGHT,
                            width / (selectedPreview === "desktop" ? 1280 : 440),
                          );

                          return (
                            <View
                              style={[
                                styles.previewFrameContainer,
                                {
                                  height: scaleFactor * IFRAME_ORIGINAL_HEIGHT,
                                  width: scaleFactor * (selectedPreview === "desktop" ? 1280 : 440),
                                },
                              ]}
                            >
                              <iframe
                                tabIndex={-1}
                                src={previewUrl}
                                style={
                                  // eslint-disable-next-line react-native/no-inline-styles
                                  {
                                    backgroundColor: backgroundColor.default,
                                    pointerEvents: "none",
                                    border: "none",
                                    width: selectedPreview === "desktop" ? 1280 : 440,
                                    height: IFRAME_ORIGINAL_HEIGHT,
                                    minHeight: IFRAME_ORIGINAL_HEIGHT,
                                    transformOrigin: "0 0",
                                    transform: `scale(${scaleFactor * 100}%)`,
                                  }
                                }
                              />
                            </View>
                          );
                        }}
                      </Container>
                    </Box>
                  </Box>
                )}
              </Box>
            </Tile>

            <LakeButtonGroup>
              <LakeButton
                color="current"
                icon="add-circle-filled"
                onPress={onPressSubmit}
                loading={merchantPaymentLinkCreation.isLoading()}
              >
                {t("merchantProfile.paymentLink.buttonForm.create")}
              </LakeButton>
            </LakeButtonGroup>
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
