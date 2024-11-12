import { Future, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { FrameCardTokenizedEvent, Frames } from "frames-react";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  AddCardPaymentMandateDocument,
  GetMerchantPaymentLinkQuery,
  InitiateCardMerchantPaymentDocument,
} from "../graphql/unauthenticated";
import { env } from "../utils/env";
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
  large: boolean;
};

export const CardPayment = ({ paymentLink, paymentMethodId, publicKey, large }: Props) => {
  const isSandbox = env.SWAN_ENVIRONMENT === "SANDBOX";

  const [addCardPaymentMandate] = useMutation(AddCardPaymentMandateDocument);

  const [initiateCardPayment] = useMutation(InitiateCardMerchantPaymentDocument);

  type FieldState = "untouched" | "empty" | "invalid" | "valid";
  type CardFieldState = FieldState | "cardNotSupported";

  const [cardNumberState, setCardNumberState] = useState<CardFieldState>("untouched");
  const [isPaymentMethodValid, setIsPaymentMethodValid] = useState<boolean>(true);
  const [cardNumberHasBeenBlurred, setCardNumberHasBeenBlurred] = useState(false);
  const [cardTypeValue, setCardTypeValue] = useState<string | undefined>(undefined);

  const [expiryDateState, setExpiryDateState] = useState<FieldState>("untouched");
  const [expiryDateHasBeenBlurred, setExpiryDateHasBeenBlurred] = useState(false);

  const [cvvState, setCvvState] = useState<FieldState>("untouched");
  const [cvvHasBeenBlurred, setCvvNumberHasBeenBlurred] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Option<PaymentMethod>>(Option.None());

  const initFramesSession = useCallback(() => {
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
      acceptedPaymentMethods: ["Visa", "Maestro", "Mastercard", "Cartes Bancaires"],
    });
  }, [publicKey]);

  useEffect(() => {
    initFramesSession();
  }, [initFramesSession]);

  useEffect(() => {
    Frames.addEventHandler(
      "paymentMethodChanged",
      // @ts-expect-error addEventHandler isn't typed correctly
      (event: unknown) => {
        match(event)
          .with({ isPaymentMethodAccepted: P.boolean }, ({ isPaymentMethodAccepted }) => {
            setIsPaymentMethodValid(isPaymentMethodAccepted);
          })
          .otherwise(() => {});

        const cardType = match(event)
          .with({ paymentMethod: P.string }, ({ paymentMethod }) => paymentMethod)
          .otherwise(() => {});

        match(cardType?.toLowerCase())
          .with("visa", "maestro", "mastercard", "cartes bancaires", paymentMethod => {
            setPaymentMethod(Option.Some(paymentMethod));
          })
          .otherwise(() => {
            if (isNotNullish(cardType) && typeof cardType === "string") {
              setCardTypeValue(cardType);
            }
            setPaymentMethod(Option.None());
          });
      },
    );

    //@ts-expect-error addEventHandler isn't typed correctly
    Frames.addEventHandler("frameValidationChanged", (event: unknown) => {
      match({ event, cardNumberState })
        .with({ event: { element: "card-number", isEmpty: true } }, () => {
          setCardNumberState("empty");
          setPaymentMethod(Option.None());
        })
        .with({ event: { element: "card-number", isValid: false } }, () => {
          setCardNumberState("invalid");
        })
        .with(
          { event: { element: "card-number", isValid: true }, cardNumberState: "cardNotSupported" },
          () => {
            setCardNumberState("cardNotSupported");
          },
        )
        .with({ event: { element: "card-number", isValid: true } }, () =>
          setCardNumberState("valid"),
        )
        .with({ event: { element: "expiry-date", isEmpty: true } }, () => {
          setExpiryDateState("empty");
        })
        .with({ event: { element: "expiry-date", isValid: false } }, () => {
          setExpiryDateState("invalid");
        })
        .with({ event: { element: "expiry-date", isValid: true } }, () =>
          setExpiryDateState("valid"),
        )
        .with({ event: { element: "cvv", isEmpty: true } }, () => {
          setCvvState("empty");
        })
        .with({ event: { element: "cvv", isValid: false } }, () => {
          setCvvState("invalid");
        })
        .with({ event: { element: "cvv", isValid: true } }, () => setCvvState("valid"))
        .otherwise(() => {});
    });

    //@ts-expect-error addEventHandler isn't typed correctly
    Frames.addEventHandler("frameBlur", (event: unknown) => {
      match(event)
        .with({ element: "card-number" }, () => setCardNumberHasBeenBlurred(true))
        .with({ element: "expiry-date" }, () => setExpiryDateHasBeenBlurred(true))
        .with({ element: "cvv" }, () => setCvvNumberHasBeenBlurred(true))
        .otherwise(() => {});
    });
  }, [cardNumberState]);

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
    if (Frames.isCardValid()) {
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
        .tapOk(({ redirectUrl }) => {
          window.location.replace(redirectUrl);
        })
        .tapError(error => {
          match(error)
            .with({ __typename: "ExpiredPaymentLinkRejection" }, () => {
              Router.replace("PaymentExpired", { paymentLinkId: paymentLink.id });
            })
            .otherwise(() => {
              Router.replace("PaymentForm", { paymentLinkId: paymentLink.id, error: "true" });
            });
        });
    }
  };

  return (
    <>
      <Box>
        {isSandbox && (
          <>
            <LakeAlert variant="info" title={t("paymentLink.alert")} />
            <Space height={24} />
          </>
        )}

        <LakeLabel
          label={t("paymentLink.card.cardNumber")}
          render={() => (
            <>
              <Box direction="row" grow={1} shrink={1}>
                <div
                  className={`card-number-frame ${paymentMethod.isSome() ? "card-number-frame-with-logo" : ""}`}
                  style={match({ cardNumberState, isPaymentMethodValid, cardNumberHasBeenBlurred })
                    .with(
                      {
                        cardNumberState: P.union("invalid", "cardNotSupported"),
                      },
                      {
                        cardNumberState: "empty",
                      },
                      { isPaymentMethodValid: false, cardNumberHasBeenBlurred: true },
                      () => ({
                        borderColor: colors.negative[400],
                      }),
                    )
                    .otherwise(() => undefined)}
                >
                  {/* <!-- card number will be added here --> */}
                </div>

                {match(paymentMethod)
                  .with(Option.P.None, () => null)
                  .with(
                    Option.P.Some(P.union("cartes bancaires", "maestro", "mastercard", "visa")),
                    () => (
                      <View
                        style={[
                          styles.cardLogo,
                          match({ cardNumberState, isPaymentMethodValid, cardNumberHasBeenBlurred })
                            .with(
                              {
                                cardNumberState: P.union("invalid", "cardNotSupported"),
                                cardNumberHasBeenBlurred: true,
                              },
                              {
                                cardNumberState: "empty",
                              },
                              { isPaymentMethodValid: false, cardNumberHasBeenBlurred: false },
                              () => ({
                                borderColor: colors.negative[500],
                              }),
                            )
                            .otherwise(() => undefined),
                        ]}
                      >
                        {match(paymentMethod)
                          .with(Option.Some("cartes bancaires"), () => <CarteBancaireLogo />)
                          .with(Option.Some("maestro"), () => <MaestroLogo />)
                          .with(Option.Some("mastercard"), () => <MastercardLogo />)
                          .with(Option.Some("visa"), () => <VisaLogo />)
                          .otherwise(() => undefined)}
                      </View>
                    ),
                  )
                  .otherwise(() => undefined)}
              </Box>

              <Box direction="row" style={styles.errorContainer}>
                <LakeText variant="smallRegular" color={colors.negative[500]}>
                  {match({ cardNumberState, isPaymentMethodValid, cardNumberHasBeenBlurred })
                    .with({ cardNumberState: "invalid", cardNumberHasBeenBlurred: true }, () =>
                      t("paymentLink.invalidCardNumber"),
                    )
                    .with({ cardNumberState: "empty" }, () => t("paymentLink.cardNumberRequired"))
                    .with({ isPaymentMethodValid: false, cardNumberHasBeenBlurred: true }, () => {
                      if (isNotNullish(cardTypeValue)) {
                        return t("paymentLink.cardNotSupported.withCardType", {
                          cardType: cardTypeValue,
                        });
                      } else {
                        return t("paymentLink.cardNotSupported.withoutCardType");
                      }
                    })
                    .otherwise(() => " ")}
                </LakeText>
              </Box>
            </>
          )}
        />
      </Box>

      <Box direction={large ? "row" : "column"}>
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
                    {match({ expiryDateState, expiryDateHasBeenBlurred })
                      .with({ expiryDateState: "invalid", expiryDateHasBeenBlurred: true }, () =>
                        t("paymentLink.invalidExpiryDate"),
                      )
                      .with({ expiryDateState: "empty" }, () => t("paymentLink.expiryDateRequired"))
                      .otherwise(() => " ")}
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
                  style={match({ cvvState, cvvHasBeenBlurred })
                    .with(
                      { cvvState: "invalid", cvvHasBeenBlurred: true },
                      { cvvState: "empty" },
                      () => ({
                        borderColor: colors.negative[400],
                      }),
                    )
                    .with({ cvvState: P.union("untouched", "valid") }, () => undefined)
                    .otherwise(() => undefined)}
                >
                  {/* <!-- cvv frame will be added here --> */}
                </div>

                <Box direction="row" style={styles.errorContainer}>
                  <LakeText variant="smallRegular" color={colors.negative[500]}>
                    {match({ cvvState, cvvHasBeenBlurred })
                      .with({ cvvState: "invalid", cvvHasBeenBlurred: true }, () =>
                        t("paymentLink.invalidCvv"),
                      )
                      .with({ cvvState: "empty" }, () => t("paymentLink.cvvRequired"))
                      .otherwise(() => " ")}
                  </LakeText>
                </Box>
              </>
            )}
          />
        </Box>
      </Box>

      <Space height={32} />

      <LakeButton color="partner" onPress={onPressSubmit} loading={isLoading} disabled={isSandbox}>
        {t("button.pay")}
      </LakeButton>
    </>
  );
};
