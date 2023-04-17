/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation
 The sidebars can be generated from the filesystem, or explicitly defined here.
 Create as many sidebars as you want.
 */

module.exports = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "getting-started",
        },
        {
          type: "doc",
          id: "setup",
        },
        {
          type: "doc",
          id: "dev-server",
        },
        {
          type: "doc",
          id: "repository",
        },
        {
          type: "doc",
          id: "graphql",
        },
        {
          type: "doc",
          id: "build",
        },
        {
          type: "doc",
          id: "deploy",
        },
      ],
    },
    {
      type: "category",
      label: "Client",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "lake-ui-kit",
        },
      ],
    },
    {
      type: "category",
      label: "Server",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "oauth2",
        },
        {
          type: "doc",
          id: "user-sessions",
        },
        {
          type: "doc",
          id: "apis",
        },
      ],
    },
  ],
  specs: [
    {
      type: "category",
      label: "Onboarding",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "specs/onboarding/onboarding",
        },
        {
          type: "doc",
          id: "specs/onboarding/individual",
        },
        {
          type: "doc",
          id: "specs/onboarding/company",
        },
      ],
    },
    {
      type: "category",
      label: "Banking",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "specs/banking/banking",
        },
        {
          type: "category",
          label: "General",
          collapsed: false,
          items: [
            {
              type: "doc",
              id: "specs/banking/branding",
            },
            {
              type: "doc",
              id: "specs/banking/navigation",
            },
          ],
        },
        {
          type: "category",
          label: "Sections",
          collapsed: false,
          items: [
            {
              type: "doc",
              id: "specs/banking/history",
            },
            {
              type: "doc",
              id: "specs/banking/account",
            },
            {
              type: "doc",
              id: "specs/banking/transfer",
            },
            {
              type: "doc",
              id: "specs/banking/cards",
            },
            {
              type: "doc",
              id: "specs/banking/members",
            },
            {
              type: "doc",
              id: "specs/banking/profile",
            },
          ],
        },
        {
          type: "category",
          label: "Gotchas",
          collapsed: false,
          items: [
            {
              type: "doc",
              id: "specs/banking/identity-verification-bypass",
            },
          ],
        },
      ],
    },
  ],
};
