const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/oceanicNext");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Swan Banking Frontend",
  tagline: "Onboarding & Banking interfaces for Swan",
  url: "https://swan-io.github.io",
  baseUrl: "/swan-partner-frontend/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.png",
  organizationName: "swan-io", // Usually your GitHub org/user name.
  projectName: "swan-partner-frontend", // Usually your repo name.
  themeConfig: {
    navbar: {
      title: "Swan Banking Frontend",
      logo: {
        alt: "Swan Banking Frontend",
        src: "img/logo.svg",
        width: 32,
        height: 32,
      },
      items: [
        {
          href: "/getting-started",
          label: "Getting started",
          position: "left",
        },
        {
          href: "/specs/onboarding",
          label: "Specifications",
          position: "left",
        },
        {
          href: "https://github.com/swan-io/swan-partner-frontend",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      logo: {
        alt: "Swan Open Source",
        src: "img/swan-opensource.svg",
        href: "https://swan.io",
        width: 116,
        height: 43,
      },
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Swan`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  scripts: [],
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/swan-io/swan-partner-frontend/edit/main/docs/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
