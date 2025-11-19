import { Box } from "@swan-io/lake/src/components/Box";
import { backgroundColor, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import {
  GetVerificationRenewalQuery,
  IndividualVerificationRenewalAccountAdmin,
} from "../../graphql/partner";
import { VerificationRenewalHeader } from "./VerificationRenewalHeader";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";

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
};

export const VerificationRenewalIndividual = ({ accountAdmin, projectInfo }: Props) => {
  console.log(accountAdmin);

  return (
    <Box grow={1} style={styles.container} justifyContent="center">
      <Box style={styles.sticky}>
        <VerificationRenewalHeader
          projectName={projectInfo.name}
          projectLogo={projectInfo.logoUri}
        />

        <VerificationRenewalIntro />
      </Box>
    </Box>
  );
};
