---
title: User sessions
sidebar_label: User sessions
---

The server uses [@fastify/secure-session](https://github.com/fastify/fastify-secure-session) to **store the user session** data as an encrypted, secure, HTTP-only cookie.

## Setup

This techniques requires a `COOKIE_KEY` environment variable.

You can generate one using the following command:

```console
$ yarn generate-cookie-key
```

:::warning
Use a different `COOKIE_KEY` for each of your environments, and do not check it in your repository.
:::

## Contents

In request handlers, you can access the session data using `request.session`:

```ts
// get session data
request.session.get("myKey");
// set session data
request.session.set("myKey", "myValue");
```

## User Access Token

For convenience, you can access the Swan User Access Token directly using `request.accessToken`

```ts
const accessToken = request.accessToken;

// user isn't logged in
if (accessToken == undefined) {
  return reply.status(401).send("Unauthorized");
} else {
  // do something with `accessToken`
}
```
