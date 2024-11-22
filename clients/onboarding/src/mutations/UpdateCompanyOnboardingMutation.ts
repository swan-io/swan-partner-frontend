import { graphql } from "../gql";

export const UpdateCompanyOnboardingMutation = graphql(`
  mutation UpdateCompanyOnboarding(
    $input: UnauthenticatedUpdateCompanyOnboardingInput!
    $language: String!
  ) {
    unauthenticatedUpdateCompanyOnboarding(input: $input) {
      __typename
      ... on UnauthenticatedUpdateCompanyOnboardingSuccessPayload {
        onboarding {
          id
          ...OnboardingCompanyWizard_OnboardingInfo
          info {
            __typename
            ... on OnboardingCompanyAccountHolderInfo {
              ...OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo
            }
          }
        }
      }
      ... on ValidationRejection {
        fields {
          path
          code
          message
        }
      }
    }
  }
`);
