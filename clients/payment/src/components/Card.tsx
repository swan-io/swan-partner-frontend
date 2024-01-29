import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Frames } from "frames-react";
import { useEffect } from "react";
import { env } from "../utils/env";
import { t } from "../utils/i18n";

export const Card = () => {
  useEffect(() => {
    Frames.init({
      publicKey: env.CLIENT_CHECKOUT_API_KEY,
      style: {
        base: {
          borderStyle: "solid",
          borderWidth: "1px",
          borderColor: "#e8e7e8",
          borderRadius: "6px",
          height: "40px",
          paddingLeft: "12px",
          fontFamily:
            "Inter, -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
          fontSize: "16px",
          // fontStyle: "normal",
          color: "#2b2f30",
          letterSpacing: "-0.011em",
          backgroundColor: "#ffffff",
        },
      },
    });
  }, []);

  return (
    <>
      <style>
        {".card-number-frame, .expiry-date-frame, .cvv-frame, iframe { height: 62px !important; }"}
      </style>

      <LakeLabel
        label={t("paymentLink.postalCode")}
        render={() => (
          <div className="card-number-frame">{/* <!-- card number will be added here --> */}</div>
        )}
      />

      <LakeLabel
        label={t("paymentLink.postalCode")}
        render={() => (
          <div className="expiry-date-frame">{/* <!-- expiry date will be added here --> */}</div>
        )}
      />

      <LakeLabel
        label={t("paymentLink.postalCode")}
        render={() => (
          <div className="cvv-frame">{/* <!-- cvv frame will be added here --> */}</div>
        )}
      />

      <button
        onClick={() => {
          Frames.submitCard()
            .then(obj => console.log(obj))
            .catch(err => console.error(err));
        }}
      >
        Submit
      </button>
    </>
  );
};
