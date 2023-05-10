# Build and deploy

## Bundle

Building bundles the client applications and the server in `./server`.

Build in production with the following command:

```console
$ yarn build
```

## Dockerize

Create a Docker image from the built files:

```console
$ docker build
```

## Required environment variables

| Type | Variable | Description |
| ---- | ---- | ----------- |
| Environment | `NODE_ENV` | *development* or *production* |
| Environment | `LOG_LEVEL` | *fatal*, *error*, *warn*, *info*, *debug*, *trace*, or *silent* |
| API | `PARTNER_API_URL` | Swan Partner API URL |
| API | `UNAUTHENTICATED_API_URL` | Swan Unauthenticated API URL |
| API | `OAUTH_SERVER_URL` | Swan OAuth2 server URL |
| API | `OAUTH_CLIENT_ID` | your Swan project's OAuth2 Client ID |
| API | `OAUTH_CLIENT_SECRET` | your Swan project's OAuth2 Client Secret |
| Sessions | `COOKIE_KEY` | key to encrypt session cookies (generate using `yarn generate-cookie-key`) |
| URLs to expose | `BANKING_URL` | URL for the banking app |
| URLs to expose | `ONBOARDING_URL` |  URL for the onboarding process |

<!-- ### Environment

- `NODE_ENV`: development or production
- `LOG_LEVEL`: fatal, error, warn, info, debug, trace, or silent

### APIs

- `PARTNER_API_URL`: Swan Partner API URL
- `UNAUTHENTICATED_API_URL`: Swan Unauthenticated API URL
- `OAUTH_SERVER_URL`: Swan OAuth2 server URL
- `OAUTH_CLIENT_ID`: your Swan project's OAuth2 Client ID
- `OAUTH_CLIENT_SECRET`: your Swan project's OAuth2 Client Secret

### Sessions

- `COOKIE_KEY`: key to encrypt session cookies (generate using `yarn generate-cookie-key`)

### URLs to expose

- `BANKING_URL`: URL for the banking app
- `ONBOARDING_URL` URL for the onboarding process -->

## Exposing the app

The server is a **single application** that serves both onboarding and banking domains.

:::tip
We recommend pointing both subdomains **to the same application** so that you don't have any sync issues between onboarding and banking.
:::

## Routing

In order to route to the correct client given the domain, the server using the `x-forwarded-host` or `host` header.

## Content delivery network

In order to avoid stale content or too many hits, we recommended applying the **cache policy in your app's HTTP response headers**.