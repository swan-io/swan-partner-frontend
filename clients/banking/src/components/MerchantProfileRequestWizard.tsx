import { Future, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, radii, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { deriveUnion, noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { FileInput } from "@swan-io/shared-business/src/components/FileInput";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { toOptionalValidator, useForm } from "@swan-io/use-form";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AddMerchantProfileDocument, ProductType } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  validateHexColor,
  validateNullableRequired,
  validateNumeric,
  validateUrl,
} from "../utils/validations";

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
    maxWidth: 1336,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1172,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
    paddingVertical: spacings[24],
  },
  accentColorField: {
    paddingLeft: spacings[40],
  },
  accentColorPreview: {
    position: "absolute",
    left: spacings[12],
    top: spacings[8],
    flexDirection: "row",
    alignItems: "center",
  },
  accentColorPreviewCircle: {
    width: 16,
    height: 16,
    borderRadius: radii[8],
  },
});

const productTypes = deriveUnion<ProductType>({
  GiftsAndDonations: true,
  Goods: true,
  Services: true,
  VirtualGoods: true,
});

const DEFAULT_ACCENT_COLOR = "#16141a";

const MerchantProfileEditor = ({
  accountId,
  accountMembershipId,
}: {
  accountId: string;
  accountMembershipId: string;
}) => {
  const [addMerchantProfile, merchantProfileAddition] = useMutation(AddMerchantProfileDocument);

  const { Field, submitForm } = useForm<{
    merchantName: string;
    productType: ProductType | undefined;
    expectedMonthlyPaymentVolume: string;
    expectedAverageBasket: string;
    merchantWebsite: string;
    merchantLogoUrl: File | undefined;
    accentColor: string;
  }>({
    merchantName: {
      initialValue: "",
      validate: validateNullableRequired,
    },
    productType: {
      initialValue: undefined,
      validate: validateNullableRequired,
    },
    expectedMonthlyPaymentVolume: {
      initialValue: "",
      validate: validateNumeric({ min: 0 }),
    },
    expectedAverageBasket: {
      initialValue: "",
      validate: validateNumeric({ min: 0 }),
    },
    merchantWebsite: {
      initialValue: "",
      sanitize: value => value.trim(),
      validate: toOptionalValidator(validateUrl),
    },
    accentColor: {
      initialValue: "",
      validate: toOptionalValidator(validateHexColor),
    },
    merchantLogoUrl: {
      initialValue: undefined,
    },
  });

  const onPressSubmit = useCallback(() => {
    submitForm({
      onSuccess: values => {
        Option.allFromDict(values).tapSome(
          ({
            merchantName,
            productType,
            expectedMonthlyPaymentVolume,
            expectedAverageBasket,
            merchantWebsite,
            merchantLogoUrl,
            accentColor,
          }) => {
            const base64Logo =
              merchantLogoUrl == undefined
                ? Future.value(Option.None<string>())
                : Future.make<Option<string>>(resolve => {
                    const reader = new FileReader();
                    reader.readAsDataURL(merchantLogoUrl);

                    reader.onload = () => {
                      const base64 = match(reader.result)
                        .with(P.string, value => value.split(";base64,")[1])
                        .otherwise(noop);

                      resolve(
                        match(base64)
                          .with(P.string, value => Option.Some(value))
                          .otherwise(() => Option.None()),
                      );
                    };
                    reader.onerror = () => {
                      resolve(Option.None());
                    };
                  });

            return base64Logo.flatMap(logo =>
              addMerchantProfile({
                input: {
                  accountId,
                  merchantName,
                  productType: productType as ProductType,
                  expectedAverageBasket: { value: expectedAverageBasket, currency: "EUR" },
                  expectedMonthlyPaymentVolume: {
                    value: expectedMonthlyPaymentVolume,
                    currency: "EUR",
                  },
                  merchantWebsite: emptyToUndefined(merchantWebsite),
                  accentColor: Option.fromNullable(emptyToUndefined(accentColor))
                    .map(value => `#${value}`)
                    .toUndefined(),
                  merchantLogo: logo.toUndefined(),
                },
              })
                .mapOkToResult(data =>
                  Option.fromNullable(data.addMerchantProfile).toResult("No response"),
                )
                .mapOkToResult(filterRejectionsToResult)
                .tapError(error => {
                  showToast({ variant: "error", error, title: translateError(error) });
                })
                .tapOk(payload => {
                  Router.push("AccountMerchantsItemPaymentsRoot", {
                    accountMembershipId,
                    merchantProfileId: payload.merchantProfile.id,
                  });
                }),
            );
          },
        );
      },
    });
  }, [submitForm, accountId, accountMembershipId, addMerchantProfile]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ small }) => (
        <>
          <Tile>
            <Grid numColumns={small ? 1 : 2} horizontalSpace={40}>
              <Field name="merchantName">
                {({ ref, onChange, onBlur, valid, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.merchantName.label")}
                    render={id => (
                      <LakeTextInput
                        ref={ref}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={error}
                        valid={valid}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="productType">
                {({ ref, onChange, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.productType.label")}
                    render={id => (
                      <LakeSelect
                        id={id}
                        ref={ref}
                        value={value}
                        items={productTypes.array.map(item => ({
                          name: match(item)
                            .with("GiftsAndDonations", () =>
                              t("merchantProfile.request.productType.GiftsAndDonations"),
                            )
                            .with("Goods", () => t("merchantProfile.request.productType.Goods"))
                            .with("Services", () =>
                              t("merchantProfile.request.productType.Services"),
                            )
                            .with("VirtualGoods", () =>
                              t("merchantProfile.request.productType.VirtualGoods"),
                            )
                            .exhaustive(),
                          value: item,
                        }))}
                        onValueChange={onChange}
                        error={error}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="expectedMonthlyPaymentVolume">
                {({ ref, onChange, onBlur, valid, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.expectedMonthlyPaymentVolume.label")}
                    render={id => (
                      <LakeTextInput
                        ref={ref}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={error}
                        valid={valid}
                        unit="EUR"
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="expectedAverageBasket">
                {({ ref, onChange, onBlur, valid, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.expectedAverageBasket.label")}
                    render={id => (
                      <LakeTextInput
                        ref={ref}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={error}
                        valid={valid}
                        unit="EUR"
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="merchantWebsite">
                {({ ref, onChange, onBlur, valid, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.merchantWebsite.label")}
                    optionalLabel={t("form.optional")}
                    render={id => (
                      <LakeTextInput
                        ref={ref}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={error}
                        valid={valid}
                        placeholder={t("merchantProfile.request.merchantWebsite.placeholder")}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="accentColor">
                {({ ref, onChange, onBlur, valid, value, error }) => (
                  <LakeLabel
                    label={t("merchantProfile.request.accentColor.label")}
                    optionalLabel={t("form.optional")}
                    render={id => (
                      <View>
                        <LakeTextInput
                          ref={ref}
                          id={id}
                          value={value}
                          style={styles.accentColorField}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={error}
                          valid={valid}
                        />

                        <View style={styles.accentColorPreview}>
                          <View
                            style={[
                              styles.accentColorPreviewCircle,
                              { backgroundColor: valid ? `#${value}` : DEFAULT_ACCENT_COLOR },
                            ]}
                          />

                          <Space width={8} />
                          <LakeText>{"#"}</LakeText>
                        </View>
                      </View>
                    )}
                  />
                )}
              </Field>
            </Grid>

            <Field name="merchantLogoUrl">
              {({ value, error, onChange }) => (
                <LakeLabel
                  label={t("merchantProfile.request.merchantLogo.label")}
                  optionalLabel={t("form.optional")}
                  render={() => (
                    <FileInput
                      value={value}
                      error={error}
                      icon="image-regular"
                      accept={["image/png", "image/jpeg"]}
                      maxSize={1000 * 1000} // 1MB
                      description={t("merchantProfile.request.merchantLogo.acceptedImageUpload")}
                      onFiles={files => {
                        const file = files[0];

                        if (file != null) {
                          void onChange(file);
                        }
                      }}
                    />
                  )}
                />
              )}
            </Field>
          </Tile>

          <Space height={16} />

          <LakeButtonGroup paddingBottom={32}>
            <LakeButton
              onPress={onPressSubmit}
              color="current"
              icon="add-circle-filled"
              loading={merchantProfileAddition.isLoading()}
            >
              {t("merchantProfile.request.requestProfile")}
            </LakeButton>
          </LakeButtonGroup>
        </>
      )}
    </ResponsiveContainer>
  );
};

type Props = {
  onPressClose?: () => void;
  accountId: string;
  accountMembershipId: string;
};

export const MerchantProfileRequestWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
}: Props) => {
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
                <LakeHeading level={2} variant="h3">
                  {t("merchantProfile.request.title")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            <MerchantProfileEditor
              accountId={accountId}
              accountMembershipId={accountMembershipId}
            />
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
