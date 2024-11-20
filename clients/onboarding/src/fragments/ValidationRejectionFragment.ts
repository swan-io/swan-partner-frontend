import { ResultOf } from "gql.tada";
import { graphql } from "../utils/gql";

export const ValidationRejectionFragment = graphql(`
  fragment ValidationRejection on ValidationRejection @_unmask {
    __typename
    fields {
      path
      code
      message
    }
  }
`);

export type ValidationRejectionFragment = ResultOf<typeof ValidationRejectionFragment>;
