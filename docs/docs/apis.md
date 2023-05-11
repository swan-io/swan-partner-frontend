# APIs

The server exposes two GraphQL API endpoints:

- **POST `/api/partner`**: Swan Partner API.
  This endpoint requires the user to have an active session.
- **POST `/api/unauthenticated`**: Swan Unauthenticated API.
  This is used for the onboarding process before the user had a chance to authenticate.
