import { type CodegenConfig } from "@graphql-codegen/cli";
import type { Types } from "@graphql-codegen/plugin-helpers";
import { buildASTSchema, isObjectType, Kind, TypeInfo, visit, visitWithTypeInfo } from "graphql";

const scalars = {
  AccountNumber: "string",
  AmountValue: "string",
  AuditId: "string",
  AuthorizationId: "string",
  BIC: "string",
  CCA2: "@swan-io/shared-business/src/constants/countries#CountryCCA2",
  CCA3: "@swan-io/shared-business/src/constants/countries#CountryCCA3",
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

const config = {
  scalars,
  enumsAsTypes: true,
  defaultScalarType: "unknown",
  avoidOptionals: {
    field: true,
    object: true,
    inputValue: false,
    defaultValue: true,
    query: true,
    mutation: true,
    subscription: true,
  },
};

export const addIdToDocument = {
  transform: ({
    schema: astSchema,
    documents,
  }: Pick<
    Parameters<Types.DocumentTransformFunction>[0],
    "schema" | "documents"
  >): ReturnType<Types.DocumentTransformFunction> => {
    const schema = buildASTSchema(astSchema);
    const typeInfo = new TypeInfo(schema);

    return documents.map(documentFile => {
      if (!documentFile.document) {
        return documentFile;
      }

      documentFile.document = visit(
        documentFile.document,
        visitWithTypeInfo(typeInfo, {
          SelectionSet(node) {
            const parentType = typeInfo.getParentType();

            if (isObjectType(parentType)) {
              const fields = parentType.getFields();

              const selectionHasIdField = node.selections.some(
                selection => selection.kind === Kind.FIELD && selection.name.value === "id",
              );

              if (fields["id"] && !selectionHasIdField) {
                node.selections = [
                  ...node.selections,
                  {
                    kind: Kind.FIELD,
                    name: { kind: Kind.NAME, value: "id" },
                  },
                ];
              }
            }

            return node;
          },
        }),
      );

      return documentFile;
    });
  },
};

export default {
  generates: {
    "./clients/payment/src/gql/": {
      schema: "./scripts/graphql/dist/unauthenticated-schema.gql",
      documents: ["./clients/payment/src/**/*.{ts,tsx}"],
      preset: "client",
      config,
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
      documentTransforms: [{ transform: addIdToDocument }],
    },
    "./clients/onboarding/src/gql/": {
      schema: "./scripts/graphql/dist/unauthenticated-schema.gql",
      documents: ["./clients/onboarding/src/**/*.{ts,tsx}"],
      preset: "client",
      config,
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
      documentTransforms: [{ transform: addIdToDocument }],
    },
  },
} satisfies CodegenConfig;
