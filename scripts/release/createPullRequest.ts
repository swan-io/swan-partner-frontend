import fs from "node:fs";
import path from "pathe";
import pc from "picocolors";
import prompts from "prompts";
import semver from "semver";
import { PackageJson } from "type-fest";
import {
  exec,
  getLatestGhRelease,
  isExecKo,
  isExecOk,
  logError,
  quote,
  updateGhPagerConfig,
} from "./helpers";

const rootDir = path.resolve(__dirname, "../..");
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;
const currentPkgVersion = semver.parse(pkg.version);

if (currentPkgVersion == null) {
  logError("Invalid current package version");
  process.exit(1);
}

const isProgramMissing = (program: string) => isExecKo(`which ${program}`);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-repo
const isNotGitRepo = () => isExecKo("git rev-parse --git-dir");

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-current-branch
const getGitBranch = () => exec("git rev-parse --abbrev-ref HEAD");

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-is-clean
// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-show-skipped
const isGitRepoDirty = () =>
  Promise.all([
    isExecOk("git diff-index --cached --quiet --ignore-submodules --exit-code HEAD --"),
    isExecOk("! git diff --no-ext-diff --ignore-submodules --quiet --exit-code"),
    isExecOk("nbr=$(git ls-files --other --exclude-standard | wc -l); [ $nbr -gt 0 ]"),
    isExecOk('nbr=$(git ls-files -v | grep "^S" | cut -c3- | wc -l); test $nbr -eq 0'),
  ]).then(([isIndexClean, hasUnstagedChanges, hasUntrackedFiles, isSkipped]) => {
    const isWorktreeClean = !hasUnstagedChanges && !hasUntrackedFiles;
    return !isIndexClean || !isWorktreeClean || !isSkipped;
  });

const fetchGitRemote = (remote: string) =>
  exec(`git fetch ${remote} --tags --prune --prune-tags --force`);

const getLastGitCommitHash = (branch: string) =>
  exec(`git log -n 1 ${branch} --pretty=format:"%H"`);

const resetGitBranch = (branch: string, remote: string) =>
  exec(`git switch -C ${branch} ${remote}/${branch}`);

const getGitCommits = (from: string | undefined, to: string) =>
  exec(`git log ${from != null ? `${from}..${to}` : ""} --pretty="format:%s"`)
    .then(output => (output !== "" ? output.split("\n") : []))
    .then(entries =>
      entries
        .filter(entry => !/^v\d+\.\d+.\d+/.test(entry))
        .map(entry => "- " + entry.trim().replace(/["]/g, "*"))
        .toReversed(),
    );

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-local-branch-exists
const hasGitLocalBranch = (branch: string) =>
  isExecOk(`git show-ref --heads --quiet --verify -- "refs/heads/${branch}"`);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-remote-branch-exists
const hasGitRemoteBranch = (branch: string, remote: string) =>
  isExecOk(`git show-ref --quiet --verify -- "refs/remotes/${remote}/${branch}"`);

const getWorkspacePackages = () =>
  exec("pnpm list -r --json").then(pkg => JSON.parse(pkg) as { name: string; path: string }[]);

const gitAddAll = () => exec("git add . -u");
const gitCheckout = (branch: string) => exec(`git checkout ${branch}`);
const gitCheckoutNewBranch = (branch: string) => exec(`git checkout -b ${branch}`);
const gitCommit = (message: string) => exec(`git commit -m ${quote(message)}`);
const gitDeleteLocalBranch = (branch: string) => exec(`git branch -D ${branch}`);
const gitPush = (branch: string, remote: string) => exec(`git push -u ${remote} ${branch}`);

const createGhPullRequest = (title: string, body: string) =>
  exec(`gh pr create -t ${quote(title)} -b ${quote(body)}`);

const createGhCompareUrl = (from: string | undefined, to: string) =>
  `https://github.com/swan-io/swan-partner-frontend/compare/${from != null ? `${from}..${to}` : ""}`;

(async () => {
  if (await isProgramMissing("git")) {
    logError("git needs to be installed", "https://git-scm.com");
    process.exit(1);
  }
  if (await isProgramMissing("gh")) {
    logError("gh needs to be installed", "https://cli.github.com");
    process.exit(1);
  }
  if (await isProgramMissing("pnpm")) {
    logError("pnpm needs to be installed", "https://pnpm.io");
    process.exit(1);
  }

  if (await isNotGitRepo()) {
    logError("Must be in a git repo");
    process.exit(1);
  }
  if ((await getGitBranch()) !== "main") {
    logError("Must be on branch main");
    process.exit(1);
  }
  if (await isGitRepoDirty()) {
    logError("Working dir must be clean", "Please stage and commit your changes");
    process.exit(1);
  }

  await fetchGitRemote("origin");

  if ((await getLastGitCommitHash("main")) !== (await getLastGitCommitHash("origin/main"))) {
    logError("main is not in sync with origin/main");
    process.exit(1);
  }

  await resetGitBranch("main", "origin");

  console.log(`🚀 Let's release ${pkg.name} (currently at ${currentPkgVersion.raw})`);

  const currentVersionTag = await getLatestGhRelease();
  const commits = await getGitCommits(currentVersionTag, "main");

  if (commits.length > 0) {
    console.log("\n" + pc.bold("What's Included"));
    console.log(commits.join("\n") + "\n");
  }

  const patch = semver.inc(currentPkgVersion, "patch");
  const minor = semver.inc(currentPkgVersion, "minor");
  const major = semver.inc(currentPkgVersion, "major");

  const response = await prompts({
    type: "select",
    name: "value",
    message: "Select increment (next version)",
    initial: 0, // default is patch
    choices: [
      { title: `patch (${patch})`, value: patch },
      { title: `minor (${minor})`, value: minor },
      { title: `major (${major})`, value: major },
    ],
  });

  const nextVersion = semver.parse(response.value as string);

  if (nextVersion == null) {
    process.exit(1); // user cancelled
  }

  const releaseTag = `v${nextVersion.raw}`;
  const releaseBranch = `release-${releaseTag}`;

  if (await hasGitLocalBranch(releaseBranch)) {
    logError(`${releaseBranch} branch already exists`);
    process.exit(1);
  }
  if (await hasGitRemoteBranch(releaseBranch, "origin")) {
    logError(`origin/${releaseBranch} branch already exists`);
    process.exit(1);
  }

  pkg["version"] = nextVersion.raw;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  const packages = await getWorkspacePackages();

  Object.values(packages).forEach(item => {
    const pkgPath = path.join(item.path, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;

    pkg["version"] = nextVersion.raw;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  });

  await gitCheckoutNewBranch(releaseBranch);
  await gitAddAll();
  await gitCommit(releaseTag);
  await gitPush(releaseBranch, "origin");

  await updateGhPagerConfig();

  const body = [
    ...(commits.length > 0 ? ["### What's Included", commits.join("\n")] : []),
    `**Diff**: ${createGhCompareUrl(currentVersionTag, releaseBranch)}`,
  ].join("\n\n");

  const url = await createGhPullRequest(releaseTag, body);

  console.log("\n" + pc.bold("✨ Pull request created:"));
  console.log(url + "\n");

  await gitCheckout("main");
  await gitDeleteLocalBranch(releaseBranch);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
