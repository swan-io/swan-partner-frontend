# Branding

Web banking uses the branding (logo, name, and accent color) defined at the project level.
Additionally, you can modify your instance of the open source code to customize fonts and more.

You can retrieve the **logo**, **name**, and **accent color** with the following fragment:

```graphql
fragment ProjectBranding on ProjectInfo {
  id
  accentColor
  name
  logoUri
}
```

If logged in, use the **Partner API** and a **user access token** to run the following query:

```graphql
query {
  projectInfo {
    ...ProjectBranding
  }
}
```

If logged out, use the **Unauthenticated API** to run the following query:

```graphql
query {
  projectInfo(id: $projectId, env: $env) {
    ...ProjectBranding
  }
}
```
