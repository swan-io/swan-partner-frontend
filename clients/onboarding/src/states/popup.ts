import { Option, Result } from "@swan-io/boxed";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { atom } from "react-atomic-state";

type Data = { type: "closePopup"; redirectUrl?: string };

type State = {
  popup: Window | null;
  onDispatch: ((data: Data) => void) | null;
};

const dataTypes = deriveUnion<Data["type"]>({
  closePopup: true,
});

const state = atom<State>({
  popup: null,
  onDispatch: null,
});

const onMessage = ({ data, origin }: { data: Data; origin: string }) => {
  if (origin !== window.location.origin) {
    return; // prevent cross-origin issues
  }
  if (!dataTypes.is(data.type)) {
    return; // unknown message
  }

  const { popup, onDispatch } = state.get();

  window.removeEventListener("message", onMessage);

  onDispatch?.(data); // trigger user callback
  state.reset();
  popup?.close?.(); // popup instance might not exist
};

export const openPopup = ({
  url,
  height = 800,
  width = 500,
  onDispatch = null,
}: {
  width?: number;
  url: string;
  height?: number;
  onDispatch?: ((data: Data) => void) | null;
}) => {
  if (isNullish(state.get().popup)) {
    window.addEventListener("message", onMessage); // listen for messages from the popup window
  }

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

  state.set({
    popup: window.open(url, "Swan", params.join(",")),
    onDispatch,
  });
};

const EXTRA_ALLOWED_ORIGIN = `https://dashboard.${location.hostname.split(".").slice(1).join(".")}`;

// need to be called inside popup
export const dispatchToPopupOpener = (data: Data) => {
  const opener = window.opener as Window | undefined;

  return Option.fromNullable(opener)
    .toResult(null)
    .flatMap(opener => {
      // access to origin might throw
      const origin = Result.fromExecution(() => opener.origin)
        .toOption()
        .getWithDefault(EXTRA_ALLOWED_ORIGIN);

      // For some reason, we might have `SecurityError` if we have an `window.opener` but domains don't match
      // Let's catch that and act accordingly.
      // NOTE: the error, even though it's caught, will be displayed in Safari's console
      return Result.fromExecution(() => opener.postMessage(data, origin));
    });
};
