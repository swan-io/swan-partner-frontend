import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

export const routes = {
  PopupCallback: "/swanpopupcallback?:redirectUrl&:accountMembershipId&:projectId",

  ...createGroup(
    "SupportingDocumentCollection",
    "/supporting-document-collection/:supportingDocumentCollectionId",
    {
      Area: "/*",
      Root: "/",
      Success: "/success",
    },
  ),

  ...createGroup("", "/onboardings/:onboardingId", {
    Root: "/",
    Area: "/*",
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
} as const;

export const individualOnboardingRoutes = [
  "Root",
  "Email",
  "Location",
  "Details",
  "Finalize",
] as const;

export type IndividualOnboardingRoute = (typeof individualOnboardingRoutes)[number];

export const companyOnboardingRoutes = [
  "Root",
  "Presentation",
  "Registration",
  "Organisation1",
  "Organisation2",
  "Ownership",
  "Documents",
  "Finalize",
] as const;

export type CompanyOnboardingRoute = (typeof companyOnboardingRoutes)[number];

export const Router = createRouter(routes, {
  basePath: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/projects/${projectId}`,
    )
    .otherwise(() => undefined),
});
