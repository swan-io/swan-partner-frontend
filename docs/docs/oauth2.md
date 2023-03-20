# OAuth2

Swan uses [OAuth2](https://oauth.net/2/) for authentication.

## GET `/auth/login`

This endpoint redirects to Swan OAuth2 server and performs the correct flow given parameters.

### Generic query params

- `scope`: additional OAuth2 scopes (`openid` and `offline` will always be added)
- `identificationLevel`: level of identification for the user should be prompted with (`Expert` or `QES`)

### Specific params

For some specific flows, the server needs to perform some action after the user authentified, it will encode the information in the OAuth2 flow's `state`.

#### Login & redirection flow

- `redirectTo`: absolute path (e.g. `/path/to/x`) where to redirect the user after the flow

#### Onboarding finalization flow

- `onboardingId`: the onboarding the user wishes to finalize

:::caution
The link must be generated using the **Banking URL** (`${CLIENT_BANKING_URL}/auth/login?...`) so that the session cookie is written on the correct domain, avoiding an unnecessary login flow.
:::

#### Account membership invitation

- `accountMembershipId`: the membership the user wishes to bind their user to

## GET `/auth/callback`

Endpoint to which Swan's OAuth2 server redirects, performs the necessary actions given the received `state`.

## POST `/auth/logout`

Clears the user session.
