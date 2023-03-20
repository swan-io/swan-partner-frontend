# Branding

The Web Banking is white-label interface, and therefore needs to use the branding defined on the project it manages accounts on.

You can receive get the **logo**, **name** and **accent color**, you can use the following fragment.

```graphql
fragment ProjectBranding on ProjectInfo {
  id
  accentColor
  name
  logoUri
}
```

On the Partner API, with a user token (when logged in):

```graphql
query {
  projectInfo {
    ...ProjectBranding
  }
}
```

On the Unauthenticated API (when logged out):

```graphql
query {
  projectInfo(id: $projectId, env: $env) {
    ...ProjectBranding
  }
}
```
