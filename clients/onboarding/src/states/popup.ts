import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { atom } from "react-atomic-state";

type Data = { type: "close-popup"; redirectUrl?: string };

type State = {
  popup: Window | null;
  timer: number | null;
  onClose: ((redirectUrl?: string) => void) | null;
};

const initialState: State = {
  popup: null,
  timer: null,
  onClose: null,
};

const state = atom<State>(initialState);

const closePopup = (redirectUrl?: string) => {
  const { popup, timer, onClose } = state.get();

  window.removeEventListener("message", onMessage);
  isNotNullish(timer) && clearInterval(timer);

  onClose?.(redirectUrl); // trigger user callback
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  popup?.close?.(); // popup instance might not exist

  state.set(initialState);
};

const onMessage = ({ data, origin }: { data: Data; origin: string }) => {
  if (origin !== window.location.origin) {
    return; // prevent cross-origin issues
  }

  switch (data.type) {
    case "close-popup":
      return closePopup(data.redirectUrl);
  }
};

export const openPopup = ({
  url,
  width = 500,
  height = 800,
  onClose = null,
}: {
  url: string;
  width?: number;
  height?: number;
  onClose?: ((redirectUrl?: string) => void) | null;
}) => {
  if (isNullish(state.get().popup)) {
    window.addEventListener("message", onMessage); // listen for messages from the popup window
  }

  const screenLeft = window.screenLeft ?? window.screenX; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
  const screenRight = window.screenTop ?? window.screenY; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
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

  state.set(prevState => ({
    ...prevState,
    popup: window.open(url, "Swan", params.join(",")),
    onClose,
    // https://stackoverflow.com/a/48240128
    timer: setInterval(() => {
      const { popup } = state.get();

      if (isNotNullish(popup) && popup.closed) {
        closePopup();
      }
    }, 100) as unknown as number,
  }));
};

const EXTRA_ALLOWED_ORIGIN = `https://dashboard.${location.hostname.split(".").slice(1).join(".")}`;

// need to be called inside popup
export const dispatchToPopupOpener = (data: Data): boolean => {
  let origin = EXTRA_ALLOWED_ORIGIN;
  const opener = window.opener as Window | undefined;

  try {
    if (opener != null) {
      origin = opener.origin;
    }
  } catch (err) {
    // do nothing
  }

  if (isNotNullish(opener)) {
    opener.postMessage(data, origin);
    return true;
  }

  return false;
};
