---
title: GraphQL
sidebar_label: GraphQL
---

Swan exposes a [GraphQL](https://graphql.org/) API.
Anyone can try it out on the [API Explorer](https://explorer.swan.io/) in Sandbox mode.

## Schemas

Update GraphQL schemas with the following command:

```console
$ pnpm graphql-update-schemas
```

:::info
Versioned schemas are stored in the repository to maintain consistent Continuous Integration (CI).
:::

## Documents

All required documents are in the `graphql` directory for each application.

Replace `$consentId` with your consent ID.

```graphql title="clients/banking/src/graphql/partner.gql"
query ConsentCallbackPage($consentId: ID!) {
  consent(id: $consentId) {
    id
    status
  }
}

# ...
```

## Code generator

In order to benefit from GraphQL's types, we use [GraphQL Codegen](https://the-guild.dev/graphql/codegen).

Run codegen with the following command:

```console
$ pnpm graphql-codegen
```

In this example, `codegen` generates a new file `partner.ts`, housed with documents, which we can import:

```ts
import { ConsentCallbackPageDocument } from "../graphql/partner";

const MyComponent = () => {
  const [{ data }] = useUrqlQuery({ query: ConsentCallbackPageDocument });
  // `data` is a typed object
  // ...
};
```

:::info
Generated files are **not versioned** to avoid unnecessary conflicts. Instead, they're generated with CI.
:::
