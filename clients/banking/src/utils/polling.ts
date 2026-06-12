import { Future, Result } from "@swan-io/boxed";

type Options = {
  maxAttempts: number;
  /** Delay before each attempt, including the first. Defaults to 1000ms. */
  intervalMs?: number;
};

/**
 * Waits `intervalMs`, runs `attempt`, repeats while it returns `Error` (up to `maxAttempts`).
 * Cancelling the returned future stops the loop — unlike `Future.retry`, which keeps polling.
 */
export const pollUntilOk = <Ok, Err>(
  attempt: () => Future<Result<Ok, Err>>,
  { maxAttempts, intervalMs = 1000 }: Options,
): Future<Result<Ok, Err>> => {
  let isStopped = false;
  let pendingWait: Future<void> | undefined;

  const loop = (attemptsLeft: number): Future<Result<Ok, Err>> => {
    const wait = Future.wait(intervalMs);
    pendingWait = wait;

    return wait.flatMap(() =>
      attempt().flatMapError(error =>
        attemptsLeft > 1 && !isStopped
          ? loop(attemptsLeft - 1)
          : Future.value(Result.Error(error)),
      ),
    );
  };

  const future = loop(maxAttempts);

  future.onCancel(() => {
    isStopped = true;
    pendingWait?.cancel();
  });

  return future;
};
