import assert from "node:assert";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = os.tmpdir();
const repoName = "deploy";

assert(process.env.TAG);
assert(process.env.DEPLOY_SWAN_TOKEN);
assert(process.env.DEPLOY_SWAN_REPOSITORY);
assert(process.env.DEPLOY_ENVIRONMENT);
assert(process.env.DEPLOY_APP_NAME);
assert(process.env.DEPLOY_GIT_USER);
assert(process.env.DEPLOY_GIT_EMAIL);

execSync(`git config --global user.name ${process.env.DEPLOY_GIT_USER}`);
execSync(`git config --global user.email ${process.env.DEPLOY_GIT_EMAIL}`);

execSync(`rm -fr ${tmp}/${repoName}`);

execSync(
  `cd ${tmp} && git clone --single-branch --branch master https://projects:${process.env.DEPLOY_SWAN_TOKEN}@${process.env.DEPLOY_SWAN_REPOSITORY} ${repoName}`,
);

const file = fs.readFileSync(
  path.join(
    tmp,
    repoName,
    process.env.DEPLOY_ENVIRONMENT,
    `${process.env.DEPLOY_APP_NAME}-values.yaml`,
  ),
  "utf-8",
);

const updatedFile = file.replaceAll(/\btag: .+/g, `tag: ${process.env.TAG}`);

fs.writeFileSync(
  path.join(
    tmp,
    repoName,
    process.env.DEPLOY_ENVIRONMENT,
    `${process.env.DEPLOY_APP_NAME}-values.yaml`,
  ),
  updatedFile,
  "utf-8",
);

execSync(
  `cd ${tmp}/${repoName} && git commit --allow-empty -am "Update with tag: ${process.env.TAG}, image(s): ${process.env.DEPLOY_APP_NAME}"`,
);

execSync(`cd ${tmp}/${repoName} && git pull --rebase origin master && git push origin master`);
