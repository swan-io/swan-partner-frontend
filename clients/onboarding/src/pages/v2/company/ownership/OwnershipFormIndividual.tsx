import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  RegulatoryClassification,
  RelatedIndividualInput,
  RelatedIndividualType,
} from "../../../../graphql/partner";
import {
  OnboardingCompanyOwnershipFormIndividualAddressRef,
  OwnershipFormIndividualAddress,
} from "./OwnershipFormIndividualAddress";
import {
  OnboardingCompanyOwnershipFormIndividualCapitalRef,
  OwnershipFormIndividualCapital,
} from "./OwnershipFormIndividualCapital";
import {
  OnboardingCompanyOwnershipFormIndividualDetailsRef,
  OwnershipFormIndividualDetails,
} from "./OwnershipFormIndividualDetails";
import {
  OnboardingCompanyOwnershipFormIndividualIdentityRef,
  OwnershipFormIndividualIdentity,
} from "./OwnershipFormIndividualIdentity";
import { OwnershipFormStep, OwnershipSubForm } from "./OwnershipFormWizard";

export type OnboardingCompanyOwnershipFormIndividualRef = {
  submit: () => void;
};

type Props = {
  initialValues: Partial<RelatedIndividualInput>;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualRef>;
  companyCountry: CountryCCA3;
  accountCountry: AccountCountry;
  regulatoryClassification?: RegulatoryClassification;
  step: Extract<OwnershipFormStep, "legal" | "legalAndUbo" | "ubo">;
  individualType: RelatedIndividualType;
  subForm?: OwnershipSubForm;
  onSave: (input: RelatedIndividualInput) => void | Promise<void>;
  onNext: (subForm: OwnershipSubForm) => void;
};

export const OwnershipFormIndividual = ({
  ref,
  onSave,
  onNext,
  step,
  companyCountry,
  accountCountry,
  regulatoryClassification,
  initialValues,
  individualType,
  subForm,
}: Props) => {
  const detailRef = useRef<OnboardingCompanyOwnershipFormIndividualDetailsRef>(null);
  const capitalRef = useRef<OnboardingCompanyOwnershipFormIndividualCapitalRef>(null);
  const addressRef = useRef<OnboardingCompanyOwnershipFormIndividualAddressRef>(null);
  const identityRef = useRef<OnboardingCompanyOwnershipFormIndividualIdentityRef>(null);

  const [localValue, setLocalValue] = useState<RelatedIndividualInput>(() => ({
    ...initialValues,
    type: individualType,
  }));

  const isIdentityRequired = match(accountCountry)
    .with("ITA", () => true)
    .otherwise(() => false);

  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        match(subForm)
          .with("identity", () => identityRef.current?.submit())
          .with("capital", () => capitalRef.current?.submit())
          .with("address", () => addressRef.current?.submit())
          .with(P.union("detail", P.nullish), () => detailRef.current?.submit())
          .exhaustive();
      },
    };
  });

  return match(subForm)
    .with("identity", () => (
      <OwnershipFormIndividualIdentity
        ref={identityRef}
        initialValues={localValue}
        onSave={identityDocumentInfo => {
          const { ultimateBeneficialOwner, ...rest } = localValue;

          onSave({
            ...rest,
            ultimateBeneficialOwner: {
              ...ultimateBeneficialOwner,
              identityDocumentInfo,
            },
          });
        }}
      />
    ))
    .with("capital", () => (
      <OwnershipFormIndividualCapital
        ref={capitalRef}
        initialValues={localValue}
        accountCountry={accountCountry}
        regulatoryClassification={regulatoryClassification}
        onSave={input => {
          if (isIdentityRequired) {
            const { ultimateBeneficialOwner, taxIdentificationNumber } = input;
            setLocalValue(prevState => {
              return {
                ...prevState,
                taxIdentificationNumber,
                ultimateBeneficialOwner: {
                  ...prevState.ultimateBeneficialOwner,
                  ...ultimateBeneficialOwner,
                },
              };
            });
            onNext("identity");
          } else {
            onSave({ ...localValue, ...input });
          }
        }}
      />
    ))
    .with("address", () => (
      <OwnershipFormIndividualAddress
        ref={addressRef}
        initialValues={localValue}
        companyCountry={companyCountry}
        onSave={input => {
          if (step === "legal") {
            onSave({ ...localValue, ...input, type: individualType });
          } else {
            setLocalValue(prevState => ({ ...prevState, ...input, type: individualType }));
            onNext("capital");
          }
        }}
      />
    ))
    .with(P.union("detail", P.nullish), () => (
      <OwnershipFormIndividualDetails
        ref={detailRef}
        initialValues={localValue}
        companyCountry={companyCountry}
        onSave={input => {
          setLocalValue(prevState => ({ ...prevState, ...input }));
          onNext("address");
        }}
      />
    ))
    .exhaustive();
};
