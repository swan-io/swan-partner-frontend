import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useCallback } from "react";
import { match } from "ts-pattern";
import { AddInternationalBeneficiaryDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  BeneficiaryInternationalWizardForm,
  InternationalBeneficiary,
} from "./BeneficiaryInternationalWizardForm";
import { WizardLayout } from "./WizardLayout";

type Props = {
  onPressClose?: () => void;
  accountId: string;
  accountMembershipId: string;
};

export const BeneficiaryInternationalWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
}: Props) => {
  const [addInternationalBeneficiary, internationalBeneficiaryAddition] = useMutation(
    AddInternationalBeneficiaryDocument,
  );

  const handleOnSubmit = useCallback(
    (beneficiary: InternationalBeneficiary) => {
      addInternationalBeneficiary({
        input: {
          accountId,
          currency: beneficiary.currency,
          details: beneficiary.values,
          name: beneficiary.name,
          route: beneficiary.route,
          consentRedirectUrl:
            window.location.origin +
            Router.AccountPaymentsBeneficiariesList({
              accountMembershipId,
              kind: "beneficiary",
            }),
        },
      })
        .mapOk(data => data.addTrustedInternationalBeneficiary)
        .mapOkToResult(data => Option.fromNullable(data).toResult(data))
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(({ trustedBeneficiary }) => {
          match(trustedBeneficiary.statusInfo)
            .with({ __typename: "TrustedBeneficiaryConsentPendingStatusInfo" }, ({ consent }) =>
              window.location.assign(consent.consentUrl),
            )
            .otherwise(() => {});
        })
        .tapError(error => {
          showToast({ variant: "error", error, title: translateError(error) });
        });
    },
    [accountId, accountMembershipId, addInternationalBeneficiary],
  );

  return (
    <WizardLayout
      title={t("beneficiaries.wizards.international.title")}
      onPressClose={onPressClose}
    >
      <LakeHeading level={2} variant="h3">
        {t("beneficiaries.wizards.international.subtitle")}
      </LakeHeading>

      <Space height={32} />

      <BeneficiaryInternationalWizardForm
        mode="add"
        submitting={internationalBeneficiaryAddition.isLoading()}
        saveCheckboxVisible={false}
        onPressPrevious={onPressClose}
        onPressSubmit={handleOnSubmit}
      />
    </WizardLayout>
  );
};
