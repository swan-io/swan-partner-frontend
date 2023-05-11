import SentryCli from "@sentry/cli";
import fs from "fs";
import path from "pathe";
import url from "url";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const { version } = JSON.parse(fs.readFileSync(path.join(dirname, "../../package.json"), "utf-8"));

process.env["SENTRY_PIPELINE"] = `gitlab/${version}`;
// The following aren't exposed in the CI
process.env["SENTRY_ORG"] = "swan-bank";
process.env["SENTRY_AUTH_TOKEN"] =
  "4a366b1900224e84b87c093aa36c81312ec96eec3a9f4ee39d912b58d82e71b2";

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
