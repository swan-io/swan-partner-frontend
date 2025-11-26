import { Box } from "@swan-io/lake/src/components/Box";
import { backgroundColor, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  GetVerificationRenewalQuery,
  IndividualVerificationRenewalAccountAdmin,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { Router, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import { VerificationRenewalFinalize } from "./VerificationRenewalFinalize";
import { VerificationRenewalHeader } from "./VerificationRenewalHeader";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";
import { VerificationRenewalPersonalInfo } from "./VerificationRenewalPersonalInfo";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 1280,
    paddingHorizontal: 40,
    paddingTop: spacings[40],
  },
  stepper: {
    width: "100%",
    maxWidth: 1280,
    paddingHorizontal: 40,
  },
  sticky: {
    position: "sticky",
    top: 0,
    backgroundColor: backgroundColor.default90Transparency,
    backdropFilter: "blur(4px)",
    zIndex: 10,
  },
});

type Props = {
  accountAdmin: IndividualVerificationRenewalAccountAdmin;
  projectInfo: NonNullable<GetVerificationRenewalQuery["projectInfo"]>;
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  verificationRenewalId: string;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
};

export const VerificationRenewalIndividual = ({
  accountAdmin,
  projectInfo,
  verificationRenewalId,
  verificationRenewal,
  supportingDocumentCollection,
}: Props) => {
  console.log(accountAdmin);
  const route = Router.useRoute(verificationRenewalRoutes);

  return (
    <Box grow={1} style={styles.container} justifyContent="center">
      <Box style={styles.sticky}>
        <VerificationRenewalHeader
          projectName={projectInfo.name}
          projectLogo={projectInfo.logoUri}
        />
      </Box>
      {match({ route, supportingDocumentCollection })
        .with({ route: { name: "VerificationRenewalRoot" } }, () => (
          <VerificationRenewalIntro verificationRenewalId={verificationRenewalId} />
        ))
        .with({ route: { name: "VerificationRenewalPersonalInformation" } }, () => (
          <VerificationRenewalPersonalInfo
            projectInfo={projectInfo}
            verificationRenewal={verificationRenewal}
          />
        ))
        .with(
          {
            route: { name: "VerificationRenewalDocuments" },
            supportingDocumentCollection: P.nonNullable,
          },
          ({ supportingDocumentCollection }) => (
            <VerificationRenewalDocuments
              verificationRenewal={verificationRenewal}
              supportingDocumentCollection={supportingDocumentCollection}
            />
          ),
        )
        .with({ route: { name: "VerificationRenewalFinalize" } }, () => (
          <VerificationRenewalFinalize />
        ))
        .with(P.nullish, () => <NotFoundPage />)

        .otherwise(() => (
          <ErrorView />
        ))}
    </Box>
  );
};
