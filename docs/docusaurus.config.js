// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Swan Banking Frontend",
  tagline: "Onboarding & Banking interfaces for Swan",
  favicon: "img/favicon.png",

  // Set the production url of your site here
  url: "https://swan-io.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/swan-partner-frontend/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "swan-io", // Usually your GitHub org/user name.
  projectName: "swan-partner-frontend", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
          // Please change this to your repo.
          editUrl: "https://github.com/swan-io/swan-partner-frontend/edit/main/docs/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

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
      theme: prismThemes.github,
      darkTheme: prismThemes.oceanicNext,
    },
  },
};

export default config;
