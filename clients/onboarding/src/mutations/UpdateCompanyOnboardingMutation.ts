import { ValidationRejectionFragment } from "../fragments/ValidationRejectionFragment";
import {
  CompanyAccountHolderInfoFragment,
  CompanyOnboardingInfoFragment,
} from "../pages/company/CompanyOnboardingWizard";
import { graphql } from "../utils/gql";

export const UpdateCompanyOnboardingMutation = graphql(
  `
    mutation UpdateCompanyOnboarding(
      $input: UnauthenticatedUpdateCompanyOnboardingInput!
      $language: String!
    ) {
      unauthenticatedUpdateCompanyOnboarding(input: $input) {
        __typename
        ... on UnauthenticatedUpdateCompanyOnboardingSuccessPayload {
          onboarding {
            id
            ...CompanyOnboardingInfo
            info {
              __typename
              ... on OnboardingCompanyAccountHolderInfo {
                ...CompanyAccountHolderInfo
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
  [ValidationRejectionFragment, CompanyAccountHolderInfoFragment, CompanyOnboardingInfoFragment],
);
