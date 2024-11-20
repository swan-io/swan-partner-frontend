import { ValidationRejectionFragment } from "../fragments/ValidationRejectionFragment";
import {
  IndividualAccountHolderInfoFragment,
  IndividualOnboardingInfoFragment,
} from "../pages/individual/OnboardingIndividualWizard";
import { graphql } from "../utils/gql";

export const UpdateIndividualOnboardingMutation = graphql(
  `
    mutation UpdateIndividualOnboarding(
      $input: UnauthenticatedUpdateIndividualOnboardingInput!
      $language: String!
    ) {
      unauthenticatedUpdateIndividualOnboarding(input: $input) {
        __typename
        ... on UnauthenticatedUpdateIndividualOnboardingSuccessPayload {
          onboarding {
            id
            ...IndividualOnboardingInfo
            info {
              __typename
              ... on OnboardingIndividualAccountHolderInfo {
                ...IndividualAccountHolderInfo
              }
            }
          }
        }
        ... on ValidationRejection {
          ...ValidationRejection
        }
      }
    }
  `,
  [
    ValidationRejectionFragment,
    IndividualAccountHolderInfoFragment,
    IndividualOnboardingInfoFragment,
  ],
);
