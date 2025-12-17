import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

export const routes = {
  ...createGroup(
    "SupportingDocumentCollection",
    "/supporting-document-collection/:supportingDocumentCollectionId",
    {
      Area: "/*",
      Root: "/",
      Success: "/success",
    },
  ),

  ...createGroup("ChangeAdmin", "/change-account-admin/:requestId", {
    Area: "/*",
    Root: "/",
    Context1: "/context-1",
    Context2: "/context-2",
    Requester: "/requester",
    NewAdmin: "/new-admin",
    Documents: "/documents",
    Confirm: "/confirm",
  }),

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

export const changeAdminRoutes = [
  "ChangeAdminRoot",
  "ChangeAdminContext1",
  "ChangeAdminContext2",
  "ChangeAdminRequester",
  "ChangeAdminNewAdmin",
  "ChangeAdminDocuments",
  "ChangeAdminConfirm",
] as const;

export type ChangeAdminRoute = (typeof changeAdminRoutes)[number];

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
