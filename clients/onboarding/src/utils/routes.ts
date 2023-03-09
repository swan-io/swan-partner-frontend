import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { match, P } from "ts-pattern";
import { projectConfiguration } from "./projectId";

export const Router = createRouter(
  {
    Onboarding: "/onboardings/:onboardingId",
    PopupCallback: "/swanpopupcallback?:redirectUrl&:accountMembershipId",

    // Onboarding revamp, once completed, we should remove v2 prefix and `Onboarding` route above
    ...createGroup("V2_Onboarding", "/onboardings/:onboardingId", {
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
        Option.pattern.Some({ projectId: P.select(), mode: "MultiProject" }),
        projectId => `/projects/${projectId}`,
      )
      .otherwise(() => undefined),
  },
);

export const individualOnboardingRoutes = [
  "V2_OnboardingRoot",
  "V2_OnboardingEmail",
  "V2_OnboardingLocation",
  "V2_OnboardingDetails",
  "V2_OnboardingFinalize",
] as const;

export type IndividualOnboardingRoute = (typeof individualOnboardingRoutes)[number];

export const companyOnboardingRoutes = [
  "V2_OnboardingRoot",
  "V2_OnboardingPresentation",
  "V2_OnboardingRegistration",
  "V2_OnboardingOrganisation1",
  "V2_OnboardingOrganisation2",
  "V2_OnboardingOwnership",
  "V2_OnboardingDocuments",
  "V2_OnboardingFinalize",
] as const;

export type CompanyOnboardingRoute = (typeof companyOnboardingRoutes)[number];
