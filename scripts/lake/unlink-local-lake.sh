rm ./.linked

# delete vite cache
rm -rf ./clients/banking-partner-picker/node_modules
rm -rf ./clients/dashboard/node_modules
rm -rf ./clients/explorer/node_modules
rm -rf ./clients/identity/node_modules

pnpm install --force
