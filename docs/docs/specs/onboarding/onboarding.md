---
title: Onboarding
---

The user onboarding process is, at its base, a form.

Users (especially your end customers) complete this form to **create their accounts**, providing you and Swan a streamlined process to **collect required information and documents**.

## Onboarding ID

The onboarding interface uses the **unauthenticated API**.
Because the user doesn't techincally exist within Swan, you must **create an onboarding**, which generates an **onboarding ID**.
Until the user is authenticated, all information about their onboarding process is attached to their onboarding ID.

## Flows

After fetching the onboarding, route to the correct onboarding flow based on the `onboarding.info` typename.

- [Individual onboarding](/specs/onboarding/individual)
- [Company onboarding](/specs/onboarding/company)

## Invalid `statusInfo`

There can be validation discrepencies between client-side and server-side.
To avoid blocking the user, you cannot finalize an onboarding if `statusInfo` is invalid.

![Screenshot of warning state for missing information in onboarding flow](./images/onboarding-validation.png)
