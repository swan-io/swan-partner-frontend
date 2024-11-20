import { graphql } from "../utils/gql";

export const DeleteSupportingDocumentMutation = graphql(`
  mutation DeleteSupportingDocument($input: DeleteSupportingDocumentInput!) {
    deleteSupportingDocument(input: $input) {
      __typename
      ... on DeleteSupportingDocumentSuccessPayload {
        id
      }
      ... on Rejection {
        message
      }
    }
  }
`);
