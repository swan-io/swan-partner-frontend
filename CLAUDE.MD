# Swan Partner Frontend — Claude AI Review

## Review

### Guidelines

- Be concise
- Focus on the edited code only, refer to other files for context
- Be kind and polite
- Add a separate block `👍 Well done buddy !` to point out what was done well
- Remove the `✅ Strengths` bloc
- Check for consistency
- Check for repetitive code (advise on DRY and KISS principles if needed)
- Add a bloc at the end `🧪 How to test it` to explain to a QA how to test this ticket if needed. It should describe the user-facing workflow on the impacted client(s) (banking / onboarding / payment), not implementation details (GraphQL operations, hooks, internal state). Mention which subdomain to open (`banking.swan.local`, `onboarding.swan.local`, `payment.swan.local`) when relevant
- Add another bloc at the end `📋 Actions` to resume all actions you mentioned in a Markdown table with those columns:
  - action title with a link where it was mentioned previously
  - criticality (critical, major, minor)
  - type (type, code organisation, security, bug, a11y, i18n, perf, design-system, graphql, ...)
  - estimated implementation time (in hour or day)
