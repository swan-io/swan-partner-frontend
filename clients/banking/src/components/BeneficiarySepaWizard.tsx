import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useCallback } from "react";
import { match } from "ts-pattern";
import { AccountCountry, AddSepaBeneficiaryDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { BeneficiarySepaWizardForm, SepaBeneficiary } from "./BeneficiarySepaWizardForm";
import { WizardLayout } from "./WizardLayout";

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
};

export const BeneficiarySepaWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
}: Props) => {
  const [addSepaBeneficiary, sepaBeneficiaryAddition] = useMutation(AddSepaBeneficiaryDocument);

  const handleOnSubmit = useCallback(
    (beneficiary: SepaBeneficiary) => {
      addSepaBeneficiary({
        input: {
          accountId,
          iban: beneficiary.iban,
          name: beneficiary.name,
          consentRedirectUrl:
            window.location.origin +
            Router.AccountPaymentsBeneficiariesList({
              accountMembershipId,
              kind: "beneficiary",
            }),
        },
      })
        .mapOk(data => data.addTrustedSepaBeneficiary)
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
    [accountId, accountMembershipId, addSepaBeneficiary],
  );

  return (
    <WizardLayout title={t("beneficiaries.wizards.sepa.title")} onPressClose={onPressClose}>
      <LakeHeading level={2} variant="h3">
        {t("beneficiaries.wizards.sepa.subtitle")}
      </LakeHeading>

      <Space height={32} />

      <BeneficiarySepaWizardForm
        mode="add"
        submitting={sepaBeneficiaryAddition.isLoading()}
        accountCountry={accountCountry}
        accountId={accountId}
        saveCheckboxVisible={false}
        onPressPrevious={onPressClose}
        onPressSubmit={handleOnSubmit}
      />
    </WizardLayout>
  );
};
