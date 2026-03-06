import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { RelatedIndividualInput } from "../../../../graphql/partner";
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
  initialValues: RelatedIndividualInput;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualRef>;
  companyCountry: CountryCCA3;
  step: Extract<OwnershipFormStep, "legal" | "legalAndUbo" | "ubo">;
  subForm?: OwnershipSubForm;
  onSave: (input: RelatedIndividualInput) => void | Promise<void>;
};

export const OwnershipFormIndividual = ({
  ref,
  onSave,
  step,
  companyCountry,
  initialValues,
  subForm,
}: Props) => {
  const detailRef = useRef<OnboardingCompanyOwnershipFormIndividualDetailsRef>(null);
  const capitalRef = useRef<OnboardingCompanyOwnershipFormIndividualCapitalRef>(null);

  const [localValue, setLocalValue] = useState<RelatedIndividualInput>(initialValues);

  console.log("");
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
        console.log("save capital", input);
        onSave({ ...localValue, ...input });
      }}
    />
  ) : (
    <OwnershipFormIndividualDetails
      ref={detailRef}
      initialValues={localValue}
      companyCountry={companyCountry}
      onSave={input =>
        match(step)
          .with("legal", () => onSave(input))
          .with(P.union("ubo", "legalAndUbo"), () => {
            setLocalValue(input);
            onSave({} as RelatedIndividualInput); // will trigger the next step to show OwnershipFormIndividualCapital
          })
          .exhaustive()
      }
    />
  );
};
