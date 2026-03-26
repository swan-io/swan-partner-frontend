import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import {
  CompanyOnboardingFragment,
  RelatedIndividualInput,
  RelatedIndividualType,
  RelatedIndividualUltimateBeneficialOwnerInput,
} from "../../../../graphql/partner";
import { namesMatch } from "../../../../utils/onboarding";
import { ServerInvalidFieldCode } from "../../../../utils/validation";
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
  onboarding: NonNullable<CompanyOnboardingFragment>;
  companyCountry: CountryCCA3;
  step: Extract<OwnershipFormStep, "legal" | "legalAndUbo" | "ubo">;
  individualType: RelatedIndividualType;
  errors: { fieldName: string; code: ServerInvalidFieldCode }[];
  subForm?: OwnershipSubForm;
  mode: "add" | "edit";
  onSave: (input: RelatedIndividualInput) => void | Promise<void>;
  onNext: (subForm: OwnershipSubForm) => void;
};

export const OwnershipFormIndividual = ({
  ref,
  onboarding,
  onSave,
  onNext,
  step,
  companyCountry,
  initialValues,
  errors,
  individualType,
  subForm,
  mode,
}: Props) => {
  const detailRef = useRef<OnboardingCompanyOwnershipFormIndividualDetailsRef>(null);
  const capitalRef = useRef<OnboardingCompanyOwnershipFormIndividualCapitalRef>(null);
  const addressRef = useRef<OnboardingCompanyOwnershipFormIndividualAddressRef>(null);
  const identityRef = useRef<OnboardingCompanyOwnershipFormIndividualIdentityRef>(null);

  const { company, accountInfo, accountAdmin } = onboarding;
  const accountCountry = accountInfo?.country ?? "FRA";
  const regulatoryClassification = company?.regulatoryClassification ?? undefined;

  const isAccountAdmin = accountAdmin && namesMatch(accountAdmin, initialValues);
  console.log("isAccountAdmin", isAccountAdmin);

  const [localValue, setLocalValue] = useState<RelatedIndividualInput>(() => {
    const base = { ...initialValues, type: individualType };
    if (initialValues.type === individualType) {
      return base;
    }

    // If editing the type we need to drop existing field
    return match(individualType)
      .with("LegalRepresentative", () => ({
        ...base,
        ultimateBeneficialOwner: undefined,
      }))
      .with("UltimateBeneficialOwner", () => ({
        ...base,
        legalRepresentative: undefined,
      }))
      .with("LegalRepresentativeAndUltimateBeneficialOwner", () => base)
      .exhaustive();
  });

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
        errors={errors}
        onSave={identityDocumentInfo => {
          const { ultimateBeneficialOwner, ...rest } = localValue;
          onSave({
            ...rest,
            ultimateBeneficialOwner: {
              ...(ultimateBeneficialOwner as RelatedIndividualUltimateBeneficialOwnerInput), // Enforcing type as ultimateBeneficialOwner can not be undefiend because set in the previous step
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
        errors={errors}
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
        errors={errors}
        companyCountry={companyCountry}
        mode={mode}
        onSave={input => {
          if (step === "legal") {
            onSave({ ...localValue, ...input });
          } else {
            setLocalValue(prevState => ({ ...prevState, ...input }));
            onNext("capital");
          }
        }}
      />
    ))
    .with(P.union("detail", P.nullish), () => (
      <OwnershipFormIndividualDetails
        ref={detailRef}
        initialValues={localValue}
        errors={errors}
        companyCountry={companyCountry}
        mode={mode}
        onSave={input => {
          setLocalValue(prevState => ({ ...prevState, ...input }));
          onNext("address");
        }}
      />
    ))
    .exhaustive();
};
