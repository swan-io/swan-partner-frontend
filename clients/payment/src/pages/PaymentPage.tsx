import { Array, Option } from "@swan-io/boxed";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
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

type SupportedMethodType = "Card" | "DirectDebit";

const orderedSupportedMethodTypes: SupportedMethodType[] = ["DirectDebit", "Card"];

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  setMandateUrl: (value: string) => void;
  nonEeaCountries: string[];
  merchantPaymentMethods: { type: MerchantPaymentMethodType; id: string }[];
  large: boolean;
};

export const PaymentPage = ({
  paymentLink,
  setMandateUrl,
  nonEeaCountries,
  merchantPaymentMethods,
  large,
}: Props) => {
  const methodIds = merchantPaymentMethods.reduce<Partial<Record<SupportedMethodType, string>>>(
    (acc, { type, id }) => {
      return match(type)
        .with("Card", () => ({ ...acc, Card: id }))
        .with("SepaDirectDebitB2b", "SepaDirectDebitCore", () => ({ ...acc, DirectDebit: id }))
        .otherwise(() => acc);
    },
    {},
  );

  const paymentMethods = Array.filterMap(orderedSupportedMethodTypes, type =>
    Option.fromNullable(methodIds[type]).map(id =>
      match(type)
        .with("Card", () => ({
          id,
          name: "Card",
          icon: <Icon name="payment-regular" size={24} />,
          activeIcon: <Icon name="payment-filled" size={24} />,
        }))
        .with("DirectDebit", () => ({
          id,
          name: "Direct Debit",
          icon: <SepaLogo height={15} />,
        }))
        .exhaustive(),
    ),
  );

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

      {paymentMethods.length > 1 && isNotNullish(selectedPaymentMethod) && (
        <LakeLabel
          style={
            large && paymentMethods.length === 1
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
                large={large}
              />
            );
          }
        })
        .with({ name: "Direct Debit" }, () => (
          <SddPayment
            nonEeaCountries={nonEeaCountries}
            paymentLink={paymentLink}
            setMandateUrl={setMandateUrl}
            large={large}
          />
        ))
        .otherwise(() => null)}
    </WithPartnerAccentColor>
  );
};
