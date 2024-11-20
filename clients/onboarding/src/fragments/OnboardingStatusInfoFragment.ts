import { ResultOf } from "gql.tada";
import { graphql } from "../utils/gql";

export const OnboardingStatusInfoFragment = graphql(`
  fragment OnboardingStatusInfo on OnboardingStatusInfo {
    __typename
    ... on OnboardingInvalidStatusInfo {
      __typename
      errors {
        field
        errors
      }
    }
    ... on OnboardingFinalizedStatusInfo {
      __typename
    }
    ... on OnboardingValidStatusInfo {
      __typename
    }
  }
`);

export type OnboardingStatusInfoFragment = ResultOf<typeof OnboardingStatusInfoFragment>;
