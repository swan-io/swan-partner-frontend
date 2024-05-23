import path from "pathe";
import pc from "picocolors";
import { start } from "./app";
import { env } from "./env";
import { AccountCountry } from "./graphql/partner";

const keysPath = path.join(__dirname, "../keys");

const countryTranslations: Record<AccountCountry, string> = {
  DEU: "German",
  ESP: "Spanish",
  FRA: "French",
  NLD: "Dutch",
  ITA: "Italian",
};

const accountCountries = Object.keys(countryTranslations) as AccountCountry[];

const onboardingCountries = accountCountries
  .map(accountCountry => ({
    cca3: accountCountry,
    name: countryTranslations[accountCountry],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

start({
  mode: env.NODE_ENV,
  httpsConfig:
    env.NODE_ENV === "development"
      ? {
          key: path.join(keysPath, "_wildcard.swan.local-key.pem"),
          cert: path.join(keysPath, "_wildcard.swan.local.pem"),
        }
      : undefined,
}).then(
  ({ app, ports }) => {
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
    console.log(`${pc.magenta("swan-partner-frontend")}`);
    console.log(`${pc.white("---")}`);
    console.log(pc.green(`${env.NODE_ENV === "development" ? "dev server" : "server"} started`));
    console.log(``);
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
    console.log(``);
    console.log(``);
  },
  err => {
    console.error(err);
    process.exit(1);
  },
);
