# Contributing

Thanks for your interest in Swan Partner Front-end! Contributions are welcome.

## How this repository works

[swan-io/swan-partner-frontend](https://github.com/swan-io/swan-partner-frontend) is a public mirror. It is published from Swan's internal repository, where development happens: every change merged there is copied here automatically, one commit per change.

Because of this, pull requests are never merged directly in this repository. Here is what happens to yours:

1. **You open a pull request** against `main`, as usual. The CI (lint, typecheck, tests, build) runs on it.
2. **A Swan engineer reviews it** here, on GitHub.
3. **Once it's accepted, we port it** to the internal repository: your commits are cherry-picked as they are, so **you keep the authorship** of the change.
4. **We close your pull request** with a comment that links to where the change lands.
5. **Your change shows up on `main`** here at the next sync. The commit is made by our sync bot and credits you with a `Co-authored-by` trailer, so it shows up on your GitHub profile.

Closed doesn't mean rejected: when we close a pull request without porting it, we say why in the comment.

## Before opening a pull request

- For anything bigger than a small fix, please open an issue first so that we can agree on the approach.
- Keep pull requests small and focused on one change.
- Make sure the checks pass locally:

  ```console
  $ pnpm install
  $ pnpm typecheck
  $ pnpm lint
  $ pnpm test
  ```

- Use [Conventional Commits](https://www.conventionalcommits.org) for your commit messages (e.g. `fix(banking): …`, `feat(onboarding): …`).

See the [README](./README.md) to set up the project, and our [code collaboration guidelines](./CODE_COLLABORATION_GUIDELINES.md) for how we review.

## Security issues

Please don't open a public issue or pull request for a vulnerability. Follow our [security policy](./SECURITY.md) instead.
