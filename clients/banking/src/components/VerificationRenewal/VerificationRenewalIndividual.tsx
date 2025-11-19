import { Box } from "@swan-io/lake/src/components/Box";
import { backgroundColor, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  GetVerificationRenewalQuery,
  IndividualVerificationRenewalAccountAdmin,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { Router, verificationRenewalRoutes } from "../../utils/routes";
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
  verificationRenewalId: string;
};

export const VerificationRenewalIndividual = ({
  accountAdmin,
  projectInfo,
  verificationRenewalId,
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
      {match(route)
        .with({ name: "VerificationRenewalRoot" }, () => (
          <VerificationRenewalIntro verificationRenewalId={verificationRenewalId} />
        ))
        .with({ name: "VerificationRenewalDocuments" }, () => (
          <VerificationRenewalDocuments verificationRenewalId={verificationRenewalId} />
        ))
        .with({ name: "VerificationRenewalPersonalInformation" }, () => (
          <VerificationRenewalPersonalInfo verificationRenewalId={verificationRenewalId} />
        ))
        .with({ name: "VerificationRenewalFinalize" }, () => <VerificationRenewalFinalize />)
        .with(P.nullish, () => <NotFoundPage />)

        .exhaustive()}
    </Box>
  );
};
