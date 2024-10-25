import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "pathe";
import pc from "picocolors";
import prompts from "prompts";
import sodium from "sodium-native";

const start = async () => {
  console.log(``);
  console.log(`${pc.magenta("swan-partner-frontend")}`);
  console.log(`${pc.white("---")}`);
  console.log(pc.green(`Welcome!`));
  console.log("");

  console.log("Let's get the necessary information to start");
  console.log("");
  console.log(
    `First, go to ${pc.magenta(
      "https://dashboard.swan.io > Developers > API > OAuth 2.0 Credentials",
    )}`,
  );
  console.log("");

  const OAUTH_CLIENT_ID = await prompts({
    type: "text",
    name: "OAUTH_CLIENT_ID",
    message: `${pc.gray("question")} Your Swan OAuth2 Client ID:`,
    validate: (value: string) => {
      if (!value.startsWith("SANDBOX_") && !value.startsWith("LIVE_")) {
        return "Your Client ID looks invalid";
      } else {
        return true;
      }
    },
  });

  const OAUTH_CLIENT_SECRET = await prompts({
    type: "password",
    name: "OAUTH_CLIENT_SECRET",
    message: `${pc.gray("question")} Your Swan OAuth2 Client Secret:`,
    validate: (value: string) => {
      if (value.trim() === "") {
        return "Your Client Secret looks invalid";
      } else {
        return true;
      }
    },
  });

  console.log("");
  console.log("");
  console.log(
    `Don't forget to add ${pc.magenta(
      "https://banking.swan.local:8080/auth/callback",
    )} to your redirect URIs ${pc.magenta(
      "https://dashboard.swan.io > Developers > API > OAuth 2.0 Credentials",
    )}`,
  );
  console.log("");
  console.log("Generating a new key for cookie encryption");

  const buffer = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
  sodium.randombytes_buf(buffer);
  const hexKey = buffer.toString("hex");

  const envTemplate = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
  const clientId = OAUTH_CLIENT_ID.OAUTH_CLIENT_ID as string;

  const env = envTemplate
    .replace(/^OAUTH_CLIENT_ID=.*/gm, `OAUTH_CLIENT_ID="${clientId}"`)
    .replace(
      /^OAUTH_CLIENT_SECRET=.*/gm,
      `OAUTH_CLIENT_SECRET="${OAUTH_CLIENT_SECRET.OAUTH_CLIENT_SECRET as string}"`,
    )
    .replace(/^COOKIE_KEY=.*/gm, `COOKIE_KEY="${hexKey}"`)
    .replace(
      /^PARTNER_API_URL=.*/gm,
      clientId.startsWith("SANDBOX_")
        ? `PARTNER_API_URL="https://api.swan.io/sandbox-partner/graphql"`
        : `PARTNER_API_URL="https://api.swan.io/live-partner/graphql"`,
    )
    .replace(
      /^UNAUTHENTICATED_API_URL=.*/gm,
      clientId.startsWith("SANDBOX_")
        ? `UNAUTHENTICATED_API_URL="https://api.swan.io/sandbox-unauthenticated/graphql"`
        : `UNAUTHENTICATED_API_URL="https://api.swan.io/live-unauthenticated/graphql"`,
    );

  console.log("");
  console.log("Writing new .env file");

  fs.writeFileSync(path.join(process.cwd(), ".env"), env, "utf-8");
  console.log("");
  console.log("Running GraphQL codegen");
  execSync("pnpm graphql-codegen");
  console.log("");

  console.log(pc.white("---"));
  console.log("");
  console.log(pc.green(`You're all set!`));
  console.log("");
  console.log(pc.white("---"));
  console.log("");
  console.log("In order to start the dev server, you can run the following command:");
  console.log("");
  console.log(pc.white("# Start the dev server"));
  console.log(`$ ${pc.blue("pnpm dev")}`);
  console.log("");
};

void start();
