import { Future, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { FrameCardTokenizedEvent, Frames } from "frames-react";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import {
  AddCardPaymentMandateDocument,
  GetMerchantPaymentLinkQuery,
  InitiateCardMerchantPaymentDocument,
} from "../graphql/unauthenticated";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import {
  AmericanExpressLogo,
  CarteBancaireLogo,
  MaestroLogo,
  MastercardLogo,
  VisaLogo,
} from "./CardLogos";

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1,
  },
  errorContainer: {
    paddingTop: spacings[4],
  },
  cardLogo: {
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacings[16],
    paddingVertical: spacings[8],
    maxHeight: 40,
    borderTopRightRadius: radii[6],
    borderBottomRightRadius: radii[6],
    borderColor: colors.gray[100],
    borderWidth: 1,
    borderTopLeftRadius: 0,
    borderLeftWidth: 0,
    borderBottomLeftRadius: 0,
  },
});

type PaymentMethod = "visa" | "maestro" | "mastercard" | "american express" | "cartes bancaires";

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  paymentMethodId: string;
};

export const CardPayment = ({ paymentLink, paymentMethodId }: Props) => {
  const { desktop } = useResponsive();

  const [addCardPaymentMandate, addCardPaymentMandateData] = useMutation(
    AddCardPaymentMandateDocument,
  );

  const [initiateCardPayment, initiateCardPaymentData] = useMutation(
    InitiateCardMerchantPaymentDocument,
  );

  const [isCardValid, setIsCardValid] = useState<Option<boolean>>(Option.None());
  const [paymentMethod, setPaymentMethod] = useState<Option<PaymentMethod>>(Option.None());

  useEffect(() => {
    Frames.init({
      publicKey: env.CLIENT_CHECKOUT_API_KEY,
      style: {
        base: {
          height: "38px",
          paddingLeft: "12px",
          fontFamily:
            "Inter, -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
          fontSize: "16px",
          // fontStyle: "normal",
          color: "#2b2f30",
          letterSpacing: "-0.011em",
        },
      },
      localization: {
        cardNumberPlaceholder: " ",
        cvvPlaceholder: " ",
        expiryMonthPlaceholder: "MM",
        expiryYearPlaceholder: "YY",
      },
      schemeChoice: true,
    });

    //@ts-expect-error addEventHandler isn't typed correctly
    Frames.addEventHandler("cardValidationChanged", (event: { isValid: boolean }) =>
      setIsCardValid(isCardValid => isCardValid.map(() => event.isValid)),
    );

    //@ts-expect-error addEventHandler isn't typed correctly
    Frames.addEventHandler("paymentMethodChanged", (event: { paymentMethod: string }) => {
      const cardType = event.paymentMethod;

      if (isNullish(cardType)) {
        setPaymentMethod(Option.None());
      }
      match(cardType.toLowerCase())
        .with(
          "visa",
          "maestro",
          "mastercard",
          "american express",
          "cartes bancaires",
          paymentMethod => setPaymentMethod(Option.Some(paymentMethod)),
        )
        .otherwise(() => setPaymentMethod(Option.None()));
    });
  }, []);

  const onPressSubmit = () => {
    setIsCardValid(Option.None());

    Future.fromPromise<FrameCardTokenizedEvent, Error>(Frames.submitCard())
      .tapOk(() => setIsCardValid(Option.Some(true)))
      .tapError(() => setIsCardValid(Option.Some(false)))
      .flatMapOk(data =>
        addCardPaymentMandate({
          input: {
            paymentLinkId: paymentLink.id,
            paymentMethodId,
            sequence: "OneOff",
            token: data.token,
          },
        })
          .mapOk(data => data.unauthenticatedAddCardPaymentMandate)
          .mapOkToResult(filterRejectionsToResult),
      )
      .flatMapOk(data =>
        initiateCardPayment({
          input: {
            cardPaymentMandateId: data.paymentMandate.id,
            paymentLinkId: paymentLink.id,
          },
        })
          .mapOk(data => data.unauthenticatedInitiateMerchantCardPaymentFromPaymentLink)
          .mapOkToResult(filterRejectionsToResult),
      )
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <>
      <Box>
        <LakeLabel
          label={t("paymentLink.card.cardNumber")}
          render={() => (
            <>
              <Box direction="row" grow={1} shrink={1}>
                <div
                  className={`card-number-frame ${paymentMethod.isSome() ? "card-number-frame-with-logo" : ""}`}
                  style={{
                    ...(isCardValid.isSome() &&
                      !isCardValid.get() && {
                        borderColor: colors.negative[400],
                      }),
                  }}
                >
                  {/* <!-- card number will be added here --> */}
                </div>

                {match(paymentMethod)
                  .with(Option.P.None, () => null)
                  .with(Option.P.Some("american express"), () => (
                    <View style={styles.cardLogo}>
                      <AmericanExpressLogo />
                    </View>
                  ))
                  .with(Option.P.Some("cartes bancaires"), () => (
                    <View style={styles.cardLogo}>
                      <CarteBancaireLogo />
                    </View>
                  ))
                  .with(Option.P.Some("maestro"), () => (
                    <View style={styles.cardLogo}>
                      <MaestroLogo />
                    </View>
                  ))
                  .with(Option.P.Some("mastercard"), () => (
                    <View style={styles.cardLogo}>
                      <MastercardLogo />
                    </View>
                  ))
                  .with(Option.P.Some("visa"), () => (
                    <View style={styles.cardLogo}>
                      <VisaLogo />
                    </View>
                  ))
                  .exhaustive()}
              </Box>

              <Box direction="row" style={styles.errorContainer}>
                <LakeText variant="smallRegular" color={colors.negative[500]}>
                  {" "}
                </LakeText>
              </Box>
            </>
          )}
        />
      </Box>

      <Box direction={desktop ? "row" : "column"}>
        <Box style={styles.grow}>
          <LakeLabel
            label={t("paymentLink.card.expiryDate")}
            render={() => (
              <>
                <div
                  className="expiry-date-frame"
                  style={
                    isCardValid.getOr(true)
                      ? undefined
                      : {
                          borderColor: colors.negative[400],
                        }
                  }
                >
                  {/* <!-- expiry date will be added here --> */}
                </div>

                <Box direction="row" style={styles.errorContainer}>
                  <LakeText variant="smallRegular" color={colors.negative[500]}>
                    {" "}
                  </LakeText>
                </Box>
              </>
            )}
          />
        </Box>

        <Space width={24} />

        <Box style={styles.grow}>
          <LakeLabel
            label={t("paymentLink.card.cvv")}
            render={() => (
              <>
                <div
                  className="cvv-frame"
                  style={
                    isCardValid.getOr(true)
                      ? undefined
                      : {
                          borderColor: colors.negative[400],
                        }
                  }
                >
                  {/* <!-- cvv frame will be added here --> */}
                </div>

                <Box direction="row" style={styles.errorContainer}>
                  <LakeText variant="smallRegular" color={colors.negative[500]}>
                    {" "}
                  </LakeText>
                </Box>
              </>
            )}
          />
        </Box>
      </Box>

      <Space height={32} />

      <LakeButton
        color="partner"
        onPress={onPressSubmit}
        loading={addCardPaymentMandateData.isLoading() || initiateCardPaymentData.isLoading()}
      >
        {t("button.pay")}
      </LakeButton>
    </>
  );
};
