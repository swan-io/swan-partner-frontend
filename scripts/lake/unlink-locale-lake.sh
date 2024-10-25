# unlink packages
pnpm unlink "@swan-io/lake"
pnpm unlink "@swan-io/shared-business"
pnpm unlink "react"
pnpm unlink "react-dom"

# remove vite cache
rm -rf clients/banking/node_modules/.vite
rm -rf clients/onboarding/node_modules/.vite

# re-install packages from npm
pnpm install --force

# remove local lake path file
rm locale.config.js
