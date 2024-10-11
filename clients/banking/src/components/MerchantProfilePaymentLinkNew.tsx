import { Array, Option } from "@swan-io/boxed";
import { Accordion } from "@swan-io/lake/src/components/Accordion";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
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
  spacings,
} from "@swan-io/lake/src/constants/design";
import { identity } from "@swan-io/lake/src/utils/function";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantPaymentMethod, MerchantPaymentMethodType } from "../graphql/partner";
import { t } from "../utils/i18n";

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
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
  tile: { paddingHorizontal: 0, paddingVertical: 0 },
  optionsDesktop: { padding: spacings[32], width: "350px" },
  optionsMobile: { padding: spacings[32] },
  accordion: { padding: 0 },
  preview: {
    width: "60%",
    backgroundColor: backgroundColor.default,
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

type Props = {
  paymentMethods: Pick<MerchantPaymentMethod, "id" | "statusInfo" | "updatedAt" | "type">[];
  onPressClose: () => void;
};

export const MerchantProfilePaymentLinkNew = ({ paymentMethods, onPressClose }: Props) => {
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
  const selectablePaymentMethods = Array.filterMap(
    [cardPaymentMethod, sepaDirectDebitPaymentMethod],
    identity,
  );

  const [hasCancelRedirectUrl, setHasCancelRedirectUrl] = useState(false);

  const { Field } = useForm<{
    label: string;
    amount: string;
    paymentMethodIds: string[];
    cancelRedirectUrl: string;
    customerName: string;
    customerIban: string;
    redirectUrl: string;
  }>({
    label: {
      initialValue: "",
    },
    amount: {
      initialValue: "",
    },
    paymentMethodIds: {
      initialValue: [],
    },
    cancelRedirectUrl: {
      initialValue: "",
    },
    customerName: {
      initialValue: "",
    },
    customerIban: {
      initialValue: "",
    },
    redirectUrl: {
      initialValue: "",
    },
  });
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
              <Box direction="row" style={{}}>
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
                        label={t("merchantProfile.paymentLink.new.price")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            value={value}
                            unit="EUR"
                            onChangeText={onChange}
                            error={error}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <LakeText color={colors.gray[700]} variant="semibold">
                    {t("merchantProfile.paymentLink.new.paymentMethods.title")}
                  </LakeText>

                  <LakeText>
                    {t("merchantProfile.paymentLink.new.paymentMethods.subtitle")}
                  </LakeText>

                  <Space height={24} />

                  <Field name="paymentMethodIds">
                    {({ value, onChange }) => (
                      <>
                        {selectablePaymentMethods.map(paymentMethod => (
                          <LakeLabelledCheckbox
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
                      </>
                    )}
                  </Field>

                  <Space height={24} />

                  <Accordion
                    style={styles.accordion}
                    trigger={t("merchantProfile.paymentLink.new.advancedOptions")}
                    contentContainerStyle={styles.accordion}
                  >
                    <Space height={12} />

                    <LakeLabelledCheckbox
                      label={t("merchantProfile.paymentLink.new.customCancelUrl")}
                      value={hasCancelRedirectUrl}
                      onValueChange={val => setHasCancelRedirectUrl(val)}
                    />

                    <Space height={12} />

                    <Field name="cancelRedirectUrl">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label=""
                          render={id => (
                            <LakeTextInput
                              placeholder={t("merchantProfile.paymentLink.new.customCancelUrl")}
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

                {large && <Box style={styles.preview}></Box>}
              </Box>
            </Tile>
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
