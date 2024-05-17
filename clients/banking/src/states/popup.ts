import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { atom } from "react-atomic-state";

type Data = { type: "close-popup" } | { type: "consent-id"; payload: string };

type State = {
  popup: Window | null;
  timer: number | null;
  onClose: (() => void) | null;
};

const initialState: State = {
  popup: null,
  timer: null,
  onClose: null,
};

const state = atom<State>(initialState);

const closePopup = () => {
  const { popup, timer, onClose } = state.get();

  window.removeEventListener("message", onMessage);
  isNotNullish(timer) && clearInterval(timer);

  onClose?.(); // trigger user callback
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
      return closePopup();
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
  onClose?: (() => void) | null;
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

// need to be called inside popup
export const dispatchToPopupOpener = (data: Data): boolean => {
  const opener = window.opener as Window | undefined;

  if (isNotNullish(opener)) {
    opener.postMessage(data, opener.origin);
    return true;
  }

  return false;
};
