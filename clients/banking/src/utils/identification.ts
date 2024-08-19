import { P, isMatching, match } from "ts-pattern";
import { IdentificationFragment, IdentificationLevelFragment } from "../graphql/partner";

const temp__handleLegacyStatus = (
  identificationLevel: IdentificationLevelFragment,
): Exclude<
  IdentificationLevelFragment,
  { __typename: "NotStartedIdentificationLevelStatusInfo" }
> => {
  if (identificationLevel.__typename === "NotStartedIdentificationLevelStatusInfo") {
    return { __typename: "StartedIdentificationLevelStatusInfo", status: "Started" };
  } else {
    return identificationLevel;
  }
};

export const getIdentificationLevelStatusInfo = (identification: IdentificationFragment) =>
  match(identification)
    .returnType<
      Exclude<
        IdentificationLevelFragment,
        { __typename: "NotStartedIdentificationLevelStatusInfo" }
      >
    >()
    .with({ process: "Expert", levels: { expert: P.select() } }, statusInfo =>
      temp__handleLegacyStatus(statusInfo),
    )
    .with(
      {
        process: "QES",
      },
      ({ levels: { expert, qes } }) =>
        "status" in expert && expert.status === "Valid"
          ? temp__handleLegacyStatus(qes)
          : temp__handleLegacyStatus(expert),
    )
    .with({ process: "PVID", levels: { pvid: P.select() } }, statusInfo =>
      temp__handleLegacyStatus(statusInfo),
    )
    .otherwise(() => ({
      __typename: "StartedIdentificationLevelStatusInfo",
      status: "Started",
    }));

export const isReadyToSign = isMatching({
  process: "QES",
  levels: {
    expert: { status: P.union("Pending", "Valid") },
    qes: { status: P.not(P.union("Started", "Pending")) },
  },
});
