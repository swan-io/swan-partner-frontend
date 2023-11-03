import chalk from "chalk";
import childProcess from "node:child_process";
import fs from "node:fs";
import util from "node:util";
import path from "pathe";
import prompts from "prompts";
import semver from "semver";
import { PackageJson } from "type-fest";

type ChildProcess = {
  stdout: string;
  stderr: string;
};

const REPOSITORY_URL = "https://github.com/swan-io/swan-partner-frontend";

const logError = (...error: string[]) =>
  console.error(`${chalk.red("ERROR")} ${error.join("\n")}` + "\n");

const toOut = (stdout: string, stderr: string) =>
  (stdout === '""' ? "" : stdout.trim()) || (stderr === '""' ? "" : stderr.trim());

const promisifiedExec = util.promisify(childProcess.exec);

const exec = (cmd: string): Promise<{ cmd: string; ok: boolean; out: string }> =>
  promisifiedExec(cmd).then(
    ({ stdout, stderr }: ChildProcess) => ({ cmd, ok: true, out: toOut(stdout, stderr) }),
    ({ stdout, stderr }: ChildProcess) => ({ cmd, ok: false, out: toOut(stdout, stderr) }),
  );

const rootDir = path.resolve(__dirname, "../..");
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;
const currentVersion = semver.parse(pkg.version);

if (currentVersion == null) {
  logError("Invalid current package version");
  process.exit(1);
}

const { prerelease } = currentVersion;
const isCurrentVersionPrerelease = prerelease.length > 0;

if (isCurrentVersionPrerelease) {
  const isValidPrerelease =
    prerelease.length === 2 && prerelease[0] === "rc" && typeof prerelease[1] === "number";

  if (!isValidPrerelease) {
    logError(`Invalid current package version: ${currentVersion.raw}`);
    process.exit(1);
  }
}

const isProgramMissing = (program: string) => exec(`which ${program}`).then(_ => !_.ok);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-repo
const isNotGitRepo = () => exec("git rev-parse --git-dir").then(_ => !_.ok);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-current-branch
const getGitBranch = () => exec("git rev-parse --abbrev-ref HEAD").then(_ => _.out);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-is-clean
// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-show-skipped
const isGitRepoDirty = () =>
  Promise.all([
    exec("git diff-index --cached --quiet --ignore-submodules --exit-code HEAD --").then(_ => _.ok),
    exec("! git diff --no-ext-diff --ignore-submodules --quiet --exit-code").then(_ => _.ok),
    exec("nbr=$(git ls-files --other --exclude-standard | wc -l); [ $nbr -gt 0 ]").then(_ => _.ok),
    exec('nbr=$(git ls-files -v | grep "^S" | cut -c3- | wc -l); test $nbr -eq 0').then(_ => _.ok),
  ]).then(([isIndexClean, hasUnstagedChanges, hasUntrackedFiles, isSkipped]) => {
    const isWorktreeClean = !hasUnstagedChanges && !hasUntrackedFiles;
    return !isIndexClean || !isWorktreeClean || !isSkipped;
  });

const fetchGitRemote = (remote: string) => exec(`git fetch ${remote} --prune`);

const getLastGitCommitHash = (branch: string) =>
  exec(`git log -n 1 ${branch} --pretty=format:"%H"`).then(_ => _.out);

const updateGhPagerConfig = () => exec('gh config set pager "less -F -X"');

const resetGitBranch = (branch: string, remote: string) =>
  exec(`git switch -C ${branch} ${remote}/${branch}`);

const getGhChangelog = (branch: string) =>
  exec(`gh pr list --state merged --base ${branch} --json title,author,url`);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-local-branch-exists
const hasGitLocalBranch = (branch: string) =>
  exec(`git show-ref --heads --quiet --verify -- "refs/heads/${branch}"`).then(_ => _.ok);

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-remote-branch-exists
const hasGitRemoteBranch = (branch: string, remote: string) =>
  exec(`git show-ref --quiet --verify -- "refs/remotes/${remote}/${branch}"`).then(_ => _.ok);

const getWorkspacePackages = () =>
  exec("yarn --json workspaces info")
    .then(_ => JSON.parse(_.out) as { data: string })
    .then(_ => JSON.parse(_.data) as Record<string, { location: string }>);

const gitCheckoutNewBranch = (branch: string) => exec(`git checkout -b ${branch}`);
const gitAddAll = () => exec("git add . -u");
const gitCommit = (message: string) => exec(`git commit -m "${message}"`);
const gitPush = (branch: string, remote: string) => exec(`git push -u ${remote} ${branch}`);
const gitCheckout = (branch: string) => exec(`git checkout ${branch}`);
const gitDeleteLocalBranch = (branch: string) => exec(`git branch -D ${branch}`);

const createGhPullRequest = (title: string, notes: string) =>
  exec(`gh pr create -t "${title}" -b "${notes}"`);

void (async () => {
  if (await isProgramMissing("git")) {
    logError("git needs to be installed", "https://git-scm.com");
    process.exit(1);
  }
  if (await isProgramMissing("gh")) {
    logError("gh needs to be installed", "https://cli.github.com");
    process.exit(1);
  }
  if (await isProgramMissing("yarn")) {
    logError("yarn needs to be installed", "https://classic.yarnpkg.com");
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

  const [latestLocalCommitHash, latestRemoteCommitHash] = await Promise.all([
    getLastGitCommitHash("main"),
    getLastGitCommitHash("origin/main"),
  ]);

  if (latestLocalCommitHash !== latestRemoteCommitHash) {
    logError("main is not in sync with origin/main");
    process.exit(1);
  }

  console.log(`🚀 Let's release ${pkg.name} (currently at ${currentVersion.raw})`);

  await updateGhPagerConfig();
  await resetGitBranch("main", "branch");

  const changelog = await getGhChangelog("main");

  if (!changelog.ok) {
    logError("Can't generate GitHub changelog");
    process.exit(1);
  }

  const changelogEntries = (
    JSON.parse(changelog.out) as {
      title: string;
      url: string;
      author: { is_bot: boolean; login: string };
    }[]
  )
    .filter(
      pr =>
        !pr.author.is_bot &&
        !pr.title.startsWith("[release]") &&
        !pr.title.startsWith("[prerelease]"),
    )
    .map(
      // Sanitize the PR titles to replace quoted content with italic content
      pr => `- ${pr.title.replace(/["'`]/g, "*")} by @${pr.author.login} in ${pr.url}`,
    );

  if (changelogEntries.length > 0) {
    console.log("\n" + chalk.bold("What's Changed"));
    console.log(changelogEntries.join("\n") + "\n");
  }

  const patch = semver.inc(currentVersion, "patch");
  const minor = semver.inc(currentVersion, "minor");
  const major = semver.inc(currentVersion, "major");
  const prepatch = semver.inc(currentVersion, "prepatch", "rc");
  const preminor = semver.inc(currentVersion, "preminor", "rc");
  const premajor = semver.inc(currentVersion, "premajor", "rc");
  const prerelease = semver.inc(currentVersion, "prerelease", "rc");

  const response = await prompts({
    type: "select",
    name: "value",
    message: "Select increment (next version)",
    initial: 3, // default is prepatch
    choices: [
      { title: `patch (${patch})`, value: patch },
      { title: `minor (${minor})`, value: minor },
      { title: `major (${major})`, value: major },
      ...(isCurrentVersionPrerelease
        ? [{ title: `prerelease (${prerelease})`, value: prerelease }]
        : [
            { title: `prepatch (${prepatch})`, value: prepatch },
            { title: `preminor (${preminor})`, value: preminor },
            { title: `premajor (${premajor})`, value: premajor },
          ]),
    ],
  });

  const nextVersion = semver.parse(response.value as string);

  if (nextVersion == null) {
    process.exit(1); // user cancelled
  }

  const releaseType = nextVersion.prerelease.length > 0 ? "prerelease" : "release";
  const releaseBranch = `${releaseType}-v${nextVersion.raw}`;
  const releaseTitle = `[${releaseType}] v${nextVersion.raw}`;

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

  Object.entries(packages).forEach(([, { location }]) => {
    const pkgPath = path.join(rootDir, location, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;

    pkg["version"] = nextVersion.raw;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  });

  await gitCheckoutNewBranch(releaseBranch);
  await gitAddAll();
  await gitCommit(releaseTitle);
  await gitPush(releaseBranch, "origin");

  const releaseNotes =
    (changelogEntries.length > 0
      ? "## What's Changed" + "\n\n" + changelogEntries.join("\n") + "\n\n"
      : "") +
    `**Full Changelog**: ${REPOSITORY_URL}/compare/v${currentVersion.raw}...v${nextVersion.raw}`;

  const url = await createGhPullRequest(releaseTitle, releaseNotes);

  if (!url.ok) {
    logError("Unable to create pull request");
    process.exit(1);
  }

  console.log("\n" + chalk.bold("✨ Pull request created:"));
  console.log(url.out + "\n");

  await gitCheckout("main");
  await gitDeleteLocalBranch(releaseBranch);
})();
