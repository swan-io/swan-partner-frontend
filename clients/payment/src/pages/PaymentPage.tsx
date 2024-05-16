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
import { useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { CardPayment } from "../components/CardPayment";
import { SddPayment } from "../components/SddPayment";
import { SepaLogo } from "../components/SepaLogo";
import { GetMerchantPaymentLinkQuery, MerchantPaymentMethodType } from "../graphql/unauthenticated";
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
  merchantPaymentMethods: { type: MerchantPaymentMethodType }[];
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
          .with({ type: "Card" }, () => Option.Some("Card" as const))
          .with({ type: P.union("SepaDirectDebitB2b", "SepaDirectDebitCore") }, () =>
            Option.Some("SepaDirectDebitB2b" as const),
          )
          .otherwise(() => Option.None());
      }),
    ),
  ];

  const paymentMethods = Array.filterMap(distinctPaymentMethods, distinctPaymentMethods =>
    match(distinctPaymentMethods)
      .with("Card", () =>
        Option.Some({ id: "Card", name: "Card", icon: <Icon name="lake-card" size={24} /> }),
      )
      .with("SepaDirectDebitB2b", () =>
        Option.Some({
          id: "SepaDirectDebitB2b",
          name: "Direct Debit",
          icon: <SepaLogo height={15} />,
        }),
      )
      .exhaustive(),
  );

  const [paymentMethodSelected, setPaymentMethodSelected] = useState(paymentMethods[0]?.id ?? "");

  return (
    <>
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

        {/* <Field name="paymentMethod">
        {() => ( */}
        <LakeLabel
          style={desktop ? styles.segmentedControlDesktop : styles.segmentedControl}
          label={t("paymentLink.paymentMethod")}
          render={() => (
            <SegmentedControl
              mode="desktop"
              selected={paymentMethodSelected}
              items={paymentMethods}
              onValueChange={setPaymentMethodSelected}
            />
          )}
        />
        {/* )}
      </Field> */}

        <Space height={24} />

        {match(paymentMethodSelected)
          .with("Card", () => (
            <CardPayment
              nonEeaCountries={nonEeaCountries}
              paymentLink={paymentLink}
              setMandateUrl={setMandateUrl}
            />
          ))
          .with(P.union("SepaDirectDebitCore", "SepaDirectDebitB2b"), () => (
            <SddPayment
              nonEeaCountries={nonEeaCountries}
              paymentLink={paymentLink}
              setMandateUrl={setMandateUrl}
            />
          ))
          .otherwise(() => null)}
      </WithPartnerAccentColor>
    </>
  );
};
