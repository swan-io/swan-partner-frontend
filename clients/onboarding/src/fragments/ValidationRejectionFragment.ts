import { graphql } from "../utils/gql";

export const ValidationRejectionFragment = graphql(`
  fragment ValidationRejection on ValidationRejection {
    __typename
    fields {
      path
      code
      message
    }
  }
`);
