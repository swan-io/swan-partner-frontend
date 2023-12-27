import { Frames } from "frames-react";
import { useEffect } from "react";
import { env } from "../utils/env";
import "./styles.css";

export const Card = () => {
  useEffect(() => {
    Frames.init({
      publicKey: env.CLIENT_CHECKOUT_API_KEY,
    });
  }, []);

  return (
    <>
      <div className="card-number-frame">{/* <!-- card number will be added here --> */}</div>
      <div className="expiry-date-frame">{/* <!-- expiry date will be added here --> */}</div>
      <div className="cvv-frame">{/* <!-- cvv frame will be added here --> */}</div>

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
