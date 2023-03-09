// based on https://gist.github.com/ncou/3a0a1f89c8e22416d0d607f621a948a9

export type ControllableTimeout = {
  readonly duration: number;
  readonly clear: () => void;
  readonly reset: () => void;
};

export const createControllableTimeout = (config: {
  duration: number;
  onStart: (duration: number) => void;
  onEnd: () => void;
  onReset: (duration: number) => void;
}): ControllableTimeout => {
  const { duration, onStart, onReset, onEnd } = config;
  let timerId = 0;
  let remaining = duration;

  const clear = () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.clearTimeout(timerId);
  };

  const start = () => {
    if (remaining <= 0) {
      return;
    }

    timerId = window.setTimeout(() => {
      remaining = 0;
      clear();
      onEnd();
    }, remaining);

    onStart(duration);
  };

  const reset = () => {
    window.clearTimeout(timerId);

    remaining = duration;

    timerId = window.setTimeout(() => {
      remaining = 0;
      clear();
      onEnd();
    }, duration);

    onReset(duration);
  };

  const onVisibilityChange = () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    start();
  };

  if (document.hidden) {
    document.addEventListener("visibilitychange", onVisibilityChange);
  } else {
    start();
  }

  return {
    duration,
    clear,
    reset,
  };
};
