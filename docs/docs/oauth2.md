# OAuth2

Swan uses [OAuth2](https://oauth.net/2/) for authentication.
Learn more about [Swan and OAuth2](https://docs.swan.io/api/authentication) in our main docs.

## GET `/auth/login`

This endpoint redirects to the Swan OAuth2 server and performs the correct flow based on given parameters.

### Generic query params

- `scope`: additional OAuth2 scopes (always includes `openid` and `offline`)
- `identificationLevel`: [level of identification](https://docs.swan.io/concept/user#identification-level) for the user to verify their identity (`Expert`, `PVID`, or `QES`)

### Specific params

For some specific flows, the server needs to perform an action after the user is authentified.
The server will encode the information in the OAuth2 flow's `state`.

| Flow                          | Parameter             | Description                                                                                          |
| ----------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| Login and redirection         | `redirectTo`          | absolute path (such as `/path/to/x`) where the user will be redirected after the authentication flow |
| Onboarding finalization       | `onboardingId`        | ID for the onboarding the user is finalizing                                                         |
| Account membership invitation | `accountMembershipId` | ID for the account membership to which you're binding the user                                       |

:::caution
You must use the **Banking URL** (`${CLIENT_BANKING_URL}/auth/login?...`) to generate onboarding links. This ensures the session cookie is written on the correct domain, avoiding an unnecessary login flow.
:::

<!-- #### Login and redirection flow

- `redirectTo`: absolute path (such as `/path/to/x`) where the user will be redirected after the authentication flow

#### Onboarding finalization flow

- `onboardingId`: ID for the onboarding the user is finalizing

:::caution
You must use the **Banking URL** (`${CLIENT_BANKING_URL}/auth/login?...`) to generate onboarding links. This ensures the session cookie is written on the correct domain, avoiding an unnecessary login flow.
:::

#### Account membership invitation

- `accountMembershipId`: ID for the account membership to which you're binding the user -->

## GET `/auth/callback`

This endpoint is where Swan's OAuth2 server redirects to, permorming the necessary actions based on the received `state`.

## POST `/auth/logout`

This endpoint clears the user session.
