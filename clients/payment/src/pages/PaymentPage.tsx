import { Array, Option } from "@swan-io/boxed";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { CardPayment } from "../components/CardPayment";
import { ErrorView } from "../components/ErrorView";
import { SddPayment } from "../components/SddPayment";
import { SepaLogo } from "../components/SepaLogo";
import { GetMerchantPaymentLinkQuery, MerchantPaymentMethodType } from "../graphql/unauthenticated";
import { env } from "../utils/env";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },
});

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  setMandateUrl: (value: string) => void;
  nonEeaCountries: string[];
  merchantPaymentMethods: { type: MerchantPaymentMethodType; id: string }[];
};

export const PaymentPage = ({
  paymentLink,
  setMandateUrl,
  nonEeaCountries,
  merchantPaymentMethods,
}: Props) => {
  const { desktop } = useResponsive();

  const distinctPaymentMethods = [
    ...new Set(
      Array.filterMap(merchantPaymentMethods, paymentMethod => {
        return match(paymentMethod)
          .returnType<Option<{ type: "Card" | "SepaDirectDebitB2b"; id: string }>>()
          .with({ type: "Card" }, () => Option.Some({ type: "Card", id: paymentMethod.id }))
          .with({ type: P.union("SepaDirectDebitB2b", "SepaDirectDebitCore") }, () =>
            Option.Some({ type: "SepaDirectDebitB2b", id: paymentMethod.id }),
          )
          .otherwise(() => Option.None());
      }),
    ),
  ];

  const paymentMethods = Array.filterMap(distinctPaymentMethods, distinctPaymentMethods =>
    match(distinctPaymentMethods)
      .with({ type: "Card" }, () =>
        Option.Some({
          id: distinctPaymentMethods.id,
          name: "Card",
          icon: <Icon name="payment-regular" size={24} />,
          activeIcon: <Icon name="payment-filled" size={24} />,
        }),
      )
      .with({ type: "SepaDirectDebitB2b" }, () =>
        Option.Some({
          id: distinctPaymentMethods.id,
          name: "Direct Debit",
          icon: <SepaLogo height={15} />,
        }),
      )
      .exhaustive(),
  );

  if (paymentMethods[0]?.name === "Card") {
    paymentMethods.reverse();
  }

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);

  return (
    <WithPartnerAccentColor
      color={paymentLink.merchantProfile.accentColor ?? invariantColors.defaultAccentColor}
    >
      <LakeText variant="medium" align="center" color={colors.gray[700]}>
        {paymentLink.label}
      </LakeText>

      <Space height={12} />

      <LakeHeading variant="h1" level={2} align="center">
        {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
      </LakeHeading>

      <Space height={32} />

      {isNotNullish(selectedPaymentMethod) && (
        <LakeLabel
          style={
            desktop && paymentMethods.length === 1
              ? styles.segmentedControlDesktop
              : styles.segmentedControl
          }
          label={t("paymentLink.paymentMethod")}
          render={() => (
            <SegmentedControl
              minItemWidth={250}
              selected={selectedPaymentMethod.id}
              items={paymentMethods}
              onValueChange={id => {
                setSelectedPaymentMethod(paymentMethods.find(method => method.id === id));
              }}
            />
          )}
        />
      )}

      <Space height={24} />

      {match(selectedPaymentMethod)
        .with({ name: "Card" }, ({ id }) => {
          if (isNullish(env.CLIENT_CHECKOUT_API_KEY)) {
            return <ErrorView />;
          } else {
            return (
              <CardPayment
                paymentLink={paymentLink}
                paymentMethodId={id}
                publicKey={env.CLIENT_CHECKOUT_API_KEY}
              />
            );
          }
        })
        .with({ name: "Direct Debit" }, () => (
          <SddPayment
            nonEeaCountries={nonEeaCountries}
            paymentLink={paymentLink}
            setMandateUrl={setMandateUrl}
          />
        ))
        .otherwise(() => null)}
    </WithPartnerAccentColor>
  );
};
