import chalk from "chalk";
import childProcess from "node:child_process";
import fs from "node:fs";
import util from "node:util";
import path from "pathe";
import prompts from "prompts";
import semver from "semver";
import { PackageJson } from "type-fest";

const logError = (...error: string[]) =>
  console.error(`${chalk.red("ERROR")} ${error.join("\n")}` + "\n");

const promisifiedExec = util.promisify(childProcess.exec);

const exec = (cmd: string): Promise<string> =>
  promisifiedExec(cmd)
    .then(({ stdout, stderr }) => ({
      stdout: stdout === '""' ? "" : stdout.trim(),
      stderr: stderr === '""' ? "" : stderr.trim(),
    }))
    .then(({ stdout, stderr }) => stdout || stderr);

const isOk = (promise: Promise<unknown>) => promise.then(() => true).catch(() => false);
const isKo = (promise: Promise<unknown>) => promise.then(() => false).catch(() => true);

const rootDir = path.resolve(__dirname, "../..");
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;
const currentVersion = semver.parse(pkg.version);

if (currentVersion == null) {
  logError("Invalid current package version");
  process.exit(1);
}

const isProgramMissing = (program: string) => isKo(exec(`which ${program}`));

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-repo
const isNotGitRepo = () => isKo(exec("git rev-parse --git-dir"));

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-current-branch
const getGitBranch = () => exec("git rev-parse --abbrev-ref HEAD");

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-is-clean
// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-show-skipped
const isGitRepoDirty = () =>
  Promise.all([
    isOk(exec("git diff-index --cached --quiet --ignore-submodules --exit-code HEAD --")),
    isOk(exec("! git diff --no-ext-diff --ignore-submodules --quiet --exit-code")),
    isOk(exec("nbr=$(git ls-files --other --exclude-standard | wc -l); [ $nbr -gt 0 ]")),
    isOk(exec('nbr=$(git ls-files -v | grep "^S" | cut -c3- | wc -l); test $nbr -eq 0')),
  ]).then(([isIndexClean, hasUnstagedChanges, hasUntrackedFiles, isSkipped]) => {
    const isWorktreeClean = !hasUnstagedChanges && !hasUntrackedFiles;
    return !isIndexClean || !isWorktreeClean || !isSkipped;
  });

const fetchGitRemote = (remote: string) =>
  exec(`git fetch ${remote} --tags --prune --prune-tags --force`);

const getLastGitCommitHash = (branch: string) =>
  exec(`git log -n 1 ${branch} --pretty=format:"%H"`);

const updateGhPagerConfig = () => exec('gh config set pager "less -F -X"');

const resetGitBranch = (branch: string, remote: string) =>
  exec(`git switch -C ${branch} ${remote}/${branch}`);

const getGitCommits = (from: string | undefined, to: string) =>
  exec(`git log ${from != null ? `${from}..${to}` : ""} --pretty="format:%s"`)
    .then(_ => _.split("\n"))
    .then(entries =>
      entries
        .filter(entry => !entry.startsWith("[release]"))
        .map(entry => "- " + entry.trim().replace(/["]/g, "*"))
        .toReversed(),
    );

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-local-branch-exists
const hasGitLocalBranch = (branch: string) =>
  isOk(exec(`git show-ref --heads --quiet --verify -- "refs/heads/${branch}"`));

// https://github.com/nvie/git-toolbelt/blob/v1.9.0/git-remote-branch-exists
const hasGitRemoteBranch = (branch: string, remote: string) =>
  isOk(exec(`git show-ref --quiet --verify -- "refs/remotes/${remote}/${branch}"`));

const getWorkspacePackages = () =>
  exec("yarn workspaces info --json").then(
    info => JSON.parse(info) as Record<string, { location: string }>,
  );

const createGhPullRequest = (title: string) => exec(`gh pr create -t "${title}" -b ""`);
const gitAddAll = () => exec("git add . -u");
const gitCheckout = (branch: string) => exec(`git checkout ${branch}`);
const gitCheckoutNewBranch = (branch: string) => exec(`git checkout -b ${branch}`);
const gitCommit = (message: string) => exec(`git commit -m "${message}"`);
const gitDeleteLocalBranch = (branch: string) => exec(`git branch -D ${branch}`);
const gitPush = (branch: string, remote: string) => exec(`git push -u ${remote} ${branch}`);

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

  if ((await getLastGitCommitHash("main")) !== (await getLastGitCommitHash("origin/main"))) {
    logError("main is not in sync with origin/main");
    process.exit(1);
  }

  await resetGitBranch("main", "origin");

  console.log(`🚀 Let's release ${pkg.name} (currently at ${currentVersion.raw})`);

  const currentVersionTag = `v${currentVersion.raw}`;
  const commits = await getGitCommits(currentVersionTag, "main");

  if (commits.length > 0) {
    console.log("\n" + chalk.bold("Commits"));
    console.log(commits.join("\n") + "\n");
  }

  const patch = semver.inc(currentVersion, "patch");
  const minor = semver.inc(currentVersion, "minor");
  const major = semver.inc(currentVersion, "major");

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

  Object.entries(packages).forEach(([, { location }]) => {
    const pkgPath = path.join(rootDir, location, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PackageJson;

    pkg["version"] = nextVersion.raw;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  });

  await gitCheckoutNewBranch(releaseBranch);
  await gitAddAll();
  await gitCommit(releaseTag);
  await gitPush(releaseBranch, "origin");

  await updateGhPagerConfig();
  const url = await createGhPullRequest(releaseTag);

  console.log("\n" + chalk.bold("✨ Pull request created:"));
  console.log(url + "\n");

  await gitCheckout("main");
  await gitDeleteLocalBranch(releaseBranch);
})();
