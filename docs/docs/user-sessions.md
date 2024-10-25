---
title: User sessions
sidebar_label: User sessions
---

The server uses [@fastify/secure-session](https://github.com/fastify/fastify-secure-session) to **store user session data** as an encrypted, secure, HTTP-only cookie.

## Setup

This techniques requires a `COOKIE_KEY` environment variable.
Generate one using the following command:

```console
$ pnpm generate-cookie-key
```

:::warning
Use a different `COOKIE_KEY` for each environment, and do not save it in your repository.
:::

## Contents

In request handlers, access the session data using `request.session`:

```ts
// get session data
request.session.get("myKey");
// set session data
request.session.set("myKey", "myValue");
```

## User access token

For convenience, request a Swan user access token directly using `request.accessToken`:

```ts
const accessToken = request.accessToken;

// user isn't logged in
if (accessToken == undefined) {
  return reply.status(401).send("Unauthorized");
} else {
  // do something with `accessToken`
}
```

:::info
Learn more about [Swan and access tokens](https://docs.swan.io/api/authentication) in our main docs.
:::
