import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import {
  CompanyOnboardingFragment,
  RelatedCompanyInput,
  RelatedIndividualInput,
  RelatedIndividualType,
} from "../../../../graphql/partner";
import { ServerInvalidFieldCode } from "../../../../utils/validation";
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
export type OwnershipSubForm = "detail" | "address" | "capital" | "identity";

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
  onboarding: NonNullable<CompanyOnboardingFragment>;
  initialValues?: Partial<SaveValue>;
  errors: { fieldName: string; code: ServerInvalidFieldCode }[];
  step: OwnershipFormStep;
  type: "add" | "edit";
  subForm?: OwnershipSubForm;
  onStepChange: (step: OwnershipFormStep, form?: OwnershipSubForm) => void;
  onSave: (editorState: SaveValue) => void | Promise<void>;
  onClose: () => void;
};

export const OwnershipFormWizard = ({
  ref,
  initialValues = {} as Partial<SaveValue>,
  onboarding,
  errors,
  step,
  type,
  subForm,
  onClose,
  onSave,
  onStepChange,
}: Props) => {
  const [reference] = useState(() => initialValues[REFERENCE_SYMBOL] ?? uuid());
  const typeRef = useRef<OnboardingCompanyOwnershipFormTypeRef>(null);
  const companyRef = useRef<OnboardingCompanyOwnershipFormCompanyRef>(null);
  const individualRef = useRef<OnboardingCompanyOwnershipFormIndividualRef>(null);
  const [individualType, setIndividualType] = useState<RelatedIndividualType | undefined>(() => {
    const initial = initialValues as Partial<RelatedIndividualInput> | undefined;
    return initial?.type;
  });

  const { company } = onboarding;
  const companyCountry = (company?.address?.country ?? "FRA") as CountryCCA3;

  useImperativeHandle(ref, () => {
    return {
      cancel: () => {
        match({ step, type, subForm })
          .with({ step: "init" }, () => onClose())
          .with({ step: "company", type: "edit" }, () => onClose())
          .with({ subForm: "detail", type: "edit" }, () => onClose())
          .with({ step: P.union("ubo", "legalAndUbo"), subForm: "identity" }, ({ step }) =>
            onStepChange(step, "capital"),
          )
          .with({ step: P.union("ubo", "legalAndUbo"), subForm: "capital" }, ({ step }) =>
            onStepChange(step, "address"),
          )
          .with({ subForm: "address" }, ({ step }) => onStepChange(step, "detail"))
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
            initialValues={initialValues}
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
            errors={errors}
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
              errors={errors}
              onboarding={onboarding}
              companyCountry={companyCountry}
              step={step}
              individualType={resolvedType}
              subForm={subForm}
              mode={type}
              onNext={form => onStepChange(step, form)}
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
