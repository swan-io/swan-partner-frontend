import { Octokit } from "@octokit/rest";
import slacifyMarkdown from "slackify-markdown"

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN
});

const tag = process.env.RELEASE_TAG?.replace("prod-", "")

if (tag == null) {
	process.exit(1)
}

const main = async () => {
	const release = await octokit.repos.getReleaseByTag({ owner: "swan-io", repo: "swan-partner-frontend", tag })

	const body = release.data.body
	if (body == null) {
		process.exit(1)
	}
	process.stdout.write(slacifyMarkdown(body).replace("*What's Changed*\n\n", ""))
}

void main()