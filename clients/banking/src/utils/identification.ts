import { P, isMatching, match } from "ts-pattern";
import { IdentificationFragment, IdentificationLevelFragment } from "../graphql/partner";

export const getIdentificationLevelStatusInfo = (identification: IdentificationFragment) =>
  match(identification)
    .returnType<IdentificationLevelFragment>()
    .with({ process: "Expert", levels: { expert: P.select() } }, statusInfo => statusInfo)
    .with(
      {
        process: "QES",
      },
      ({ levels: { expert, qes } }) => (expert.status === "Valid" ? qes : expert),
    )
    .with({ process: "PVID", levels: { pvid: P.select() } }, statusInfo => statusInfo)
    .otherwise(() => ({
      __typename: "NotStartedIdentificationLevelStatusInfo",
      status: "NotStarted",
    }));

export const isReadyToSign = isMatching({
  process: "QES",
  levels: {
    expert: { status: P.union("Pending", "Valid") },
    qes: { status: P.not(P.union("Started", "Pending")) },
  },
});
