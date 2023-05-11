import type { CodegenConfig } from "@graphql-codegen/cli";
import type { Types } from "@graphql-codegen/plugin-helpers";
import { Kind, visit } from "graphql";
import { resolve } from "pathe";

const file = (path: string) => resolve(__dirname, path);

const addTypenames: Types.DocumentTransformFunction = ({ documents }) =>
  documents.map(({ document, ...rest }) => {
    if (!document) {
      return rest;
    }

    return {
      ...rest,
      document: visit(document, {
        SelectionSet: {
          leave(node) {
            const hasTypename = node.selections.some(
              selection =>
                selection.kind === Kind.FIELD &&
                (selection.name.value === "__typename" ||
                  selection.name.value.lastIndexOf("__", 0) === 0),
            );

            if (!hasTypename) {
              node.selections = [
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: "__typename" } },
                ...node.selections,
              ];
            }
          },
        },
      }),
    };
  });

const scalars = {
  AccountNumber: "string",
  AmountValue: "string",
  AuditId: "string",
  AuthorizationId: "string",
  BIC: "string",
  CCA2: "string",
  CCA3: "string",
  CardToken: "string",
  Currency: "string",
  Date: "string",
  DateTime: "string",
  EmailAddress: "string",
  HexColorCode: "string",
  IBAN: "string",
  PIN: "string",
  PhoneNumber: "string",
  PostalCode: "string",
  SepaCreditorIdentifier: "string",
  SepaReference: "string",
  TokenRequestorId: "string",
  URL: "string",
  Upload: "unknown",
  WalletToken: "string",
  join__FieldSet: "unknown",
};

const clientPlugins = [
  "typescript",
  "typescript-operations",
  "typed-document-node",
  "typescript-urql-graphcache",
];

const clientConfig = {
  scalars,
  dedupeOperationSuffix: true,
  enumsAsTypes: true,
  nonOptionalTypename: true,
  defaultScalarType: "unknown",
  inlineFragmentTypes: "combine",
};

const serverPlugins = ["typescript", "typescript-operations", "typescript-graphql-request"];

const serverConfig = {
  ...clientConfig,
  federation: true,
};

const config: CodegenConfig = {
  errorsOnly: true,
  overwrite: true,

  hooks: {
    afterAllFileWrite: "prettier --write",
  },

  generates: {
    [file("../../clients/onboarding/src/graphql/unauthenticated.ts")]: {
      documents: file("../../clients/onboarding/src/graphql/unauthenticated.gql"),
      schema: file("./dist/unauthenticated-schema.gql"),
      plugins: clientPlugins,
      config: clientConfig,
      documentTransforms: [{ transform: addTypenames }],
    },

    [file("../../clients/onboarding/src/graphql/introspection.json")]: {
      schema: file("./dist/unauthenticated-schema.gql"),
      plugins: ["introspection"],
      config: { descriptions: false },
      hooks: {
        afterOneFileWrite: "yarn tsx scripts/graphql/cleanIntrospectionSchema.ts",
      },
    },

    [file("../../clients/banking/src/graphql/partner.ts")]: {
      documents: file("../../clients/banking/src/graphql/partner.gql"),
      schema: file("./dist/partner-schema.gql"),
      plugins: clientPlugins,
      config: clientConfig,
      documentTransforms: [{ transform: addTypenames }],
    },

    [file("../../clients/banking/src/graphql/unauthenticated.ts")]: {
      documents: file("../../clients/banking/src/graphql/unauthenticated.gql"),
      schema: file("./dist/unauthenticated-schema.gql"),
      config: clientConfig,
      plugins: clientPlugins,
      documentTransforms: [{ transform: addTypenames }],
    },

    [file("../../clients/banking/src/graphql/introspection.json")]: {
      schema: file("./dist/partner-schema.gql"),
      plugins: ["introspection"],
      config: { descriptions: false },
      hooks: {
        afterOneFileWrite: "yarn tsx scripts/graphql/cleanIntrospectionSchema.ts",
      },
    },

    [file("../../server/src/graphql/partner.ts")]: {
      documents: file("../../server/src/graphql/partner.gql"),
      schema: file("./dist/partner-schema.gql"),
      plugins: serverPlugins,
      config: serverConfig,
      documentTransforms: [{ transform: addTypenames }],
    },

    [file("../../server/src/graphql/unauthenticated.ts")]: {
      documents: file("../../server/src/graphql/unauthenticated.gql"),
      schema: file("./dist/unauthenticated-schema.gql"),
      plugins: serverPlugins,
      config: serverConfig,
      documentTransforms: [{ transform: addTypenames }],
    },
  },
};

export default config;
