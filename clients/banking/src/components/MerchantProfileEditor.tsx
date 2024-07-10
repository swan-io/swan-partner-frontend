import { Future, Option } from "@swan-io/boxed";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints, radii, spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion, noop } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { FileInput } from "@swan-io/shared-business/src/components/FileInput";
import { toOptionalValidator, useForm } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantProfileFragment, ProductType } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  validateHexColor,
  validateNullableRequired,
  validateNumeric,
  validateUrl,
} from "../utils/validations";

const styles = StyleSheet.create({
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

const DEFAULT_ACCENT_COLOR = "#16141a";

const productTypes = deriveUnion<ProductType>({
  GiftsAndDonations: true,
  Goods: true,
  Services: true,
  VirtualGoods: true,
});

export type MerchantProfileEditorState = {
  merchantName: string;
  productType: ProductType;
  expectedAverageBasket: { value: string; currency: string };
  expectedMonthlyPaymentVolume: { value: string; currency: string };
  merchantWebsite?: string;
  accentColor?: string;
  merchantLogo?: string;
};

type Props = {
  merchantProfile?: MerchantProfileFragment;
  onSubmit: (values: MerchantProfileEditorState) => void;
};

export type MerchantProfileEditorRef = {
  submit: () => void;
};

export const MerchantProfileEditor = forwardRef<MerchantProfileEditorRef, Props>(
  ({ merchantProfile, onSubmit }, ref) => {
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
        initialValue:
          merchantProfile?.requestMerchantProfileUpdate?.merchantName ??
          merchantProfile?.merchantName ??
          "",
        validate: validateNullableRequired,
      },
      productType: {
        initialValue:
          merchantProfile?.requestMerchantProfileUpdate?.productType ??
          merchantProfile?.productType ??
          undefined,
        validate: validateNullableRequired,
      },
      expectedMonthlyPaymentVolume: {
        initialValue:
          merchantProfile?.requestMerchantProfileUpdate?.expectedMonthlyPaymentVolume.value ??
          merchantProfile?.expectedMonthlyPaymentVolume.value ??
          "",
        validate: validateNumeric({ min: 0 }),
      },
      expectedAverageBasket: {
        initialValue:
          merchantProfile?.requestMerchantProfileUpdate?.expectedAverageBasket.value ??
          merchantProfile?.expectedAverageBasket.value ??
          "",
        validate: validateNumeric({ min: 0 }),
      },
      merchantWebsite: {
        initialValue:
          merchantProfile?.requestMerchantProfileUpdate?.merchantWebsite ??
          merchantProfile?.merchantWebsite ??
          "",
        sanitize: value => value.trim(),
        validate: toOptionalValidator(validateUrl),
      },
      accentColor: {
        initialValue: merchantProfile?.accentColor?.slice(1) ?? "",
        validate: toOptionalValidator(validateHexColor),
      },
      merchantLogoUrl: {
        initialValue: undefined,
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
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

                  return base64Logo.tap(logo => {
                    onSubmit({
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
                    });
                  });
                },
              );
            },
          });
        },
      }),
      [submitForm, onSubmit],
    );

    return (
      <ResponsiveContainer breakpoint={breakpoints.small}>
        {({ small }) => (
          <>
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
                              {
                                backgroundColor:
                                  validateHexColor(value) == null
                                    ? `#${value}`
                                    : DEFAULT_ACCENT_COLOR,
                              },
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
                      value={
                        value ??
                        (merchantProfile?.requestMerchantProfileUpdate?.merchantLogoUrl != null
                          ? { url: merchantProfile?.requestMerchantProfileUpdate?.merchantLogoUrl }
                          : undefined) ??
                        (merchantProfile?.merchantLogoUrl != null
                          ? { url: merchantProfile?.merchantLogoUrl }
                          : undefined)
                      }
                      error={error}
                      icon="image-regular"
                      accept={["image/png"]}
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
          </>
        )}
      </ResponsiveContainer>
    );
  },
);
