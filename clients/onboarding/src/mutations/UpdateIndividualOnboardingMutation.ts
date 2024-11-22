import { graphql } from "../gql";

export const UpdateIndividualOnboardingMutation = graphql(`
  mutation UpdateIndividualOnboarding(
    $input: UnauthenticatedUpdateIndividualOnboardingInput!
    $language: String!
  ) {
    unauthenticatedUpdateIndividualOnboarding(input: $input) {
      __typename
      ... on UnauthenticatedUpdateIndividualOnboardingSuccessPayload {
        onboarding {
          id
          ...OnboardingIndividualWizard_OnboardingInfo
          info {
            __typename
            ... on OnboardingIndividualAccountHolderInfo {
              ...OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo
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
