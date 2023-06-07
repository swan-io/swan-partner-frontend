import { P, isMatching } from "ts-pattern";
import { env } from "./env";
import { assertIsDefined, log, seconds } from "./functions";
import { retry } from "./retry";

const bodyContainsMessages = isMatching({ messages: P.array({ body: P.string }) });

const getLastMessage = (startDate: Date): Promise<string> => {
  const request = async () => {
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_ID}/Messages.json`,
    );

    url.searchParams.set("To", env.E2E_PHONE_NUMBER);
    url.searchParams.set("DateSent>", startDate.toISOString());

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
    const message = bodyContainsMessages(body) ? body.messages[0]?.body : undefined;

    if (message == null) {
      throw new Error(`No message in twilio ${env.E2E_PHONE_NUMBER} queue`);
    }

    return message;
  };

  return retry(request, {
    delay: seconds(5),
    maxAttempts: 5,
  });
};

export const getLastMessageURL = async (startDate: Date): Promise<string> => {
  const message = await getLastMessage(startDate);

  const url = message
    .replace(/\n/g, " ")
    .split(" ")
    .find(word => word.match(/https?:\/\/.+/));

  assertIsDefined(url);
  return url;
};
