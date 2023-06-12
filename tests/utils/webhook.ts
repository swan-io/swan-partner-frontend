import { env } from "./env";
import { log } from "./functions";
import { getSession } from "./session";

const tokenToEmail = (token: string) => `${token}@email.webhook.site`;
const emailToToken = (email: string) => email.split("@")[0];

const request = <T>(input: string, init?: RequestInit) =>
  fetch("https://webhook.site" + input, {
    ...init,
    headers: {
      "Api-Key": env.WEBHOOK_SITE_API_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
    .then(async response => {
      if (!response.ok) {
        log.error(`Fetch failed with code ${response.status}: ${await response.text()}`);
        throw response;
      }

      return response;
    })
    .then(response => {
      return response.json() as T;
    });

const createToken = (): Promise<string> =>
  request<{ uuid: string }>("/token", {
    method: "POST",
  }).then(({ uuid }) => uuid);

const deleteToken = (token: string) =>
  request(`/token/${token}`, {
    method: "DELETE",
  });

export const createEmailAddress = async (): Promise<string> => {
  const token = await createToken();
  const email = tokenToEmail(token);

  log.info(`Successfully created email address ${email}`);

  return email;
};

export const resetEmailAddresses = async () => {
  const tokens: string[] = await getSession()
    .then(({ benady, saison }) =>
      [benady.email, saison.email]
        .map(email => emailToToken(email))
        .filter((token): token is string => token != null),
    )
    .catch(() => []);

  if (tokens.length > 0) {
    await Promise.all(
      tokens.map(token =>
        deleteToken(token).then(() => {
          const email = `${token}@email.webhook.site`;
          log.info(`Successfully deleted email address ${email}`);
        }),
      ),
    );
  }
};
