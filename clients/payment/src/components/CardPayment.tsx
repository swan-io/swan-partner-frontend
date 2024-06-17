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
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CarteBancaireLogo, MaestroLogo, MastercardLogo, VisaLogo } from "./CardLogos";

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

type PaymentMethod = "visa" | "maestro" | "mastercard" | "cartes bancaires";

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
  paymentMethodId: string;
  publicKey: string;
};

type FrameEvent = {
  element: "card-number" | "expiry-date" | "cvv";
  isValid: boolean;
  isEmpty: boolean;
};

export const CardPayment = ({ paymentLink, paymentMethodId, publicKey }: Props) => {
  const { desktop } = useResponsive();

  const [addCardPaymentMandate] = useMutation(AddCardPaymentMandateDocument);

  const [initiateCardPayment] = useMutation(InitiateCardMerchantPaymentDocument);

  type FieldState = "untouched" | "empty" | "invalid" | "valid";
  type CardFieldState = FieldState | "cardNotSupported";

  const [cardNumberState, setCardNumberState] = useState<CardFieldState>("untouched");
  const [expiryDateState, setExpiryDateState] = useState<FieldState>("untouched");
  const [cvvState, setCvvState] = useState<FieldState>("untouched");

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Option<PaymentMethod>>(Option.None());

  useEffect(() => {
    Frames.init({
      publicKey,
      style: {
        base: {
          height: "38px",
          paddingLeft: "12px",
          fontFamily:
            "Inter, -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
          fontSize: "16px",
          fontWeight: "normal",
          color: "#2b2f30",
          letterSpacing: "-0.011em",
        },
        placeholder: {
          base: { color: "#737276", fontStyle: "italic" },
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
    Frames.addEventHandler("frameValidationChanged", (event: FrameEvent) => {
      match(event)
        .with({ element: "card-number", isEmpty: true }, () => {
          setCardNumberState("empty");
        })
        .with({ element: "card-number", isValid: false }, () => {
          setCardNumberState("invalid");
        })
        .with({ element: "card-number", isValid: true }, () => setCardNumberState("valid"))
        .with({ element: "expiry-date", isEmpty: true }, () => {
          setExpiryDateState("empty");
        })
        .with({ element: "expiry-date", isValid: false }, () => {
          setExpiryDateState("invalid");
        })
        .with({ element: "expiry-date", isValid: true }, () => setExpiryDateState("valid"))
        .with({ element: "cvv", isEmpty: true }, () => {
          setCvvState("empty");
        })
        .with({ element: "cvv", isValid: false }, () => {
          setCvvState("invalid");
        })
        .with({ element: "cvv", isValid: true }, () => setCvvState("valid"))
        .exhaustive();
    });
    //@ts-expect-error addEventHandler isn't typed correctly
    Frames.addEventHandler("paymentMethodChanged", (event: { paymentMethod: string }) => {
      const cardType = event.paymentMethod;
      if (cardType === "American Express") {
        setCardNumberState("cardNotSupported");
      }

      if (isNullish(cardType)) {
        setPaymentMethod(Option.None());
      } else {
        match(cardType.toLowerCase())
          .with("visa", "maestro", "mastercard", "cartes bancaires", paymentMethod =>
            setPaymentMethod(Option.Some(paymentMethod)),
          )
          .otherwise(() => setPaymentMethod(Option.None()));
      }
    });
  }, [publicKey]);

  const onPressSubmit = () => {
    if (cardNumberState === "untouched") {
      setCardNumberState("empty");
    }
    if (expiryDateState === "untouched") {
      setExpiryDateState("empty");
    }
    if (cvvState === "untouched") {
      setCvvState("empty");
    }
    if (cardNumberState === "valid" && expiryDateState === "valid" && cvvState === "valid") {
      setIsLoading(true);

      Future.fromPromise<FrameCardTokenizedEvent, Error>(Frames.submitCard())
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
        .tapOk(() => {
          Router.replace("PaymentSuccess", { paymentLinkId: paymentLink.id });
        })
        .tapError(error => {
          showToast({ variant: "error", error, title: translateError(error) });
        })
        .tap(() => setIsLoading(false));
    }
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
                  style={match(cardNumberState)
                    .with("invalid", "empty", "cardNotSupported", () => ({
                      borderColor: colors.negative[400],
                    }))
                    .with("untouched", "valid", () => undefined)
                    .exhaustive()}
                >
                  {/* <!-- card number will be added here --> */}
                </div>

                {match(paymentMethod)
                  .with(Option.P.None, () => null)
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
                  {match(cardNumberState)
                    .with("invalid", () => t("paymentLink.invalidCardNumber"))
                    .with("cardNotSupported", () => t("paymentLink.cardNotSupported"))
                    .with("empty", () => t("paymentLink.cardNumberRequired"))
                    .with("untouched", "valid", () => " ")
                    .exhaustive()}
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
                  style={match(expiryDateState)
                    .with("invalid", "empty", () => ({
                      borderColor: colors.negative[400],
                    }))
                    .with("untouched", "valid", () => undefined)
                    .exhaustive()}
                >
                  {/* <!-- expiry date will be added here --> */}
                </div>

                <Box direction="row" style={styles.errorContainer}>
                  <LakeText variant="smallRegular" color={colors.negative[500]}>
                    {match(expiryDateState)
                      .with("invalid", () => t("paymentLink.invalidExpiryDate"))
                      .with("empty", () => t("paymentLink.expiryDateRequired"))
                      .with("untouched", "valid", () => " ")
                      .exhaustive()}
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
                  style={match(cvvState)
                    .with("invalid", "empty", () => ({
                      borderColor: colors.negative[400],
                    }))
                    .with("untouched", "valid", () => undefined)
                    .exhaustive()}
                >
                  {/* <!-- cvv frame will be added here --> */}
                </div>

                <Box direction="row" style={styles.errorContainer}>
                  <LakeText variant="smallRegular" color={colors.negative[500]}>
                    {match(cvvState)
                      .with("invalid", () => t("paymentLink.invalidCvv"))
                      .with("empty", () => t("paymentLink.cvvRequired"))
                      .with("untouched", "valid", () => " ")
                      .exhaustive()}
                  </LakeText>
                </Box>
              </>
            )}
          />
        </Box>
      </Box>

      <Space height={32} />

      <LakeButton color="partner" onPress={onPressSubmit} loading={isLoading}>
        {t("button.pay")}
      </LakeButton>
    </>
  );
};
