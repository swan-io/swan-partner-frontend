import { env } from "./env";
import { fetchOk, log } from "./functions";
import { getSession } from "./session";

const tokenToEmail = (token: string) => `${token}@email.webhook.site`;
const emailToToken = (email: string) => email.split("@")[0];

const request = (input: string, init?: RequestInit) =>
  fetchOk("https://webhook.site" + input, {
    ...init,
    headers: {
      "Api-Key": env.WEBHOOK_SITE_API_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

const createToken = (): Promise<string> =>
  request("/token", {
    method: "POST",
  })
    .then(response => response.json())
    .then(({ uuid }: { uuid: string }) => uuid);

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
