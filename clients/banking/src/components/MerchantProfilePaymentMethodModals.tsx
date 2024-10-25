import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { StyleSheet, View } from "react-native";
import {
  RequestMerchantPaymentMethodsDocument,
  RequestMerchantPaymentMethodsUpdateDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { SepaLogo } from "./SepaLogo";

const styles = StyleSheet.create({
  modalContents: {
    zIndex: -1,
    marginTop: negativeSpacings[48],
  },
  swanLogo: {
    width: 80,
    height: "auto",
    marginVertical: spacings[12],
  },
});

type Props = {
  merchantProfileId: string;
  visible: boolean;
  onPressClose: () => void;
  onSuccess: () => void;
};

export const MerchantProfilePaymentMethodCardRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const onPressSubmit = () => {
    requestMerchantPaymentMethods({
      input: {
        merchantProfileId,
        card: {
          activate: true,
        },
      },
    })
      .mapOkToResult(data =>
        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
      )
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", title: translateError(error), error });
      })
      .tapOk(onSuccess);
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <Icon size={42} name="payment-regular" color={colors.gray[900]} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.card.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.card.description")}
        </LakeText>

        <Space height={24} />

        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {t("merchantProfile.settings.paymentMethods.swanReview")}
        </LakeText>

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

export const MerchantProfilePaymentMethodInternalDirectDebitB2BRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const onPressSubmit = () => {
    requestMerchantPaymentMethods({
      input: {
        merchantProfileId,
        internalDirectDebitB2B: {
          activate: true,
        },
      },
    })
      .mapOkToResult(data =>
        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
      )
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", title: translateError(error), error });
      })
      .tapOk(onSuccess);
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <SwanLogo style={styles.swanLogo} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.internalDirectDebitB2B.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.internalDirectDebitB2B.description")}
        </LakeText>

        <Space height={24} />

        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {t("merchantProfile.settings.paymentMethods.swanReview")}
        </LakeText>

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

export const MerchantProfilePaymentMethodInternalDirectDebitStandardRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const onPressSubmit = () => {
    requestMerchantPaymentMethods({
      input: {
        merchantProfileId,
        internalDirectDebitStandard: {
          activate: true,
        },
      },
    })
      .mapOkToResult(data =>
        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
      )
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", title: translateError(error), error });
      })
      .tapOk(onSuccess);
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <SwanLogo style={styles.swanLogo} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.internalDirectDebitStandard.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.internalDirectDebitStandard.description")}
        </LakeText>

        <Space height={24} />

        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {t("merchantProfile.settings.paymentMethods.swanReview")}
        </LakeText>

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

export const MerchantProfilePaymentMethodSepaDirectDebitB2BRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const { Field, submitForm } = useForm({
    useSwanSepaCreditorIdentifier: {
      initialValue: true,
    },
    sepaCreditorIdentifier: {
      initialValue: "",
      validate: (value, { getFieldValue }) => {
        if (getFieldValue("useSwanSepaCreditorIdentifier") === false && value.trim() === "") {
          return t("common.form.required");
        }
      },
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values =>
        requestMerchantPaymentMethods({
          input: {
            merchantProfileId,
            sepaDirectDebitB2B: {
              activate: true,
              useSwanSepaCreditorIdentifier: values.useSwanSepaCreditorIdentifier.getOr(true),
              sepaCreditorIdentifier: values.sepaCreditorIdentifier.toUndefined(),
            },
          },
        })
          .mapOkToResult(data =>
            Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
          )
          .mapOkToResult(filterRejectionsToResult)
          .tapError(error => {
            showToast({ variant: "error", title: translateError(error), error });
          })
          .tapOk(onSuccess),
    });
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <SepaLogo height={24} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.sepaDirectDebitB2B.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.sepaDirectDebitB2B.description")}
        </LakeText>

        <Space height={24} />

        <LakeLabel
          label={t("merchantProfile.settings.paymentMethods.sepa.creditorIdentifier")}
          render={() => (
            <Field name="useSwanSepaCreditorIdentifier">
              {({ value, error, onChange }) => (
                <>
                  <Space height={8} />

                  <RadioGroup
                    hideErrors={true}
                    onValueChange={onChange}
                    value={value}
                    error={error}
                    items={[
                      {
                        value: true,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.swan",
                        ),
                      },
                      {
                        value: false,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.merchant",
                        ),
                      },
                    ]}
                  />

                  {value ? null : (
                    <>
                      <Space height={8} />

                      <Field name="sepaCreditorIdentifier">
                        {({ value, onChange, error, valid, ref }) => (
                          <LakeTextInput
                            value={value}
                            onChangeText={onChange}
                            error={error}
                            valid={valid}
                            ref={ref}
                            autoFocus={true}
                          />
                        )}
                      </Field>
                    </>
                  )}
                </>
              )}
            </Field>
          )}
        />

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

export const MerchantProfilePaymentMethodSepaDirectDebitCoreRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const { Field, submitForm } = useForm({
    useSwanSepaCreditorIdentifier: {
      initialValue: true,
    },
    sepaCreditorIdentifier: {
      initialValue: "",
      validate: (value, { getFieldValue }) => {
        if (getFieldValue("useSwanSepaCreditorIdentifier") === false && value.trim() === "") {
          return t("common.form.required");
        }
      },
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values =>
        requestMerchantPaymentMethods({
          input: {
            merchantProfileId,
            sepaDirectDebitCore: {
              activate: true,
              useSwanSepaCreditorIdentifier: values.useSwanSepaCreditorIdentifier.getOr(true),
              sepaCreditorIdentifier: values.sepaCreditorIdentifier.toUndefined(),
            },
          },
        })
          .mapOkToResult(data =>
            Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
          )
          .mapOkToResult(filterRejectionsToResult)
          .tapError(error => {
            showToast({ variant: "error", title: translateError(error), error });
          })
          .tapOk(onSuccess),
    });
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <SepaLogo height={24} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.sepaDirectDebitCore.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.sepaDirectDebitCore.description")}
        </LakeText>

        <Space height={24} />

        <LakeLabel
          label={t("merchantProfile.settings.paymentMethods.sepa.creditorIdentifier")}
          render={() => (
            <Field name="useSwanSepaCreditorIdentifier">
              {({ value, error, onChange }) => (
                <>
                  <Space height={8} />

                  <RadioGroup
                    hideErrors={true}
                    onValueChange={onChange}
                    value={value}
                    error={error}
                    items={[
                      {
                        value: true,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.swan",
                        ),
                      },
                      {
                        value: false,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.merchant",
                        ),
                      },
                    ]}
                  />

                  {value ? null : (
                    <>
                      <Space height={8} />

                      <Field name="sepaCreditorIdentifier">
                        {({ value, onChange, error, valid, ref }) => (
                          <LakeTextInput
                            value={value}
                            onChangeText={onChange}
                            error={error}
                            valid={valid}
                            ref={ref}
                            autoFocus={true}
                          />
                        )}
                      </Field>
                    </>
                  )}
                </>
              )}
            </Field>
          )}
        />

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

export const MerchantProfilePaymentMethodCheckRequestModal = ({
  merchantProfileId,
  visible,
  onPressClose,
  onSuccess,
}: Props) => {
  const [requestMerchantPaymentMethods, merchantPaymentMethodRequest] = useMutation(
    RequestMerchantPaymentMethodsDocument,
  );

  const onPressSubmit = () => {
    requestMerchantPaymentMethods({
      input: {
        merchantProfileId,
        check: {
          activate: true,
        },
      },
    })
      .mapOkToResult(data =>
        Option.fromNullable(data.requestMerchantPaymentMethods).toResult("No data"),
      )
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", title: translateError(error), error });
      })
      .tapOk(onSuccess);
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <Icon size={42} name="check-regular" color={colors.gray[900]} />
        <Space height={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {t("merchantProfile.settings.paymentMethods.check.title")}
        </LakeText>

        <LakeText variant="regular" color={colors.gray[500]}>
          {t("merchantProfile.settings.paymentMethods.check.description")}
        </LakeText>

        <Space height={24} />

        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {t("merchantProfile.settings.paymentMethods.swanReview")}
        </LakeText>

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.request")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};

type UpdateProps = {
  paymentMethodId: string;
  visible: boolean;
  onPressClose: () => void;
  onSuccess: () => void;
  initialValues: { useSwanSepaCreditorIdentifier: boolean; sepaCreditorIdentifier?: string };
};

export const MerchantProfilePaymentMethodSepaDirectDebitUpdateModal = ({
  paymentMethodId,
  visible,
  onPressClose,
  onSuccess,
  initialValues,
}: UpdateProps) => {
  const [requestMerchantPaymentMethodsUpdate, merchantPaymentMethodUpdateRequest] = useMutation(
    RequestMerchantPaymentMethodsUpdateDocument,
  );

  const { Field, submitForm } = useForm({
    useSwanSepaCreditorIdentifier: {
      initialValue: initialValues.useSwanSepaCreditorIdentifier,
    },
    sepaCreditorIdentifier: {
      initialValue: initialValues.sepaCreditorIdentifier ?? "",
      validate: (value, { getFieldValue }) => {
        if (getFieldValue("useSwanSepaCreditorIdentifier") === false && value.trim() === "") {
          return t("common.form.required");
        }
      },
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values =>
        requestMerchantPaymentMethodsUpdate({
          input: {
            paymentMethodId,
            sepaDirectDebit: {
              useSwanSepaCreditorIdentifier: values.useSwanSepaCreditorIdentifier.getOr(true),
              sepaCreditorIdentifier: values.sepaCreditorIdentifier.toUndefined(),
            },
          },
        })
          .mapOkToResult(data =>
            Option.fromNullable(data.requestMerchantPaymentMethodsUpdate).toResult("No data"),
          )
          .mapOkToResult(filterRejectionsToResult)
          .tapError(error => {
            showToast({ variant: "error", title: translateError(error), error });
          })
          .tapOk(onSuccess),
    });
  };

  return (
    <LakeModal visible={visible} onPressClose={onPressClose}>
      <View style={styles.modalContents}>
        <SepaLogo height={24} />

        <LakeLabel
          label={t("merchantProfile.settings.paymentMethods.sepa.creditorIdentifier")}
          render={() => (
            <Field name="useSwanSepaCreditorIdentifier">
              {({ value, error, onChange }) => (
                <>
                  <Space height={8} />

                  <RadioGroup
                    hideErrors={true}
                    onValueChange={onChange}
                    value={value}
                    error={error}
                    items={[
                      {
                        value: true,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.swan",
                        ),
                      },
                      {
                        value: false,
                        name: t(
                          "merchantProfile.settings.paymentMethods.sepa.creditorIdentifier.merchant",
                        ),
                      },
                    ]}
                  />

                  {value ? null : (
                    <>
                      <Space height={8} />

                      <Field name="sepaCreditorIdentifier">
                        {({ value, onChange, error, valid, ref }) => (
                          <LakeTextInput
                            value={value}
                            onChangeText={onChange}
                            error={error}
                            valid={valid}
                            ref={ref}
                            autoFocus={true}
                          />
                        )}
                      </Field>
                    </>
                  )}
                </>
              )}
            </Field>
          )}
        />

        <Space height={8} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            mode="primary"
            color="current"
            loading={merchantPaymentMethodUpdateRequest.isLoading()}
            onPress={onPressSubmit}
          >
            {t("merchantProfile.settings.paymentMethods.requestUpdate")}
          </LakeButton>
        </LakeButtonGroup>
      </View>
    </LakeModal>
  );
};
