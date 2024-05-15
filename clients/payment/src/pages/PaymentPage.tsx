import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { CardPayment } from "../components/CardPayment";
import { SddPayment } from "../components/SddPayment";
import { SepaLogo } from "../components/SepaLogo";
import { GetMerchantPaymentLinkQuery } from "../graphql/unauthenticated";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },
  // grow: {
  //   flexGrow: 1,
  // },
});

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  setMandateUrl: (value: string) => void;
  nonEeaCountries: string[];
};

type PaymentMethodItemId = (typeof paymentMethodItems)[number]["id"];

const paymentMethodItems = [
  {
    id: "SepaDirectDebitCore",
    name: "Direct Debit",
    icon: <SepaLogo height={15} />,
  },
  {
    id: "Card",
    name: "Card",
    icon: <Icon name="lake-card" size={24} />,
  },
] as const;

export const PaymentPage = ({ paymentLink, setMandateUrl, nonEeaCountries }: Props) => {
  const { desktop } = useResponsive();

  const [paymentMethodSelected, setPaymentMethodSelected] = useState<PaymentMethodItemId>(
    paymentMethodItems[0].id,
  );

  return (
    <>
      <LakeText variant="medium" align="center" color={colors.gray[700]}>
        {paymentLink.label}
      </LakeText>

      <Space height={12} />

      <LakeHeading variant="h1" level={2} align="center">
        {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
      </LakeHeading>

      <Space height={32} />

      {/* <Field name="paymentMethod">
        {() => ( */}
      <LakeLabel
        style={desktop ? styles.segmentedControlDesktop : styles.segmentedControl}
        label={t("paymentLink.paymentMethod")}
        render={() => (
          <SegmentedControl
            mode="desktop"
            selected={paymentMethodSelected}
            items={[
              {
                id: "SepaDirectDebitCore",
                name: "Direct Debit",
                icon: <SepaLogo height={15} />,
              },
              {
                id: "Card",
                name: "Card",
                icon: <Icon name="lake-card" size={24} />,
              },
            ]}
            onValueChange={setPaymentMethodSelected}
          />
        )}
      />
      {/* )}
      </Field> */}

      <Space height={24} />

      {match(paymentMethodSelected)
        .with("Card", () => <CardPayment />)
        .with("SepaDirectDebitCore", () => (
          <SddPayment
            nonEeaCountries={nonEeaCountries}
            paymentLink={paymentLink}
            setMandateUrl={setMandateUrl}
          />
        ))
        .exhaustive()}
    </>
  );
};
