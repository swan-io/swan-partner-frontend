/**
 * Notice
 * ---
 * This file the entrypoint for Swan's internal usage,
 * including specifics such as the slightly different token logic &
 * invitation emails.
 */
import { Future, Option, Result } from "@swan-io/boxed";
import pc from "picocolors";
import { P, match } from "ts-pattern";
import { exchangeToken } from "./api/oauth2.swan";
import {
  UnsupportedAccountCountryError,
  createPublicCompanyAccountHolderOnboarding,
  createPublicIndividualAccountHolderOnboarding,
  parseAccountCountry,
  sdk,
  toFuture,
} from "./api/partner";
import {
  OnboardingRejectionError,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
} from "./api/unauthenticated";
import { start } from "./app";
import { env } from "./env";
import { replyWithError } from "./error";
import { AccountCountry } from "./graphql/partner";
import { getCalledMutations } from "./utils/gql";
import {
  isMutationAuthorizedInWebBanking,
  isMutationRestrictedByWebBankingSettings,
} from "./utils/permissions";
import { getTgglClient } from "./utils/tggl";

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

const partnerPickerUrl = new URL(env.BANKING_URL);
const [...envHostName] = partnerPickerUrl.hostname.split(".");
partnerPickerUrl.hostname = ["partner", ...envHostName].join(".");
if (env.NODE_ENV === "development") {
  partnerPickerUrl.port = "8080";
}

start({
  allowedCorsOrigins: [partnerPickerUrl.origin],
  invitationMode: "EMAIL",
}).then(
  ({ app, ports }) => {
    app.post<{ Params: { projectId: string } }>(
      "/api/projects/:projectId/partner",
      async (request, reply) => {
        const isLive = env.OAUTH_CLIENT_ID.startsWith("LIVE_");
        if (isLive) {
          const disabled = getTgglClient(request.params.projectId).get("disableWebBanking", false);
          if (disabled) {
            request.log.warn(
              `User from project ${request.params.projectId} attempted to access web-banking partner API`,
            );
            return reply.status(401).send("Unauthorized");
          }
        }

        const projectUserToken =
          request.accessToken == null
            ? Result.Ok(Option.None())
            : await exchangeToken(request.accessToken, {
                type: "AccountMemberToken",
                projectId: request.params.projectId,
              })
                .mapOk(token => Option.Some(token))
                .tapError(error => {
                  request.log.error(error, "Failed to exchange token for partner API");
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
            request.log.error(webBankingSettings.error, "Failed to fetch web banking settings");
            return reply.internalServerError();
          }

          const isAuthorized = calledMutations
            .filter(isMutationRestrictedByWebBankingSettings)
            .every(mutationName =>
              isMutationAuthorizedInWebBanking(mutationName, webBankingSettings.value),
            );

          if (!isAuthorized) {
            request.log.warn(calledMutations, "Unauthorized mutation attempted");
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
        const isLive = env.OAUTH_CLIENT_ID.startsWith("LIVE_");
        if (isLive) {
          const disabled = getTgglClient(request.params.projectId).get("disableWebBanking", false);
          if (disabled) {
            request.log.warn(
              `User from project ${request.params.projectId} attempted to access web-banking partner-admin API`,
            );
            return reply.status(401).send("Unauthorized");
          }
        }

        if (request.accessToken == null) {
          return reply.status(401).send("Unauthorized");
        }
        const projectUserToken = await exchangeToken(request.accessToken, {
          type: "AccountMemberToken",
          projectId: request.params.projectId,
        }).tapError(error => {
          request.log.error(error, "Failed to exchange token for partner API");
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
        const projectId = request.params.projectId;
        const isOnboardingV2 = request.query.v2 === "true";

        return Future.value(accountCountry)
          .flatMapOk(accountCountry => {
            if (isOnboardingV2) {
              return createPublicIndividualAccountHolderOnboarding({
                accountCountry,
                projectId,
              });
            }
            return onboardIndividualAccountHolder({ accountCountry, projectId });
          })
          .tapOk(onboardingId => {
            return reply
              .header("cache-control", "private, max-age=0")
              .redirect(`${env.ONBOARDING_URL}/projects/${projectId}/onboardings/${onboardingId}`);
          })
          .tapError(error => {
            match(error)
              .with(
                P.instanceOf(UnsupportedAccountCountryError),
                P.instanceOf(OnboardingRejectionError),
                error => request.log.warn(error, "Failed to start individual onboarding"),
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
        const projectId = request.params.projectId;
        const isOnboardingV2 = request.query.v2 === "true";

        return Future.value(accountCountry)
          .flatMapOk(accountCountry => {
            if (isOnboardingV2) {
              return createPublicCompanyAccountHolderOnboarding({ accountCountry, projectId });
            }
            return onboardCompanyAccountHolder({ accountCountry, projectId });
          })
          .tapOk(onboardingId => {
            return reply
              .header("cache-control", "private, max-age=0")
              .redirect(`${env.ONBOARDING_URL}/projects/${projectId}/onboardings/${onboardingId}`);
          })
          .tapError(error => {
            match(error)
              .with(
                P.instanceOf(UnsupportedAccountCountryError),
                P.instanceOf(OnboardingRejectionError),
                error => request.log.warn(error, "Failed to start company onboarding"),
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
