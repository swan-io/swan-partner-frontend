yarn link "@swan-io/lake"
yarn link "@swan-io/shared-business"
yarn link "react"
yarn link "react-dom"

# remove vite cache
rm -rf clients/banking/node_modules/.vite
rm -rf clients/onboarding/node_modules/.vite

# prompt lake relative path
echo "Enter lake relative path (e.g. ../lake):"
read lakePath

# create lake path file
echo $lakePath > lake-path.txt
