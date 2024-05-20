import { Future, Option, Result } from "@swan-io/boxed";
import { P, isMatching } from "ts-pattern";

const SOURCE_NAME = "Swan";
const EVENT_NAME = "closePopup";

const AUTH_WINDOW_WIDTH = 500;
const AUTH_WINDOW_HEIGHT = 800;

const dataPattern = {
  source: SOURCE_NAME,
  event: EVENT_NAME,
  redirectUrl: P.optional(P.string),
} as const;

let currentFuture: Future<Option<string>> | undefined;

export const openPopup = (url: string) => {
  // opened a new popup, cancel the previous flow
  if (currentFuture != null) {
    currentFuture.cancel();
  }

  const future = Future.make<Option<string>>(resolve => {
    const screenLeft = window.screenLeft ?? window.screenX;
    const screenRight = window.screenTop ?? window.screenY;
    const { outerHeight, outerWidth } = window;

    const params = [
      `left=${screenLeft + outerWidth - (AUTH_WINDOW_WIDTH / 2 + outerWidth / 2)}`,
      `top=${screenRight + outerHeight - (AUTH_WINDOW_HEIGHT / 2 + outerHeight / 2)}`,
      `height=${AUTH_WINDOW_HEIGHT}`,
      `width=${AUTH_WINDOW_WIDTH}`,
      "menubar=no",
      "status=no",
      "toolbar=no",
    ];

    const popup = window.open(url, SOURCE_NAME, params.join(","));

    const intervalId = setInterval(() => {
      // `null` means that the popup couldn't be open
      // `closed` means that an external event closed it
      if (popup == null || popup.closed) {
        future.cancel();
      }
    }, 100);

    const stopListening = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(intervalId);
    };

    const onMessage = ({ data }: MessageEvent<unknown>) => {
      if (isMatching(dataPattern, data)) {
        if (popup != null) {
          popup.close();
        }

        resolve(Option.fromNullable(data.redirectUrl));
        stopListening();
      }
    };

    // listen for messages from the popup window
    window.addEventListener("message", onMessage);

    return () => {
      stopListening();
    };
  });

  currentFuture = future;
  return future;
};

// will be called inside popup
export const sendClosePopupMessage = (redirectUrl: Option<string>) => {
  const opener = window.opener as Window | undefined;

  const data: P.infer<typeof dataPattern> = {
    source: SOURCE_NAME,
    event: EVENT_NAME,
    redirectUrl: redirectUrl.toUndefined(),
  };

  return Option.fromNullable(opener)
    .toResult(new Error("Opener not accessible"))
    .flatMap(opener => Result.fromExecution(() => opener.postMessage(data, "*")));
};
