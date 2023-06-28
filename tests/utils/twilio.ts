import { P, isMatching } from "ts-pattern";
import { env } from "./env";
import { assertIsDefined, fetchOk, retry, seconds } from "./functions";

type NonEmptyArray = [string, ...string[]];

const bodyContainsMessages = isMatching({
  messages: P.array({ body: P.string }),
});

export const getLastMessages = (startDate: Date): Promise<NonEmptyArray> => {
  const request = async () => {
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_ID}/Messages.json`,
    );

    url.searchParams.set("To", env.PHONE_NUMBER);
    url.searchParams.set("DateSent>", startDate.toISOString());

    const response = await fetchOk(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.TWILIO_ACCOUNT_ID}:${env.TWILIO_AUTH_TOKEN}`,
        ).toString("base64")}`,
      },
    });

    const body: unknown = await response.json();

    if (!bodyContainsMessages(body) || body.messages[0] == null) {
      throw new Error(`No message in twilio ${env.PHONE_NUMBER} queue`);
    }

    const [head, ...tail] = body.messages;
    const messages: NonEmptyArray = [head.body, ...tail.map(({ body }) => body)];
    return messages;
  };

  return retry(request, {
    attempts: 5,
    delay: seconds(5),
  });
};

export const getLastMessageURL = async (startDate: Date): Promise<string> => {
  const message = (await getLastMessages(startDate))[0];

  const url = message
    .replace(/\n/g, " ")
    .split(" ")
    .find(word => word.match(/https?:\/\/.+/));

  assertIsDefined(url);
  return url;
};
