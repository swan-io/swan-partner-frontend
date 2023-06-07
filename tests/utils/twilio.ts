import { P, isMatching } from "ts-pattern";
import { env } from "./env";
import { assertIsDefined, log, seconds } from "./functions";
import { retry } from "./retry";

const bodyContainsMessages = isMatching({ messages: P.array({ body: P.string }) });

export const getLastMessages = (options: { DateSent?: Date } = {}): Promise<string[]> => {
  const request = async () => {
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_ID}/Messages.json`,
    );

    url.searchParams.set("To", env.E2E_PHONE_NUMBER);

    if (options.DateSent) {
      url.searchParams.set("DateSent>", options.DateSent.toISOString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.TWILIO_ACCOUNT_ID}:${env.TWILIO_AUTH_TOKEN}`,
        ).toString("base64")}`,
      },
    });

    if (!response.ok) {
      log.error(
        `Fetch failed with code ${response.status}:${JSON.stringify(await response.json())}`,
      );
      throw response;
    }

    const body: unknown = await response.json();
    return bodyContainsMessages(body) ? body.messages.map(message => message.body) : [];
  };

  return retry(request, {
    maxAttempts: 5,
    delay: seconds(5),
  });
};

export const getLastMessageURL = async (options: { DateSent?: Date } = {}): Promise<string> => {
  const message = (await getLastMessages(options))[0];

  if (message == null) {
    throw new Error(`No message in twilio ${env.E2E_PHONE_NUMBER} queue`);
  }

  const url = message
    .replace(/\n/g, " ")
    .split(" ")
    .find(word => word.match(/https?:\/\/.+/));

  assertIsDefined(url);
  return url;
};
