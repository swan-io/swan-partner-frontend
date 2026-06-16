import { Future, Result } from "@swan-io/boxed";
import { describe, expect, it } from "vitest";
import { pollUntilOk } from "./polling";

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe("pollUntilOk", () => {
  it("resolves Ok and stops after the first successful attempt", async () => {
    let attempts = 0;

    const result = await pollUntilOk(
      () => {
        attempts += 1;
        return Future.value(Result.Ok<string, undefined>("ok"));
      },
      { maxAttempts: 5, intervalMs: 1 },
    ).toPromise();

    expect(result.isOk()).toBe(true);
    expect(result.match({ Ok: value => value, Error: () => "" })).toBe("ok");
    expect(attempts).toBe(1);
  });

  it("retries while the attempt returns Error, then resolves Ok", async () => {
    let attempts = 0;

    const result = await pollUntilOk(
      () => {
        attempts += 1;
        return attempts < 3
          ? Future.value(Result.Error<string, string>("not ready"))
          : Future.value(Result.Ok<string, string>("ok"));
      },
      { maxAttempts: 5, intervalMs: 1 },
    ).toPromise();

    expect(result.isOk()).toBe(true);
    expect(attempts).toBe(3);
  });

  it("gives up after maxAttempts and resolves with the last error", async () => {
    let attempts = 0;

    const result = await pollUntilOk(
      () => {
        attempts += 1;
        return Future.value(Result.Error<string, string>(`error-${attempts}`));
      },
      { maxAttempts: 4, intervalMs: 1 },
    ).toPromise();

    expect(result.isError()).toBe(true);
    expect(result.match({ Ok: () => "", Error: error => error })).toBe("error-4");
    expect(attempts).toBe(4);
  });

  it("stops the loop when the returned future is cancelled", async () => {
    let attempts = 0;

    const future = pollUntilOk(
      () => {
        attempts += 1;
        return Future.value(Result.Error<string, undefined>(undefined));
      },
      { maxAttempts: 5, intervalMs: 50 },
    );

    // Cancel during the first wait, before any attempt runs.
    future.cancel();

    // Wait well past when the first (and subsequent) attempts would have fired.
    await sleep(120);

    expect(attempts).toBe(0);
  });
});
