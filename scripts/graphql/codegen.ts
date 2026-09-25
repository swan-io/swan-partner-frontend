import type { CodegenConfig } from "@graphql-codegen/cli";
import type { Types } from "@graphql-codegen/plugin-helpers";
import { Kind, visit } from "graphql";
import { normalize, resolve } from "pathe";

const file = (path: string) => normalize(resolve(__dirname, path));

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
  ID: "string",
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

const frontendPlugins = ["typescript", "typescript-operations", "typed-document-node"];
const backendPlugins = ["typescript", "typescript-operations", "typescript-graphql-request"];

const frontendConfig = {
  scalars,
  dedupeOperationSuffix: true,
  enumsAsTypes: true,
  nonOptionalTypename: true,
  defaultScalarType: "unknown",
};

const backendConfig = {
  ...frontendConfig,
  federation: true,
};

type Output = {
  path: string;
  documents: string;
  schema: string;
  plugins: string[];
  config: object;
};

const output = ({
  path,
  documents,
  schema,
  plugins,
  config,
}: Output): [string, Types.ConfiguredOutput] => {
  const outputFile = file(path);

  return [
    outputFile,
    {
      documents: file(documents),
      schema: file(schema),
      plugins,
      // `typescript-operations` v6 re-generates the enums and input objects used by
      // operations. Pointing it at the output file itself makes it reuse the ones already
      // emitted by the `typescript` plugin instead of duplicating them.
      config: { ...config, importSchemaTypesFrom: outputFile },
      documentTransforms: [{ transform: addTypenames }],
    },
  ];
};

const config: CodegenConfig = {
  errorsOnly: true,
  overwrite: true,
  importExtension: ".ts",

  generates: Object.fromEntries([
    output({
      path: "../../clients/payment/src/graphql/unauthenticated.ts",
      documents: "../../clients/payment/src/graphql/unauthenticated.gql",
      schema: "./dist/unauthenticated-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../clients/onboarding/src/graphql/unauthenticated.ts",
      documents: "../../clients/onboarding/src/graphql/unauthenticated.gql",
      schema: "./dist/unauthenticated-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../clients/onboarding/src/graphql/partner.ts",
      documents: "../../clients/onboarding/src/graphql/partner.gql",
      schema: "./dist/partner-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../clients/banking/src/graphql/partner.ts",
      documents: "../../clients/banking/src/graphql/partner.gql",
      schema: "./dist/partner-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../clients/banking/src/graphql/partner-admin.ts",
      documents: "../../clients/banking/src/graphql/partner-admin.gql",
      schema: "./dist/partner-admin-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../clients/banking/src/graphql/unauthenticated.ts",
      documents: "../../clients/banking/src/graphql/unauthenticated.gql",
      schema: "./dist/unauthenticated-schema.gql",
      plugins: frontendPlugins,
      config: frontendConfig,
    }),

    output({
      path: "../../server/src/graphql/partner.ts",
      documents: "../../server/src/graphql/partner.gql",
      schema: "./dist/partner-schema.gql",
      plugins: backendPlugins,
      config: backendConfig,
    }),

    output({
      path: "../../server/src/graphql/unauthenticated.ts",
      documents: "../../server/src/graphql/unauthenticated.gql",
      schema: "./dist/unauthenticated-schema.gql",
      plugins: backendPlugins,
      config: backendConfig,
    }),
  ]),
};

export default config;
