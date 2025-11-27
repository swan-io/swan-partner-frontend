import { FlowPresentation, FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { match, P } from "ts-pattern";
import {
  GetVerificationRenewalQuery,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { t } from "../../utils/i18n";
import { Router, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import { VerificationRenewalFinalize } from "./VerificationRenewalFinalize";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";
import { VerificationRenewalPersonalInfo } from "./VerificationRenewalPersonalInfo";

type Props = {
  projectInfo: NonNullable<GetVerificationRenewalQuery["projectInfo"]>;
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  verificationRenewalId: string;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
};

export const VerificationRenewalIndividual = ({
  projectInfo,
  verificationRenewalId,
  verificationRenewal,
  supportingDocumentCollection,
}: Props) => {
  const route = Router.useRoute(verificationRenewalRoutes);

  const steps = useMemo(() => {
    const steps: FlowStep[] = [];

    steps.push({
      label: t("verificationRenewal.intro.step1"),
      icon: "person-regular",
    });

    if (isNotNullish(supportingDocumentCollection)) {
      steps.push({
        label: t("verificationRenewal.intro.step2"),
        icon: "document-regular",
      });
    }
    steps.push({
      label: t("verificationRenewal.intro.step3"),
      icon: "phone-regular",
    });

    return steps;
  }, [supportingDocumentCollection]);

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={commonStyles.fill}>
        {({ small }) => (
          <>
            <FlowPresentation mode={small ? "mobile" : "desktop"} steps={steps} />

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
          </>
        )}
      </ResponsiveContainer>
    </>
  );
};
