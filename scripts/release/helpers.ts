import childProcess from "node:child_process";
import pc from "picocolors";

export const logError = (...error: string[]) =>
  console.error(`${pc.red("ERROR")} ${error.join("\n")}` + "\n");

export const exec = (cmd: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    childProcess.exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      const out = stdout === '""' ? "" : stdout.trim();
      const err = stderr === '""' ? "" : stderr.trim();

      resolve(out || err);
    });
  });

export const isExecOk = (cmd: string) =>
  exec(cmd)
    .then(() => true)
    .catch(() => false);

export const isExecKo = (cmd: string) =>
  exec(cmd)
    .then(() => false)
    .catch(() => true);

export const quote = (value: string) => {
  if (value === "") {
    return "''";
  }
  if (!/[^A-Za-z0-9_/:=-]/.test(value)) {
    return value;
  }

  // from https://github.com/xxorax/node-shell-escape/blob/master/shell-escape.js
  return `'${value.replace(/'/g, "'\\''")}'`
    .replace(/^(?:'')+/g, "") // unduplicate single-quote at the beginning
    .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
};

export const updateGhPagerConfig = () => exec('gh config set pager "less -F -X"');

export const getLatestGhRelease = () =>
  exec("gh release list --json tagName --limit 1")
    .then(output => JSON.parse(output) as { tagName: string }[])
    .then(output => output[0]?.tagName);
