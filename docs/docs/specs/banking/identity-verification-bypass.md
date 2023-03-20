# Identity verification bypass

For specific use-cases validated by Swan’s compliance team, a certain set of conditions allow a membership not to validate their identity if:

- `projectInfo.B2BMembershipIDVerification` is `false`
- `accountMembership.canManageAccountMembership` is `false`
- `accountMembership.canInitiatePayments` is `false`
- `accountMembership.canManageBeneficiaries` is `false`

This is mostly used to allow simple card holders with no permission on the account **when their identity is already known** (e.g. expense management inside a given company). **In this context, we shouldn’t actively invite the user to verify their identity**.
