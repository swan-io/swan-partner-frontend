import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

export const Router = createRouter(
  {
    Onboarding: "/onboardings/:onboardingId",
    PopupCallback: "/swanpopupcallback?:redirectUrl&:accountMembershipId&:projectId",

    // Onboarding revamp, once completed, we should remove v2 prefix and `Onboarding` route above
    ...createGroup("Onboarding", "/onboardings/:onboardingId", {
      Area: "/*",
      Root: "/",
      Email: "/email",
      Location: "/location",
      Details: "/details",
      Presentation: "/presentation",
      Registration: "/registration",
      Organisation1: "/organisation-1",
      Organisation2: "/organisation-2",
      Ownership: "/ownership",
      Documents: "/documents",
      Finalize: "/finalize",
    }),
  },
  {
    basePath: match(projectConfiguration)
      .with(
        Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
        projectId => `/projects/${projectId}`,
      )
      .otherwise(() => undefined),
  },
);

export const individualOnboardingRoutes = [
  "OnboardingRoot",
  "OnboardingEmail",
  "OnboardingLocation",
  "OnboardingDetails",
  "OnboardingFinalize",
] as const;

export type IndividualOnboardingRoute = (typeof individualOnboardingRoutes)[number];

export const companyOnboardingRoutes = [
  "OnboardingRoot",
  "OnboardingPresentation",
  "OnboardingRegistration",
  "OnboardingOrganisation1",
  "OnboardingOrganisation2",
  "OnboardingOwnership",
  "OnboardingDocuments",
  "OnboardingFinalize",
] as const;

export type CompanyOnboardingRoute = (typeof companyOnboardingRoutes)[number];
