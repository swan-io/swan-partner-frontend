import { graphql } from "../utils/gql";

export const GenerateSupportingDocumentUploadUrlMutation = graphql(`
  mutation GenerateSupportingDocumentUploadUrl($input: GenerateSupportingDocumentUploadUrlInput!) {
    generateSupportingDocumentUploadUrl(input: $input) {
      __typename
      ... on GenerateSupportingDocumentUploadUrlSuccessPayload {
        supportingDocumentId
        upload {
          fields {
            key
            value
          }
          url
        }
      }
    }
  }
`);
