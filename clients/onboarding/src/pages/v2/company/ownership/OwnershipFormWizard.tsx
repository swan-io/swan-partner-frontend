import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import {
  AccountCountry,
  RelatedCompanyInput,
  RelatedIndividualInput,
  RelatedIndividualType,
} from "../../../../graphql/partner";
import {
  OnboardingCompanyOwnershipFormCompanyRef,
  OwnershipFormCompany,
} from "./OwnershipFormCompany";
import {
  OnboardingCompanyOwnershipFormIndividualRef,
  OwnershipFormIndividual,
} from "./OwnershipFormIndividual";
import { OnboardingCompanyOwnershipFormTypeRef, OwnershipFormType } from "./OwnershipFormType";

export type OwnershipFormStep = "init" | "legal" | "ubo" | "legalAndUbo" | "company";
export type OwnershipSubForm = "detail" | "capital";

export type OnboardingCompanyOwnershipFormRef = {
  cancel: () => void;
  submit: () => void;
};

// The `REFERENCE_SYMBOL` is used to keep track of the instances of beneficiaries
// because we can't depend on the index
export const REFERENCE_SYMBOL = Symbol("REFERENCE");
export type WithReference<T> = T & { [REFERENCE_SYMBOL]: string };
export type SaveValueCompany = WithReference<RelatedCompanyInput>;
export type SaveValueIndividual = WithReference<RelatedIndividualInput>;
export type SaveValue = SaveValueCompany | SaveValueIndividual;

type Props = {
  ref: Ref<OnboardingCompanyOwnershipFormRef>;
  initialValues?: Partial<SaveValue>;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  step: OwnershipFormStep;
  type: "edit" | "add" | "delete" | "hidden";
  subForm?: OwnershipSubForm;
  onStepChange: (step: OwnershipFormStep, form?: OwnershipSubForm) => void;
  onSave: (editorState: SaveValue) => void | Promise<void>;
  onClose: () => void;
};

export const OwnershipFormWizard = ({
  ref,
  initialValues = {} as Partial<SaveValue>,
  step,
  type,
  subForm,
  onClose,
  onSave,
  onStepChange,
  companyCountry,
}: Props) => {
  const [reference] = useState(() => initialValues[REFERENCE_SYMBOL] ?? uuid());
  const typeRef = useRef<OnboardingCompanyOwnershipFormTypeRef>(null);
  const companyRef = useRef<OnboardingCompanyOwnershipFormCompanyRef>(null);
  const individualRef = useRef<OnboardingCompanyOwnershipFormIndividualRef>(null);
  const [individualType, setIndividualType] = useState<RelatedIndividualType | undefined>(() => {
    const initial = initialValues as Partial<RelatedIndividualInput> | undefined;
    return initial?.type;
  });

  useImperativeHandle(ref, () => {
    return {
      cancel: () => {
        match({ step, type, subForm })
          .with({ step: "init" }, () => onClose())
          .with({ step: P.union("ubo", "legalAndUbo"), subForm: "capital" }, ({ step }) =>
            onStepChange(step, "detail"),
          )
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
          .with(P.union("legal", "legalAndUbo", "ubo"), () => individualRef.current?.submit())
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
                setIndividualType(values.type);
                match(values.type)
                  .with("LegalRepresentative", () => onStepChange("legal"))
                  .with("UltimateBeneficialOwner", () => onStepChange("ubo", "detail"))
                  .with("LegalRepresentativeAndUltimateBeneficialOwner", () =>
                    onStepChange("legalAndUbo", "detail"),
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
        .with(P.union("legal", "legalAndUbo", "ubo"), step => {
          const resolvedType =
            individualType ??
            match(step)
              .with("legal", () => "LegalRepresentative" as const)
              .with("ubo", () => "UltimateBeneficialOwner" as const)
              .with("legalAndUbo", () => "LegalRepresentativeAndUltimateBeneficialOwner" as const)
              .exhaustive();

          return (
            <OwnershipFormIndividual
              ref={individualRef}
              initialValues={initialValues as Partial<RelatedIndividualInput>}
              companyCountry={companyCountry}
              step={step}
              individualType={resolvedType}
              subForm={subForm}
              onNext={() => onStepChange(step, "capital")}
              onSave={values => {
                onSave({
                  [REFERENCE_SYMBOL]: reference,
                  ...values,
                });
              }}
            />
          );
        })
        .exhaustive()}
    </div>
  );
};
