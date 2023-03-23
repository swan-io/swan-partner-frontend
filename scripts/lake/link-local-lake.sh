yarn link "@swan-io/lake"
yarn link "@swan-io/shared-business"
yarn link "react"
yarn link "react-dom"

# remove vite cache
rm -rf clients/banking/node_modules/.vite
rm -rf clients/onboarding/node_modules/.vite

# create lake path file
echo 'import path from "node:path";

export default {
  lake: path.resolve(process.cwd(), "..", "lake"),
};' > lake.config.js
