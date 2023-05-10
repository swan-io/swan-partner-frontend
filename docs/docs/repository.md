---
title: Repository
sidebar_label: Repository
---

The Swan Partner Frontend repository contains two main elements:

## Clients

### Technologies

- [TypeScript](https://www.typescriptlang.org/): the programming language
- [React](https://react.dev/): the UI library
- [React Native Web](https://necolas.github.io/react-native-web/): the low-level building blocks
- [Chicane](https://swan-io.github.io/chicane/): the routing library
- [URQL](https://formidable.com/open-source/urql/): the GraphQL client
- [Boxed](https://swan-io.github.io/boxed/): the functional toolbox

### Structure

In the `./clients` directory, you'll find the two frontend clients:

- **banking**: the banking interface, including transactions, cards, payments & memberships
- **onboarding**: the form for an end user to create a Swan account

#### `public`

The `public` directory contents are copied to the root of the application as-is. It can be useful for favicons, robots.txt files etc.

#### `src`

The `src` directory is where the application lives with the following entry files:

- `index.html`: the HTML entry point
- `index.tsx`: the TypeScript entry point
- `App.tsx`: the root React app component

and the following directories:

- `assets`: files you want to import from the TypeScript application
- `components`: React components
- `graphql`: the GraphQL documents used in the app
- `locales`: the translations files (JSON)
- `pages`: the "root" components for pages
- `utils`: some files used around the codebase

## Server

In the `./server` directory, you'll find the "Back-for-Front". Its role is to:

- Handle OAuth2
- Manage user sessions
- Proxy Swan's GraphQL APIs
- Handle some business logic
- Serve the client application

### Technologies

- [NodeJS](https://nodejs.org/en): the environment
- [TypeScript](https://www.typescriptlang.org/): the programming language
- [Fastify](https://www.fastify.io/): the server framework
- [Boxed](https://swan-io.github.io/boxed/): the functional toolbox

### Structure

#### `src`

The `src` directory is where the application lives with:

- `index.ts`: the server entry point
- `app.ts`: the server main router
- `env.ts`: the environment variables

and the following directories:

- `api`: OAuth2 and API-related functions
- `client`: logic for serving and caching files given the environment
- `graphql`: queries and mutations performed by the server
