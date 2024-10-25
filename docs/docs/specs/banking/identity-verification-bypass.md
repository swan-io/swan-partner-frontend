# Bypass identity verification

For specific use cases validated by Swan, account members might not need to verify their identity.
All of the following must be `false`:

- `projectInfo.B2BMembershipIDVerification`
- `accountMembership.canManageAccountMembership`
- `accountMembership.canInitiatePayments`
- `accountMembership.canManageBeneficiaries`

:::tip Sample use case

The company issues Swan cards for expense management.
An account member is a cardholder with no additional permissions, and their identity is already known.

In this case, **if approved by Swan**, the user **should not be asked to verify their identity**.

:::
