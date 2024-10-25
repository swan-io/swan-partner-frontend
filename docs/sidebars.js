/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation
 The sidebars can be generated from the filesystem, or explicitly defined here.
 Create as many sidebars as you want.
 */

const sidebars = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      link: { type: "doc", id: "getting-started" },
      collapsed: false,
      items: [
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
          id: "build-deploy",
        },
        {
          type: "doc",
          id: "deploy-as-is",
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
    {
      type: "category",
      label: "Customization",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "invitation",
        },
      ],
    },
  ],
  specs: [
    {
      type: "category",
      label: "Onboarding",
      link: { type: "doc", id: "specs/onboarding/onboarding" },
      collapsed: false,
      items: [
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
      label: "Web Banking",
      link: { type: "doc", id: "specs/banking/banking" },
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
        {
          type: "category",
          label: "Pages",
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
          label: "Workarounds",
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

export default sidebars;
