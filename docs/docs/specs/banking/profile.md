# Profile

Profile is a **user-centric** page.

## Personal information

![](./images/profile/personal-info.png)

Show basic information about the user:

- First & last name
- Email (no email is stored on a User object, we show the email of the currently selected account membership)
- Phone number
- Birth date
- Identification status

If the identification status is `Uninitiated`, `InsufficientDocumentQuality` or `InvalidIdentity`, an OAuth2 link is presented to trigger a identity verification flow with the current membership’s `recommendedIdentificationLevel` as identification level.

If the identification status is `ReadyToSign`, an OAuth2 link is presented to trigger a identity verification flow with `QES` as identification level (`ReadyToSign` is specific to the QES flow), mentioning that the user show finish their verification.

Below the block, a select shows the different supported locales, and lets the user override the language choice (by default inferred from the `navigation.languages` value).

:::info
The override is stored in the client’s local storage
:::
