import chalk from "chalk";
import childProcess from "node:child_process";
import util from "node:util";

export const logError = (...error: string[]) =>
  console.error(`${chalk.red("ERROR")} ${error.join("\n")}` + "\n");

const promisifiedExec = util.promisify(childProcess.exec);

export const exec = (cmd: string): Promise<string> =>
  promisifiedExec(cmd)
    .then(({ stdout, stderr }) => ({
      stdout: stdout === '""' ? "" : stdout.trim(),
      stderr: stderr === '""' ? "" : stderr.trim(),
    }))
    .then(({ stdout, stderr }) => stdout || stderr);

export const isExecOk = (cmd: string) =>
  exec(cmd)
    .then(() => true)
    .catch(() => false);

export const isExecKo = (cmd: string) =>
  exec(cmd)
    .then(() => false)
    .catch(() => true);

export const updateGhPagerConfig = () => exec('gh config set pager "less -F -X"');

export const getLatestGhRelease = () =>
  exec("gh release list --json tagName --limit 1")
    .then(output => JSON.parse(output) as { tagName: string }[])
    .then(output => output[0]?.tagName);
