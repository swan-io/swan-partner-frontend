# GraphQL Update & Deprecation Cleanup

Update GraphQL schemas, fix any broken queries caused by schema changes, then clean up deprecated field usage.

## Steps

### 1. Download latest schemas

Run:
```
pnpm graphql-update-schemas
```

### 2. Run codegen and fix errors iteratively

Run:
```
pnpm graphql-codegen
```

If codegen fails:
- Read the error messages carefully — they identify exactly which fields in which `.gql` files are broken (removed or renamed in the schema)
- Open the relevant `.gql` files and fix each broken field by checking the updated schema files in `scripts/graphql/dist/` for the correct replacement
- Re-run `pnpm graphql-codegen`
- Repeat until codegen passes, up to a maximum of 3 fix attempts
- If still failing after 3 attempts, **stop**, report all remaining errors clearly, and do not apply partial changes

### 3. Clean up deprecated fields

Once codegen passes, scan all `.gql` files in:
- `clients/banking/src/graphql/`
- `clients/payment/src/graphql/`
- `clients/onboarding/src/graphql/`
- `server/src/graphql/`
- `tests/graphql/`

For each field used in these files, cross-reference against the schema files in `scripts/graphql/dist/` to find any fields marked as `@deprecated`.

For each deprecated field found:
- Check the deprecation reason in the schema — it usually indicates the recommended replacement
- Replace the deprecated field with its suggested alternative
- If no replacement is indicated and the field is still present in the schema, flag it for manual review rather than removing it blindly

### 4. Final codegen pass

Run `pnpm graphql-codegen` one final time to confirm everything is clean.

### 5. Summary report

At the end, provide a summary:
- Schema changes that caused codegen errors (fields removed/renamed) and how they were fixed
- Deprecated fields replaced and what they were replaced with
- Any items flagged for manual review
