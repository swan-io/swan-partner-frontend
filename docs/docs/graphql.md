---
title: GraphQL
sidebar_label: GraphQL
---

Swan exposes a [GraphQL](https://graphql.org/) API, which you can try on the [GraphQL Explorer](https://explorer.swan.io/).

## Schemas

In order to update the GraphQL schemas, you can run the following command:

```console
$ yarn graphql-update-schemas
```

:::info
In order for Continous Integration (CI) to be deterministic, the schemas are versioned in the repository
:::

## Documents

All the documents are in each applications `graphql` directory.

```graphql title="clients/banking/src/graphql/partner.gql"
query ConsentCallbackPage($consentId: ID!) {
  consent(id: $consentId) {
    id
    status
  }
}

# ...
```

## Codegen

In order to benefit from GraphQL's types, we use [GraphQL Codegen](https://the-guild.dev/graphql/codegen).

We can run the codegen using the following command:

```console
$ yarn graphql-codegen
```

Using our previous example, it will generate a `partner.ts` file next to the document one, which we can import:

```ts
import { ConsentCallbackPage } from "../graphql/partner";

const MyComponent = () => {
  const [{ data }] = useUrqlQuery({ query: ConsentCallbackPageDocument });
  // `data` is a typed object
  // ...
};
```

:::info
Generated files are **not versioned** to avoid unnecessary conflicts, they're instead generated on the CI.
:::
