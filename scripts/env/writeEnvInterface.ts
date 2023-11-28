import { Array, Option } from "@swan-io/boxed";
import { parse } from "dotenv";
import fs from "node:fs";
import path from "pathe";

const environmentVariables = Object.keys(
  parse(fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8")),
);

const clientEnvironmentVariables = Array.filterMap(environmentVariables, key =>
  key.startsWith("CLIENT_") ? Option.Some(key) : Option.None(),
);

const file = `declare const __env: {
  // Server provided
  VERSION: string;
  SWAN_PROJECT_ID?: string;
  TGGL_API_KEY?: string;
  SWAN_ENVIRONMENT: "SANDBOX" | "LIVE";
  ACCOUNT_MEMBERSHIP_INVITATION_MODE: "LINK" | "EMAIL";
  BANKING_URL: string;
  PAYMENT_URL: string;
  IS_SWAN_MODE: boolean;
  // Client
  ${clientEnvironmentVariables.map(variableName => `${variableName}: string;`).join("\n  ")}
};
`;

fs.writeFileSync(path.join(process.cwd(), "types/env/index.d.ts"), file, "utf-8");
