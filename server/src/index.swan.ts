/**
 * Notice
 * ---
 * This file the entrypoint for Swan's internal usage,
 * including specifics such as the slightly different token logic &
 * invitation emails.
 */
import { Future, Option, Result } from "@swan-io/boxed";
import Mailjet from "node-mailjet";
import pc from "picocolors";
import { P, match } from "ts-pattern";
import { string, validate, url as validateUrl } from "valienv";
import { exchangeToken } from "./api/oauth2.swan";
import { UnsupportedAccountCountryError, parseAccountCountry, sdk, toFuture } from "./api/partner";
import { getAccountMembershipInvitationData } from "./api/partner.swan";
import {
  OnboardingRejectionError,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
} from "./api/unauthenticated";
import { InvitationConfig, start } from "./app";
import { env } from "./env";
import { replyWithError } from "./error";
import { AccountCountry, GetAccountMembershipInvitationDataQuery } from "./graphql/partner";
import { getCalledMutations } from "./utils/gql";
import {
  isMutationAuthorizedInWebBanking,
  isMutationRestrictedByWebBankingSettings,
} from "./utils/permissions";

const countryTranslations: Record<AccountCountry, string> = {
  DEU: "German",
  ESP: "Spanish",
  FRA: "French",
  NLD: "Dutch",
  ITA: "Italian",
  BEL: "Belgian",
};

const accountCountries = Object.keys(countryTranslations) as AccountCountry[];

const onboardingCountries = accountCountries
  .map(accountCountry => ({
    cca3: accountCountry,
    name: countryTranslations[accountCountry],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const additionalEnv = validate({
  env: process.env,
  validators: {
    SWAN_AUTH_URL: validateUrl,
    MAILJET_API_KEY: string,
    MAILJET_API_SECRET: string,
  },
});

const mailjet = Mailjet.apiConnect(additionalEnv.MAILJET_API_KEY, additionalEnv.MAILJET_API_SECRET);

const swanLogoUrl = "https://data.swan.io/logo-swan.png";
const swanColorHex = "#6240B5";

const getMailjetInput = ({
  invitationData,
  language,
}: {
  invitationData: GetAccountMembershipInvitationDataQuery;
  language: string;
}) =>
  match(invitationData)
    .with(
      {
        inviterAccountMembership: {
          email: P.string,
          user: {
            firstName: P.string,
            preferredLastName: P.string,
          },
          account: {
            name: P.string,
            number: P.string,
            holder: {
              info: {
                name: P.string,
              },
            },
          },
        },
        inviteeAccountMembership: {
          id: P.string,
          email: P.string,
          statusInfo: {
            __typename: "AccountMembershipInvitationSentStatusInfo",
            restrictedTo: {
              firstName: P.string,
            },
          },
        },
      },
      ({ inviteeAccountMembership, inviterAccountMembership, projectInfo }) => {
        const ctaUrl = new URL(
          `${env.BANKING_URL}/api/projects/${projectInfo.id}/invitation/${inviteeAccountMembership.id}`,
        );
        ctaUrl.searchParams.append("identificationLevel", "Auto");
        if (inviteeAccountMembership.statusInfo.restrictedTo.phoneNumber == null) {
          ctaUrl.searchParams.append("email", inviteeAccountMembership.email);
        }
        return Result.Ok({
          Messages: [
            {
              To: [
                {
                  Email: inviteeAccountMembership.email,
                },
              ],
              TemplateID: match(language)
                .with("es", () => 5987020)
                .with("de", () => 5987124)
                .with("fr", () => 2725624)
                .with("it", () => 5987088)
                .with("nl", () => 5987163)
                .with("pt", () => 5987107)
                .with("fi", () => 5987184)
                .otherwise(() => 2850442), // English
              Subject: match(language)
                .with("es", () => `Únete a tu espacio bancario en ${projectInfo.name}`)
                .with("de", () => `Treten Sie Ihrem Bankraum bei ${projectInfo.name} bei`)
                .with("fr", () => `Rejoignez votre espace bancaire sur ${projectInfo.name}`)
                .with("it", () => `Unisciti al tuo spazio bancario su ${projectInfo.name}`)
                .with("nl", () => `Sluit je aan bij jouw bankomgeving op ${projectInfo.name}`)
                .with("pt", () => `Junte-se ao seu espaço bancário em ${projectInfo.name}`)
                // .with("fi", () => `Liity pankkitilaasi palvelussa ${projectInfo.name}`) // Finnish is not ready yet
                .otherwise(() => `Join your banking space on ${projectInfo.name}`), // English
              TemplateLanguage: true,
              Variables: {
                applicationName: projectInfo.name,
                logoUrl: projectInfo.logoUri ?? swanLogoUrl,
                accountHolderName: inviterAccountMembership.account.holder.info.name,
                accountName: inviterAccountMembership.account.name,
                accountNumber: inviterAccountMembership.account.number,
                ctaUrl: ctaUrl.toString(),
                ctaColor: projectInfo.accentColor ?? swanColorHex,
                inviteeFirstName: inviteeAccountMembership.statusInfo.restrictedTo.firstName,
                inviterEmail: inviterAccountMembership.email,
                inviterFirstName: inviterAccountMembership.user.firstName,
                inviterLastName: inviterAccountMembership.user.preferredLastName,
                projectName: projectInfo.name,
              },
            },
          ],
        });
      },
    )
    .otherwise(() => Result.Error(new Error("Invalid invitation data")));

class MailjetError extends Error {}

const sendAccountMembershipInvitation = (invitationConfig: InvitationConfig) => {
  return getAccountMembershipInvitationData({
    accessToken: invitationConfig.accessToken,
    inviteeAccountMembershipId: invitationConfig.inviteeAccountMembershipId,
    inviterAccountMembershipId: invitationConfig.inviterAccountMembershipId,
  })
    .mapOkToResult(invitationData =>
      getMailjetInput({
        invitationData,
        language: invitationConfig.language,
      }),
    )
    .flatMapOk(data => {
      return Future.fromPromise(mailjet.post("send", { version: "v3.1" }).request(data));
    })
    .mapOkToResult(response => {
      const isOk = response.response.status >= 200 && response.response.status < 300;
      return isOk
        ? Result.Ok(true)
        : Result.Error(new MailjetError(JSON.stringify(response.response.data)));
    })
    .resultToPromise();
};

const partnerPickerUrl = new URL(env.BANKING_URL);
const [...envHostName] = partnerPickerUrl.hostname.split(".");
partnerPickerUrl.hostname = ["partner", ...envHostName].join(".");
if (env.NODE_ENV === "development") {
  partnerPickerUrl.port = "8080";
}

start({
  allowedCorsOrigins: [partnerPickerUrl.origin],
  sendAccountMembershipInvitation,
}).then(
  ({ app, ports }) => {
    app.post<{ Params: { projectId: string } }>(
      "/api/projects/:projectId/partner",
      async (request, reply) => {
        const projectUserToken =
          request.accessToken == null
            ? Result.Ok(Option.None())
            : await exchangeToken(request.accessToken, {
                type: "AccountMemberToken",
                projectId: request.params.projectId,
              })
                .mapOk(token => Option.Some(token))
                .tapError(error => {
                  request.log.error(error);
                });

        const calledMutations = match(request.body)
          .with({ query: P.string }, ({ query }) => getCalledMutations(query))
          .otherwise(() => []);

        // if at least one mutation is restricted by web banking settings
        // we need to fetch the settings and check if the mutation is authorized
        if (calledMutations.some(isMutationRestrictedByWebBankingSettings)) {
          const webBankingSettings = await toFuture(
            sdk.WebBankingSettings(
              {},
              match(projectUserToken)
                .with(Result.P.Ok(Option.P.Some(P.select())), token => ({
                  "x-swan-token": `Bearer ${token}`,
                }))
                .otherwise(() => ({})),
            ),
          ).mapOkToResult(({ projectInfo }) =>
            projectInfo.webBankingSettings != null
              ? Result.Ok(projectInfo.webBankingSettings)
              : Result.Error(new Error("Web banking settings not found")),
          );

          if (webBankingSettings.isError()) {
            request.log.error("Failed to fetch web banking settings");
            request.log.error(webBankingSettings.error);
            return reply.internalServerError();
          }

          const isAuthorized = calledMutations
            .filter(isMutationRestrictedByWebBankingSettings)
            .every(mutationName =>
              isMutationAuthorizedInWebBanking(mutationName, webBankingSettings.value),
            );

          if (!isAuthorized) {
            request.log.warn("Unauthorized mutation attempted");
            request.log.warn(calledMutations);
            return reply.forbidden();
          }
        }

        return reply.from(env.PARTNER_API_URL, {
          rewriteRequestHeaders: (_req, headers) => ({
            ...headers,
            ...match(projectUserToken)
              .with(Result.P.Ok(Option.P.Some(P.select())), token => ({
                "x-swan-token": `Bearer ${token}`,
              }))
              .otherwise(() => null),
          }),
        });
      },
    );

    app.post<{ Params: { projectId: string } }>(
      "/api/projects/:projectId/partner-admin",
      async (request, reply) => {
        if (request.accessToken == null) {
          return reply.status(401).send("Unauthorized");
        }
        const projectUserToken = await exchangeToken(request.accessToken, {
          type: "AccountMemberToken",
          projectId: request.params.projectId,
        }).tapError(error => {
          request.log.error(error);
        });
        return reply.from(env.PARTNER_ADMIN_API_URL, {
          rewriteRequestHeaders: (_req, headers) => ({
            ...headers,
            ...match(projectUserToken)
              .with(Result.P.Ok(P.select()), token => ({
                "x-swan-token": `Bearer ${token}`,
              }))
              .otherwise(() => null),
          }),
        });
      },
    );

    /**
     * Send an account membership invitation
     * e.g. /api/project/:projectId/invitation/:inviteeAccountMembershipId/send?inviterAccountMembershipId=1234&lang=en
     */
    app.post<{
      Params: { projectId: string; inviteeAccountMembershipId: string };
      Querystring: Record<string, string>;
    }>(
      "/api/projects/:projectId/invitation/:inviteeAccountMembershipId/send",
      async (request, reply) => {
        const { inviterAccountMembershipId, lang = "en" } = request.query;

        if (inviterAccountMembershipId == null) {
          return reply.status(400).send("Missing inviterAccountMembershipId");
        }
        if (request.accessToken == null) {
          return reply.status(401).send("Unauthorized");
        }
        try {
          const result = await exchangeToken(request.accessToken, {
            type: "AccountMemberToken",
            projectId: request.params.projectId,
          })
            .flatMapOk(accessToken =>
              Future.fromPromise(
                sendAccountMembershipInvitation({
                  accessToken,
                  inviteeAccountMembershipId: request.params.inviteeAccountMembershipId,
                  inviterAccountMembershipId,
                  language: lang,
                }),
              ),
            )
            .resultToPromise();
          return reply.send({ success: result });
        } catch (err) {
          request.log.error(err);
          return reply.status(400).send("An error occured");
        }
      },
    );

    /**
     * Accept an account membership invitation
     * e.g. /api/projects/:projectId/invitation/:id
     */
    app.get<{
      Querystring: Record<string, string>;
      Params: { accountMembershipId: string; projectId: string };
    }>("/api/projects/:projectId/invitation/:accountMembershipId", async (request, reply) => {
      const queryString = new URLSearchParams();
      queryString.append("accountMembershipId", request.params.accountMembershipId);
      queryString.append("projectId", request.params.projectId);
      if (request.query.email != null) {
        queryString.append("email", request.query.email);
      }
      return reply.redirect(`/auth/login?${queryString.toString()}`);
    });

    /**
     * Starts a new individual onboarding and redirects to the onboarding URL
     * e.g. /onboarding/individual/start?accountCountry=FRA
     */
    app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
      "/projects/:projectId/onboarding/individual/start",
      async (request, reply) => {
        const accountCountry = parseAccountCountry(request.query.accountCountry);
        return Future.value(accountCountry)
          .flatMapOk(accountCountry =>
            onboardIndividualAccountHolder({ accountCountry, projectId: request.params.projectId }),
          )
          .tapOk(onboardingId => {
            return reply
              .header("cache-control", "private, max-age=0")
              .redirect(
                `${env.ONBOARDING_URL}/projects/${request.params.projectId}/onboardings/${onboardingId}`,
              );
          })
          .tapError(error => {
            match(error)
              .with(
                P.instanceOf(UnsupportedAccountCountryError),
                P.instanceOf(OnboardingRejectionError),
                error => request.log.warn(error),
              )
              .otherwise(error => request.log.error(error));

            return replyWithError(app, request, reply, {
              status: 400,
              requestId: request.id,
            });
          })
          .map(() => undefined);
      },
    );

    /**
     * Starts a new company onboarding and redirects to the onboarding URL
     * e.g. /onboarding/individual/start?accountCountry=FRA
     */
    app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
      "/projects/:projectId/onboarding/company/start",
      async (request, reply) => {
        const accountCountry = parseAccountCountry(request.query.accountCountry);
        return Future.value(accountCountry)
          .flatMapOk(accountCountry =>
            onboardCompanyAccountHolder({ accountCountry, projectId: request.params.projectId }),
          )
          .tapOk(onboardingId => {
            return reply
              .header("cache-control", "private, max-age=0")
              .redirect(
                `${env.ONBOARDING_URL}/projects/${request.params.projectId}/onboardings/${onboardingId}`,
              );
          })
          .tapError(error => {
            match(error)
              .with(
                P.instanceOf(UnsupportedAccountCountryError),
                P.instanceOf(OnboardingRejectionError),
                error => request.log.warn(error),
              )
              .otherwise(error => request.log.error(error));

            return replyWithError(app, request, reply, {
              status: 400,
              requestId: request.id,
            });
          })
          .map(() => undefined);
      },
    );

    const listenPort = async (port: string) => {
      // Expose 8080 so that we don't need `sudo` to listen to the port
      // That's the port we expose when dockerized
      const finalPort = port === "80" || port === "443" ? "8080" : port;

      try {
        await app.listen({ port: Number(finalPort), host: "0.0.0.0" });
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    };

    ports.forEach(port => void listenPort(port));

    console.log("");
    console.log(`${pc.magenta("swan-partner-frontend")}`);
    console.log(`${pc.white("---")}`);
    console.log(pc.green(`${env.NODE_ENV === "development" ? "dev server" : "server"} started`));
    console.log("");
    console.log(`${pc.magenta("Banking")} -> ${env.BANKING_URL}`);
    console.log(`${pc.magenta("Onboarding Individual")}`);
    onboardingCountries.forEach(({ cca3, name }) => {
      console.log(
        `  ${pc.cyan(`${name} Account`)} -> ${
          env.ONBOARDING_URL
        }/onboarding/individual/start?accountCountry=${cca3}`,
      );
    });
    console.log(`${pc.magenta("Onboarding Company")}`);
    onboardingCountries.forEach(({ cca3, name }) => {
      console.log(
        `  ${pc.cyan(`${name} Account`)} -> ${
          env.ONBOARDING_URL
        }/onboarding/company/start?accountCountry=${cca3}`,
      );
    });
    console.log(`${pc.magenta("Payment")} -> ${env.PAYMENT_URL}`);
    console.log(`${pc.white("---")}`);
    console.log("");
    console.log("");
  },
  err => {
    console.error(err);
    process.exit(1);
  },
);
