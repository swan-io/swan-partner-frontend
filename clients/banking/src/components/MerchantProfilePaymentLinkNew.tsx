import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Accordion } from "@swan-io/lake/src/components/Accordion";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
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
  spacings,
} from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  CreatePaymentLinkDocument,
  MerchantPaymentMethod,
  MerchantPaymentMethodType,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { validateArrayRequired, validateRequired } from "../utils/validations";

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
  optionsDesktop: { padding: spacings[32], maxWidth: 350 },
  optionsMobile: { padding: spacings[32] },
  accordion: { paddingHorizontal: 0 },
  preview: {
    flexGrow: 1,
    backgroundColor: backgroundColor.default,
  },
  previewContainer: {
    margin: spacings[32],
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
    id: "1",
    name: "",
    icon: <Icon name="laptop-regular" size={24} />,
  },
  {
    id: "2",
    name: "",
    icon: <Icon name="phone-regular" size={24} />,
  },
];

type Props = {
  merchantProfileId: string;
  accountMembershipId: string;
  paymentMethods: Pick<MerchantPaymentMethod, "id" | "statusInfo" | "updatedAt" | "type">[];
  onPressClose: () => void;
};

export const MerchantProfilePaymentLinkNew = ({
  merchantProfileId,
  accountMembershipId,
  paymentMethods,
  onPressClose,
}: Props) => {
  const [selectedPreview, setSelectedPreview] = useState(previewItems[0]);

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

  const { Field, submitForm } = useForm<{
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
      sanitize: trim,
      validate: validateRequired,
    },
    amount: {
      initialValue: "",
      sanitize: trim,
      validate: validateRequired,
    },
    paymentMethodIds: {
      initialValue: selectablePaymentMethods.map(paymentMethod => paymentMethod.id),
      validate: validateArrayRequired,
    },
    cancelRedirectUrl: {
      initialValue: "",
      sanitize: trim,
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
    },
  });

  const [createMerchantPaymentLink, merchantPaymentLinkCreation] =
    useMutation(CreatePaymentLinkDocument);

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
            .tapOk(() => {
              Router.replace("AccountMerchantsProfilePaymentLinkList", {
                accountMembershipId,
                merchantProfileId,
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
              <Box direction={large ? "row" : "column"}>
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
                            value={value}
                            unit="EUR"
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
                      <LakeHeading level={3} variant="h3">
                        {t("merchantProfile.paymentLink.new.paymentMethods")}
                      </LakeHeading>
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
                        </>
                      )}
                    </Field>
                  </Accordion>

                  <Accordion
                    style={styles.accordion}
                    contentContainerStyle={styles.accordion}
                    trigger={
                      <LakeHeading level={3} variant="h3">
                        {t("merchantProfile.paymentLink.new.customer")}
                      </LakeHeading>
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
                      <LakeHeading level={3} variant="h3">
                        {t("merchantProfile.paymentLink.new.redirections")}
                      </LakeHeading>
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
                          label={t("merchantProfile.paymentLink.new.customCancelUrl")}
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

                {large && isNotNullish(selectedPreview) && (
                  <Box style={styles.preview}>
                    <Box style={styles.previewContainer}>
                      <SegmentedControl
                        minItemWidth={250}
                        items={previewItems}
                        selected={selectedPreview.id}
                        onValueChange={id => {
                          setSelectedPreview(previewItems.find(method => method.id === id));
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Tile>

            <Space height={32} />

            <Box alignItems={large ? "start" : "stretch"}>
              <LakeButton
                color="current"
                icon="add-circle-filled"
                onPress={onPressSubmit}
                loading={merchantPaymentLinkCreation.isLoading()}
              >
                {t("merchantProfile.paymentLink.buttonForm.create")}
              </LakeButton>
            </Box>
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
