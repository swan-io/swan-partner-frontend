import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { AccountCountry, RelatedCompanyInput, RelatedIndividualInput } from "../../../../graphql/partner";
import {
  OnboardingCompanyOwnershipFormCompanyRef,
  OwnershipFormCompany,
} from "./OwnershipFormCompany";
import { OnboardingCompanyOwnershipFormTypeRef, OwnershipFormType } from "./OwnershipFormType";

export type OwnershipFormStep = "init" | "legal" | "ubo" | "legalAndUbo" | "company";

export type OnboardingCompanyOwnershipFormRef = {
  cancel: () => void;
  submit: () => void;
};

// The `REFERENCE_SYMBOL` is used to keep track of the instances of beneficiaries
// because we can't depend on the index
export const REFERENCE_SYMBOL = Symbol("REFERENCE");
type WithReference<T> = T & { [REFERENCE_SYMBOL]: string };
export type SaveValueCompany = WithReference<Partial<RelatedCompanyInput>>;
export type SaveValueIndividual = WithReference<Partial<RelatedIndividualInput>>;
export type SaveValue = SaveValueCompany | SaveValueIndividual;

type Props = {
  ref: Ref<OnboardingCompanyOwnershipFormRef>;
  initialValues?: SaveValue;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  step: OwnershipFormStep;
  type: 'edit' | 'add' | 'delete' | 'hidden'
  onStepChange: (step: OwnershipFormStep) => void;
  onSave: (editorState: SaveValue) => void | Promise<void>;
  onClose: () => void;
};

export const OwnershipFormWizard = ({
  ref,
  initialValues = {},
  step,
  type,
  onClose,
  onSave,
  onStepChange,
  companyCountry,
}: Props) => {
  const [reference] = useState(() => initialValues[REFERENCE_SYMBOL] ?? uuid());
  const typeRef = useRef<OnboardingCompanyOwnershipFormTypeRef>(null);
  const companyRef = useRef<OnboardingCompanyOwnershipFormCompanyRef>(null);

  useImperativeHandle(ref, () => {
    return {
      cancel: () => {
        match({step, type})
          .with({step: "init"}, () => onClose())
          .with({ step: P.union("company", "legal", "ubo", "legalAndUbo"), type: "edit" }, () =>
            onClose(),
          )
          .otherwise(() => {
            onStepChange("init");
          });
      },
      submit: () => {
        match(step)
          .with("init", () => typeRef.current?.submit())
          .with("company", () => companyRef.current?.submit())
          .otherwise(() => null);
      },
    };
  });

  return (
    <div>
      {match(step)
        .with("init", () => (
          <OwnershipFormType
            ref={typeRef}
            onSave={values => {
              if (values.related === "company") {
                onStepChange("company");
              } else {
                match(values.type)
                  .with("LegalRepresentative", () => onStepChange("legal"))
                  .with("UltimateBeneficialOwner", () => onStepChange("ubo"))
                  .with("LegalRepresentativeAndUltimateBeneficialOwner", () =>
                    onStepChange("legalAndUbo"),
                  )
                  .exhaustive();
              }
            }}
          />
        ))
        .with("company", () => (
          <OwnershipFormCompany
            ref={companyRef}
            initialValues={initialValues as Partial<RelatedCompanyInput>}
            companyCountry={companyCountry}
            onSave={values => {
              onSave({
                [REFERENCE_SYMBOL]: reference,
                ...values,
              });
            }}
          />
        ))
        .otherwise(() => (
          <h1>@TODO {step}</h1>
        ))}
    </div>
  );
};
