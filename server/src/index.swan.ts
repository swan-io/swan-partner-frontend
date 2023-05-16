/**
 * Notice
 * ---
 * This file the entrypoint for Swan's internal usage,
 * including specifics such as the slightly different token logic &
 * invitation emails.
 */
import { Future, Result } from "@swan-io/boxed";
import chalk from "chalk";
import fastifyJaeger from "fastify-jaeger";
import Mailjet from "node-mailjet";
import url from "node:url";
import path from "pathe";
import { P, match } from "ts-pattern";
import { string, validate } from "valienv";
import { exchangeToken } from "./api/oauth2.swan.js";
import { UnsupportedAccountCountryError, parseAccountCountry } from "./api/partner.js";
import { getAccountMembershipInvitationData } from "./api/partner.swan.js";
import {
  OnboardingRejectionError,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
} from "./api/unauthenticated.js";
import { InvitationConfig, start } from "./app.js";
import { env, url as validateUrl } from "./env.js";
import { AccountCountry, GetAccountMembershipInvitationDataQuery } from "./graphql/partner.js";
import { renderError } from "./views/error.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const countryTranslations: Record<AccountCountry, string> = {
  DEU: "German",
  ESP: "Spanish",
  FRA: "French",
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
    TRACING_SERVICE_NAME: string,
  },
});

const mailjet = Mailjet.apiConnect(additionalEnv.MAILJET_API_KEY, additionalEnv.MAILJET_API_SECRET);

const getMailjetInput = ({
  invitationData,
  requestLanguage,
}: {
  invitationData: GetAccountMembershipInvitationDataQuery;
  requestLanguage: string;
}) =>
  match(invitationData)
    .with(
      {
        inviterAccountMembership: {
          email: P.string,
          user: {
            firstName: P.string,
            lastName: P.string,
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
      ({ inviteeAccountMembership, inviterAccountMembership, projectInfo }) =>
        Result.Ok({
          Messages: [
            {
              To: [
                {
                  Email: inviteeAccountMembership.email,
                },
              ],
              TemplateID: match(requestLanguage)
                .with("fr", () => 2847188)
                .otherwise(() => 2850442), // "english"
              Subject: match(requestLanguage)
                .with("fr", () => `Rejoignez votre espace bancaire sur ${projectInfo.name}`)
                .otherwise(() => `Join your banking space on ${projectInfo.name}`),
              TemplateLanguage: true,
              Variables: {
                applicationName: projectInfo.name,
                logoUrl: projectInfo.logoUri,
                accountHolderName: inviterAccountMembership.account.holder.info.name,
                accountName: inviterAccountMembership.account.name,
                accountNumber: inviterAccountMembership.account.number,
                ctaUrl: `${env.BANKING_URL}/api/projects/${projectInfo.id}/invitation/${inviteeAccountMembership.id}`,
                ctaColor: projectInfo.accentColor,
                inviteeFirstName: inviteeAccountMembership.statusInfo.restrictedTo.firstName,
                inviterEmail: inviterAccountMembership.email,
                inviterFirstName: inviterAccountMembership.user.firstName,
                inviterLastName: inviterAccountMembership.user.lastName,
                projectName: projectInfo.name,
              },
            },
          ],
        }),
    )
    .otherwise(() => Result.Error(new Error("Invalid invitation data")));

const sendAccountMembershipInvitation = (invitationConfig: InvitationConfig) => {
  return getAccountMembershipInvitationData({
    accessToken: invitationConfig.accessToken,
    inviteeAccountMembershipId: invitationConfig.inviteeAccountMembershipId,
    inviterAccountMembershipId: invitationConfig.inviterAccountMembershipId,
  })
    .mapOkToResult(invitationData =>
      getMailjetInput({ invitationData, requestLanguage: invitationConfig.requestLanguage }),
    )
    .flatMapOk(data => {
      return Future.fromPromise(mailjet.post("send", { version: "v3.1" }).request(data));
    })
    .resultToPromise();
};

start({
  mode: env.NODE_ENV,
  httpsConfig:
    env.NODE_ENV === "development"
      ? {
          key: path.join(dirname, "../keys/_wildcard.swan.local-key.pem"),
          cert: path.join(dirname, "../keys/_wildcard.swan.local.pem"),
        }
      : undefined,
  sendAccountMembershipInvitation,
}).then(
  async ({ app, ports }) => {
    await app.register(fastifyJaeger, {
      serviceName: additionalEnv.TRACING_SERVICE_NAME,
    });

    app.post<{ Params: { projectId: string } }>(
      "/api/projects/:projectId/partner",
      async (request, reply) => {
        if (request.accessToken == undefined) {
          return reply.status(401).send("Unauthorized");
        }
        const projectUserToken = await exchangeToken(request.accessToken, {
          type: "AccountMemberToken",
          projectId: request.params.projectId,
        }).tapError(error => {
          request.log.error(error);
        });
        return reply.from(env.PARTNER_API_URL, {
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
     * e.g. /api/project/:projectId/invitation/:id/send?inviterAccountMembershipId=1234
     */
    app.post<{
      Querystring: Record<string, string>;
      Params: { inviteeAccountMembershipId: string; projectId: string };
    }>(
      "/api/projects/:projectId/invitation/:inviteeAccountMembershipId/send",
      async (request, reply) => {
        const inviterAccountMembershipId = request.query.inviterAccountMembershipId;
        if (inviterAccountMembershipId == null) {
          return reply.status(400).send("Missing inviterAccountMembershipId");
        }
        if (request.accessToken == undefined) {
          return reply.status(401).send("Unauthorized");
        }
        try {
          const result = await exchangeToken(request.accessToken, {
            type: "AccountMemberToken",
            projectId: request.params.projectId,
          })
            .tapError(error => {
              request.log.error(error);
            })
            .flatMapOk(accessToken =>
              Future.fromPromise(
                sendAccountMembershipInvitation({
                  accessToken,
                  requestLanguage: request.detectedLng,
                  inviteeAccountMembershipId: request.params.inviteeAccountMembershipId,
                  inviterAccountMembershipId,
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
            return reply.redirect(
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
            return renderError(reply, { status: 400, requestId: request.id as string });
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
            return reply.redirect(
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
            return renderError(reply, { status: 400, requestId: request.id as string });
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

    console.log(``);
    console.log(`${chalk.magenta("swan-partner-frontend")}`);
    console.log(`${chalk.white("---")}`);
    console.log(chalk.green(`${env.NODE_ENV === "development" ? "dev server" : "server"} started`));
    console.log(``);
    console.log(`${chalk.magenta("Banking")} -> ${env.BANKING_URL}`);
    console.log(`${chalk.magenta("Onboarding Individual")}`);
    onboardingCountries.forEach(({ cca3, name }) => {
      console.log(
        `  ${chalk.cyan(`${name} Account`)} -> ${
          env.ONBOARDING_URL
        }/onboarding/individual/start?accountCountry=${cca3}`,
      );
    });
    console.log(`${chalk.magenta("Onboarding Company")}`);
    onboardingCountries.forEach(({ cca3, name }) => {
      console.log(
        `  ${chalk.cyan(`${name} Account`)} -> ${
          env.ONBOARDING_URL
        }/onboarding/company/start?accountCountry=${cca3}`,
      );
    });
    console.log(`${chalk.white("---")}`);
    console.log(``);
    console.log(``);
  },
  err => {
    console.error(err);
    process.exit(1);
  },
);
