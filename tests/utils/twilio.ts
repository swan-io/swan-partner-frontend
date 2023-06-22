import { P, isMatching } from "ts-pattern";
import { env } from "./env";
import { assertIsDefined, fetchOk, retry, seconds } from "./functions";

const bodyContainsMessages = isMatching({ messages: P.array({ body: P.string }) });

export const getLastMessages = (options: { startDate?: Date } = {}): Promise<string[]> => {
  const request = async () => {
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_ID}/Messages.json`,
    );

    url.searchParams.set("To", env.PHONE_NUMBER);

    if (options.startDate) {
      url.searchParams.set("DateSent>", options.startDate.toISOString());
    }

    const response = await fetchOk(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.TWILIO_ACCOUNT_ID}:${env.TWILIO_AUTH_TOKEN}`,
        ).toString("base64")}`,
      },
    });

    const body: unknown = await response.json();
    return bodyContainsMessages(body) ? body.messages.map(message => message.body) : [];
  };

  return retry(request, {
    attempts: 5,
    delay: seconds(5),
  });
};

export const getLastMessageURL = async (options: { startDate?: Date } = {}): Promise<string> => {
  const message = (await getLastMessages(options))[0];

  if (message == null) {
    throw new Error(`No message in twilio ${env.PHONE_NUMBER} queue`);
  }

  const url = message
    .replace(/\n/g, " ")
    .split(" ")
    .find(word => word.match(/https?:\/\/.+/));

  assertIsDefined(url);
  return url;
};
