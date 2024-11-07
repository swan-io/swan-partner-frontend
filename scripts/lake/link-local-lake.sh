# copy lake pnpm-lock.yaml file as it will be modified
cp ../lake/pnpm-lock.yaml /tmp/pnpm-lock.yaml

pnpm link ../lake/packages/lake
pnpm link ../lake/packages/shared-business
pnpm link ../lake/node_modules/react
pnpm link ../lake/node_modules/react-dom

# restore lake pnpm-lock.yaml file
cp /tmp/pnpm-lock.yaml ../lake/pnpm-lock.yaml

# delete vite cache
rm -rf ./clients/banking-partner-picker/node_modules/.vite
rm -rf ./clients/dashboard/node_modules/.vite
rm -rf ./clients/explorer/node_modules/.vite
rm -rf ./clients/identity/node_modules/.vite

touch ./.linked
