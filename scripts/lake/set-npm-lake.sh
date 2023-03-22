# unlink packages
yarn unlink "@swan-io/lake"
yarn unlink "@swan-io/shared-business"
yarn unlink "react"
yarn unlink "react-dom"

# remove vite cache
rm -rf clients/banking/node_modules/.vite
rm -rf clients/onboarding/node_modules/.vite

# re-install packages from npm
yarn install --force

# remove USE_LOCAL_LAKE from .env
sed -i '' '/USE_LOCAL_LAKE/d' .env
