const assert = require("node:assert");

const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

const OWNER = "swan-io";
const REPO = "deploy-swan";
const BRANCH = "enp-4322-update-deploy-script";

assert(process.env.TAG, "TAG is required");
assert(process.env.DEPLOY_SWAN_APP_ID, "DEPLOY_SWAN_APP_ID is required");
assert(process.env.DEPLOY_SWAN_APP_SECRET, "DEPLOY_SWAN_APP_SECRET is required");
assert(process.env.DEPLOY_ENVIRONMENT, "DEPLOY_ENVIRONMENT is required");
assert(process.env.DEPLOY_APP_NAME, "DEPLOY_APP_NAME is required");

async function getInstallationToken(appId, privateKey) {
  const auth = createAppAuth({ appId: parseInt(appId, 10), privateKey });

  const { token: jwtToken } = await auth({ type: "app" });
  const appOctokit = new Octokit({ auth: jwtToken });

  const { data: installation } = await appOctokit.rest.apps.getRepoInstallation({
    owner: OWNER,
    repo: REPO,
  });

  const { token } = await auth({ type: "installation", installationId: installation.id });
  return token;
}

async function fetchFile(octokit, filePath) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: BRANCH,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    return { content: Buffer.from(data.content, "base64").toString("utf-8") };
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function commitViaGitHubAPI(octokit, message, files, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: OWNER,
        repo: REPO,
        ref: `heads/${BRANCH}`,
      });
      const latestCommitSha = ref.object.sha;

      const { data: latestCommit } = await octokit.rest.git.getCommit({
        owner: OWNER,
        repo: REPO,
        commit_sha: latestCommitSha,
      });

      const treeItems = await Promise.all(
        Array.from(files.entries()).map(async ([filePath, content]) => {
          const { data: blob } = await octokit.rest.git.createBlob({
            owner: OWNER,
            repo: REPO,
            content: Buffer.from(content).toString("base64"),
            encoding: "base64",
          });
          return { path: filePath, mode: "100644", type: "blob", sha: blob.sha };
        }),
      );

      const { data: tree } = await octokit.rest.git.createTree({
        owner: OWNER,
        repo: REPO,
        base_tree: latestCommit.tree.sha,
        tree: treeItems,
      });

      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner: OWNER,
        repo: REPO,
        message,
        tree: tree.sha,
        parents: [latestCommitSha],
      });

      await octokit.rest.git.updateRef({
        owner: OWNER,
        repo: REPO,
        ref: `heads/${BRANCH}`,
        sha: newCommit.sha,
      });

      console.log(`Git: ✅ Committed ${newCommit.sha}`);
      return;
    } catch (err) {
      if (attempt < maxRetries - 1 && (err.status === 422 || err.status === 409)) {
        console.warn(`Ref update conflict, retrying (${attempt + 2}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

(async () => {
  const privateKey = process.env.DEPLOY_SWAN_APP_SECRET.replace(/\\n/g, "\n");
  const token = await getInstallationToken(process.env.DEPLOY_SWAN_APP_ID, privateKey);
  const octokit = new Octokit({ auth: token });

  const filePath = `open-frontend/argocd/${process.env.DEPLOY_ENVIRONMENT}/${process.env.DEPLOY_APP_NAME}-values.yaml`;

  const file = await fetchFile(octokit, filePath);
  if (!file) {
    throw new Error(`File not found: ${filePath}`);
  }

  const updatedContent = file.content.replaceAll(/\btag: .+/g, `tag: ${process.env.TAG}`);

  if (updatedContent === file.content) {
    console.log("No changes to commit");
    return;
  }

  const message = `[Update Deploy Swan] App: ${process.env.DEPLOY_APP_NAME} new tag ${process.env.TAG}, ECR: swan-${process.env.DEPLOY_APP_NAME}`;
  await commitViaGitHubAPI(octokit, message, new Map([[filePath, updatedContent]]));
})();
