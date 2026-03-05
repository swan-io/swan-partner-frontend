import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef } from "react";
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

  console.log("");
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        console.log("#submit from formIndividual");
        subForm === "capital" ? capitalRef.current?.submit() : detailRef.current?.submit();
        // onSave({} as RelatedIndividualInput);
      },
    };
  });

  return subForm === "capital" ? (
    <OwnershipFormIndividualCapital
      ref={capitalRef}
      initialValues={initialValues}
      onSave={input => {
        console.log("save capital", input);
      }}
    />
  ) : (
    <OwnershipFormIndividualDetails
      ref={detailRef}
      initialValues={initialValues}
      companyCountry={companyCountry}
      onSave={input =>
        match(step)
          .with("legal", () => onSave(input))
          .with(P.union("ubo", "legalAndUbo"), () => console.log("TODO on save detail for ubo"))
          .exhaustive()
      }
    />
  );
};
