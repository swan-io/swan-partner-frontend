# Deployment

## Required env variables

### Environment

- `NODE_ENV`: `"development"` or `"production"`
- `LOG_LEVEL`: `"fatal"`, `"error"`, `"warn"`, `"info"`, `"debug"`, `"trace"` or `"silent"`

### APIs

- `PARTNER_API_URL`: Swan Partner API URL
- `UNAUTHENTICATED_API_URL`: Swan Unauthenticated API URL
- `OAUTH_SERVER_URL`: Swan OAuth2 server URL
- `OAUTH_CLIENT_ID`: Your Swan project's OAuth2 Client ID
- `OAUTH_CLIENT_SECRET`: Your Swan project's OAuth2 Client Secret

### Sessions

- `COOKIE_KEY`: the key to encrypt session cookies (generate one using `yarn generate-cookie-key`)

### URLs to expose

- `BANKING_URL`: URL you serve the banking interface from
- `ONBOARDING_URL` URL you serve the onboarding interface from

## Exposing the app

The server is **a single application** that serves both domains (onboarding & banking).

:::tip
It's recommended to make both subdomains **point to the same application** so that you don't have any sync issues between onboarding & banking.
:::

## Routing

In order to route to the correct client given the domain, the server using the `X-Forwarded-Host` or `Host` header.

## CDN

In order to avoid stale contents or too many hits, it's recommended that your CDN **applies the caching policy in the app's HTTP Response headers**.
