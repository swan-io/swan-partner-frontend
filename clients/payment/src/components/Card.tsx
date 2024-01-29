import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Space } from "@swan-io/lake/src/components/Space";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { Frames } from "frames-react";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { env } from "../utils/env";

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1,
  },
});

export const Card = () => {
  const { desktop } = useResponsive();

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
      localization: {
        cardNumberPlaceholder: "1234 12•• •••• 1234",
        cvvPlaceholder: "XXX",
        expiryMonthPlaceholder: "MM",
        expiryYearPlaceholder: "YY",
      },
    });
  }, []);

  return (
    <>
      {/* We need this style tag to remove the default style provided by Checkout */}
      <style>
        {".card-number-frame, .expiry-date-frame, .cvv-frame, iframe { height: 62px !important; }"}
      </style>

      <LakeLabel
        label={"card number"}
        render={() => (
          <div className="card-number-frame">{/* <!-- card number will be added here --> */}</div>
        )}
      />

      <Box direction={desktop ? "row" : "column"}>
        <Box style={styles.grow}>
          <LakeLabel
            label={"expiry date"}
            render={() => (
              <div className="expiry-date-frame">
                {/* <!-- expiry date will be added here --> */}
              </div>
            )}
          />
        </Box>

        <Space width={24} />

        <Box style={styles.grow}>
          <LakeLabel
            label={"CVV"}
            render={() => (
              <div className="cvv-frame">{/* <!-- cvv frame will be added here --> */}</div>
            )}
          />
        </Box>
      </Box>

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
