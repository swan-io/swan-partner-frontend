import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { RelatedIndividualInput, RelatedIndividualType } from "../../../../graphql/partner";
import {
  OnboardingCompanyOwnershipFormIndividualCapitalRef,
  OwnershipFormIndividualCapital,
} from "./OwnershipFormIndividualCapital";
import {
  OnboardingCompanyOwnershipFormIndividualDetailsRef,
  OwnershipFormIndividualDetails,
} from "./OwnershipFormIndividualDetails";
import { OwnershipFormStep, OwnershipSubForm } from "./OwnershipFormWizard";

export type OnboardingCompanyOwnershipFormIndividualRef = {
  submit: () => void;
};

type Props = {
  initialValues: Partial<RelatedIndividualInput>;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualRef>;
  companyCountry: CountryCCA3;
  step: Extract<OwnershipFormStep, "legal" | "legalAndUbo" | "ubo">;
  individualType: RelatedIndividualType;
  subForm?: OwnershipSubForm;
  onSave: (input: RelatedIndividualInput) => void | Promise<void>;
  onNext: () => void;
};

export const OwnershipFormIndividual = ({
  ref,
  onSave,
  onNext,
  step,
  companyCountry,
  initialValues,
  individualType,
  subForm,
}: Props) => {
  const detailRef = useRef<OnboardingCompanyOwnershipFormIndividualDetailsRef>(null);
  const capitalRef = useRef<OnboardingCompanyOwnershipFormIndividualCapitalRef>(null);

  const [localValue, setLocalValue] = useState<RelatedIndividualInput>(() => ({
    ...initialValues,
    type: individualType,
  }));

  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        subForm === "capital" ? capitalRef.current?.submit() : detailRef.current?.submit();
      },
    };
  });

  return subForm === "capital" ? (
    <OwnershipFormIndividualCapital
      ref={capitalRef}
      initialValues={localValue}
      onSave={input => {
        onSave({ ...localValue, ...input });
      }}
    />
  ) : (
    <OwnershipFormIndividualDetails
      ref={detailRef}
      initialValues={localValue}
      companyCountry={companyCountry}
      onSave={input => {
        if (step === "legal") {
          onSave({ ...input, type: individualType });
        } else {
          setLocalValue(prevState => ({ ...prevState, ...input, type: individualType }));
          onNext();
        }
      }}
    />
  );
};
