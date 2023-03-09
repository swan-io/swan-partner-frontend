# Code collaboration guidelines

## Make small PRs

Try to make PRs as small as you can to ease the review process. When dealing with large features, split into smaller functional blocks.

## Use Pull Request tooling

- If you're still working on something that's not ready to be merged, use a **Draft Pull Request**
- **Ask for reviews** using the _Reviewers_ picker, include everyone involved
- **Add some context** to your PR description (even in individual commits if possible)
- **Inline some comments yourself** on the bits that you want to explain (e.g. "I took this path because ...")
- **Check regularly** pending PRs you're asked to review

## Avoid [bikeshedding](https://en.wikipedia.org/wiki/Law_of_triviality)

- Use a **shared code formatter** whenever possible so that style is eliminated from the mental charge
- Avoid **nitpicking**
  - If there're some nitpick though, it should be noted with `nit` word and **must not** prevent a merge
  - If the nitpick is about personal preference, explain your reasoning

## Give context & keep focus

- Only review what's been changed (don't ask for changes you notice that aren't related to the current patch, rather open an issue or a subsequent PRs)
- When having an urgent PR, write in the context and the impacts the changes will have on business

## Use a simple, friendly language

- Use **we pronouns**, **passive tone** and **questions**:
  - "Change X please" → "Can we change X?"
  - "You should change this call" → "I think we should change this call"
  - "Rename X to Y for readability" → "How about renaming X to Y, that might be clearer?"
  - "Why did you use X?" → "Why is X used here?"
- Use emojis to **communicate your emotional intent or goal** (except 😉 and 🙃, which should be banned)
- Don't use angry, agressive vocabulary and punctuation
- Use jokes if you want, as long as it's not detrimental to the work that's been of the person that did it
- Look for agreement (e.g. "Yeah, we might also do X, **what do you think?**")

## Be nice

- **Show some appreciation**! When you find something great, say it. ❤️
- **Be constructive**, settle debates calmly, don't be a gatekeeper 🤝
- When announcing a feature to the rest of the company, **credit the people who worked on it**. 🙏

## Inspirations

- https://mtlynch.io/human-code-reviews-1/
- https://mtlynch.io/human-code-reviews-2/
