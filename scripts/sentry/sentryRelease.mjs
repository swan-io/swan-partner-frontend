import SentryCli from "@sentry/cli";
import fs from "fs";
import assert from "node:assert";
import path from "pathe";
import url from "url";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const { version } = JSON.parse(fs.readFileSync(path.join(dirname, "../../package.json"), "utf-8"));

assert(process.env.SENTRY_AUTH_TOKEN);

process.env["SENTRY_PIPELINE"] = `gitlab/${version}`;
// The following aren't exposed in the CI
process.env["SENTRY_ORG"] = "swan-bank";

async function release() {
  const cli = new SentryCli().releases;
  const projects = ["onboarding", "banking"];

  await cli.new(version, { projects });

  await Promise.all(
    projects.map(project => {
      cli.uploadSourceMaps(version, {
        include: [path.join(dirname, "../../server/dist", project)],
        projects: [project],
        urlPrefix: undefined,
        stripCommonPrefix: false,
      });
    }),
  );

  await cli.finalize(version);
}

release();
