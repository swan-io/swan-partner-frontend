import core from "@actions/core";
import github from "@actions/github";
import slackifyMarkdown from "slackify-markdown";

if (process.env.GITHUB_TOKEN == null) {
  process.exit(0);
}

const context = github.context;
// Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

// Get owner and repo from context of payload that triggered the action
const { owner, repo } = context.repo;

const tag = process.env.RELEASE_TAG?.replace("prod-", "");

if (tag == null) {
  process.exit(1);
}

const main = async () => {
  const release = await octokit.rest.repos.getReleaseByTag({
    owner,
    repo,
    tag,
  });

  const body = release.data.body;
  if (body == null) {
    process.exit(1);
  }

  core.setOutput("body", slackifyMarkdown(body).replace("*What's Changed*\n\n", ""));
};

void main();
