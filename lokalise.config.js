const path = require("pathe");

require("dotenv").config();

module.exports = [
  {
    name: "banking",
    id: "66483360603f9ac43d2ad4.56148263",
    defaultLocale: "en",
    paths: {
      src: path.join(process.cwd(), "clients", "banking", "src"),
      locales: path.join(process.cwd(), "clients", "banking", "src", "locales"),
    },
  },
  {
    name: "onboarding",
    id: "35906035603fa14f525834.96064583",
    defaultLocale: "en",
    paths: {
      src: path.join(process.cwd(), "clients", "onboarding", "src"),
      locales: path.join(process.cwd(), "clients", "onboarding", "src", "locales"),
    },
  },
];
