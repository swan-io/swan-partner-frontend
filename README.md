# Swan Partner Front-end

> Onboarding & Banking clients for Swan

- [Documentation](https://swan-io.github.io/swan-partner-frontend)
- [Specifications](https://swan-io.github.io/swan-partner-frontend/specs/onboarding)

## Clone

```console
$ git clone git@github.com:swan-io/swan-partner-frontend.git
$ cd swan-partner-frontend
```

## Install

### 1. Dependencies

Install [pnpm](https://pnpm.io/installation) (needed for the monorepo management).

```console
$ pnpm install
```

### 2. Hosts

Add the following to your `/etc/hosts` file (so that we're able to replicate the subdomains we'll use in production):

```
127.0.0.1 banking.swan.local
127.0.0.1 onboarding.swan.local
127.0.0.1 payment.swan.local
```

### 3. HTTPS

In order to replicate the production conditions (for session cookies mostly), the local server runs in HTTPS. By default, your system will warn against a self-signed certificate, but we can use [mkcert](https://github.com/FiloSottile/mkcert) to make the system trust it.

#### MacOS

With [homebrew](https://brew.sh):

```console
$ brew install mkcert
$ brew install nss # needed for Firefox
$ cd server/keys
$ mkcert -install
$ mkcert "*.swan.local"
```

#### Windows

With [chocolatey](https://chocolatey.org):

```console
$ choco install mkcert
$ cd server/keys
$ mkcert -install
$ mkcert "*.swan.local"
```

## Getting started

To configure your project, simply the following command, it will prompt you with the required values:

```console
$ pnpm configure
```

and then you start the development server!

```console
$ pnpm dev
```

## Environment variables

If you want to setup your `.env` file manually:

### Server

At the project root, you should find a `.env.example` file. Copy its contents to a new `.env` file.

Add your values:

- `PARTNER_API_URL`
  - `https://api.swan.io/sandbox-partner/graphql` in sandbox
  - `https://api.swan.io/live-partner/graphql` in live
- `UNAUTHENTICATED_API_URL`
  - `https://api.swan.io/sandbox-unauthenticated/graphql` in sandbox
  - `https://api.swan.io/live-unauthenticated/graphql` in live
- `COOKIE_KEY` (generate one using `pnpm generate-cookie-key`)

And get the following from your [dashboard](https://dashboard.swan.io):

- `OAUTH_CLIENT_ID`: your Swan OAuth2 client ID
- `OAUTH_CLIENT_SECRET`: your Swan OAuth2 client secret

Don't forget to allow your callback URLs in the [dashboard](https://dashboard.swan.io) → Developers → API → Redirect URLs, here:

- `https://banking.swan.local:8080/auth/callback`

### Client

You can provide environment variables to the client by adding keys starting with `CLIENT_` in your `.env` file.

Then you can run the following command to make the TypeScript compiler aware of these variables:

```console
$ pnpm type-env-vars
```

They'll be accessible in the client code in the `__env` object.

---

## Development

To start the development server, use the following command:

```console
$ pnpm dev
```

You'll find:

- 📁 clients
  - 📁 **onboarding**: the form for an end user to create a Swan account
  - 📁 **banking**: the banking interface, including transactions, cards, payments & memberships
- 📁 **server**: the NodeJS server to handle OAuth2 callbacks & API proxying

## Editor

We recommend the following setup for an optimal developer experience:

- [VS Code](https://code.visualstudio.com)
- [VS Code EditorConfig](https://marketplace.visualstudio.com/items?itemName=editorconfig.editorconfig)
- [VS Code ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [VS Code Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [VS Code GraphQL language support](https://marketplace.visualstudio.com/items?itemName=graphql.vscode-graphql) and [syntax highlighting](https://marketplace.visualstudio.com/items?itemName=graphql.vscode-graphql-syntax)

By default, the VS Code TypeScript extension only checks the types in open files. If you want your IDE to check types in the whole project, check `typescript.tsserver.experimental.enableProjectDiagnostics` in your VS Code preferences.

For better performance (and confort!), it's recommended to set:

- `eslint.run` to `"onSave"`.

## Linting

```console
$ pnpm lint
```

You can also configure `lint-staged` as a pre-commit hook by running the following command :

```console
$ pnpm configure-hooks
```

## Testing

```console
$ pnpm test
```

We generally collocate test files next to their implementation, in a `__tests__` directory, with the tested file name suffixed with `.test`:

```
> utils
  > __tests__
    > myFile.test.tsx
  > myFile.tsx
```

We use [Vitest](https://vitest.dev/api/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
