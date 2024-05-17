import { Option, Result } from "@swan-io/boxed";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { P, isMatching } from "ts-pattern";

const isClosePopupData = isMatching({
  source: "onboarding",
  event: "closePopup",
  redirectUrl: P.string,
});

type GuardType<T> = T extends (value: unknown) => value is infer R ? R : never;
type ClosePopupData = GuardType<typeof isClosePopupData>;

let callback: ((redirectUrl: string) => void) | undefined = undefined;

const onMessage = ({ data, origin }: { data: unknown; origin: string }) => {
  if (
    origin === window.location.origin && // prevent cross-origin issues
    isClosePopupData(data) &&
    isNotNullish(callback)
  ) {
    callback(data.redirectUrl);
    callback = undefined;
    window.removeEventListener("message", onMessage);
  }
};

export const openPopup = ({ url, onClose }: { url: string; onClose: typeof callback }) => {
  const height = 800;
  const width = 500;

  const screenLeft = window.screenLeft ?? window.screenX;
  const screenRight = window.screenTop ?? window.screenY;
  const { outerHeight, outerWidth } = window;

  const params = [
    `left=${screenLeft + outerWidth - (width / 2 + outerWidth / 2)}`,
    `top=${screenRight + outerHeight - (height / 2 + outerHeight / 2)}`,
    `height=${height}`,
    `width=${width}`,
    "menubar=no",
    "status=no",
    "toolbar=no",
  ];

  const popup = window.open(url, "Swan", params.join(","));

  if (isNotNullish(popup)) {
    // listen for messages from the popup window
    window.addEventListener("message", onMessage);

    callback = redirectUrl => {
      onClose?.(redirectUrl); // trigger user callback
      popup?.close?.();
    };

    // https://stackoverflow.com/a/48240128
    const interval = setInterval(() => {
      if (popup?.closed === true) {
        window.removeEventListener("message", onMessage);
        callback = undefined;
        clearInterval(interval);
      }
    }, 100);
  }
};

// need to be called inside popup
export const closePopup = (redirectUrl: string): Result<void, unknown> => {
  const opener = window.opener as Window | undefined;

  const data: ClosePopupData = {
    source: "onboarding",
    event: "closePopup",
    redirectUrl,
  };

  return Option.fromNullable(opener)
    .toResult(null)
    .flatMap(opener => Result.fromExecution(() => opener.postMessage(data, "*")));
};
