import { Option } from "@bloodyowl/boxed";
import { Space } from "@swan-io/lake/src/components/Space";
import { StepDots } from "@swan-io/lake/src/components/StepDots";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { AccountCountry } from "../../graphql/partner";
import {
  Input as AddressInput,
  VerificationRenewalOwnershipFormAddress,
  VerificationRenewalOwnershipFormAddressRef,
} from "./VerificationRenewalOwnershipFormAddress";
import {
  Input as CommonInput,
  VerificationRenewalOwnershipFormCommon,
} from "./VerificationRenewalOwnershipFormCommon";

export const REFERENCE_SYMBOL = Symbol("REFERENCE");
type WithReference<T> = T & { [REFERENCE_SYMBOL]: string };
export type VerificationRenewalOwnershipFormCommonRef = {
  cancel: () => void;
  submit: () => void;
};
export type Input = WithReference<CommonInput & AddressInput>;

type RenewalVerificationBeneficiaryFormStep = "Common" | "Address";

export type SaveValue = WithReference<CommonInput & Partial<AddressInput>>;

type BeneficiaryFormStep = "Common" | "Address";

const formSteps: BeneficiaryFormStep[] = ["Common", "Address"];

type Props = {
  ref?: Ref<VerificationRenewalOwnershipFormCommonRef>;
  initialValues?: Partial<Input>;
  companyCountry: CountryCCA3;
  accountCountry: AccountCountry;
  step: RenewalVerificationBeneficiaryFormStep;
  placekitApiKey: string;
  onStepChange: (step: RenewalVerificationBeneficiaryFormStep) => void;
  onSave: (editorState: SaveValue) => void | Promise<void>;
  onClose: () => void;
};

export const VerificationRenewalOwnershipForm = ({
  ref,
  initialValues = {},
  companyCountry,
  accountCountry,
  step,
  placekitApiKey,
  onStepChange,
  onClose,
  onSave,
}: Props) => {
  const [reference] = useState(() => initialValues[REFERENCE_SYMBOL] ?? uuid());
  const commonRef = useRef<VerificationRenewalOwnershipFormCommonRef>(null);
  const addressRef = useRef<VerificationRenewalOwnershipFormAddressRef>(null);

  useImperativeHandle(ref, () => {
    return {
      cancel: () => {
        match(step)
          .with("Common", () => onClose())
          .with("Address", () => {
            addressValuesRef.current = Option.fromNullable(addressRef.current?.getInput());
            onStepChange("Common");
          })
          .exhaustive();
      },
      submit: () => {
        match(step)
          .with("Common", () => commonRef.current?.submit())
          .with("Address", () => addressRef.current?.submit())
          .exhaustive();
      },
    };
  });

  const commonValuesRef = useRef<Option<CommonInput>>(Option.None());
  const addressValuesRef = useRef<Option<AddressInput>>(Option.None());

  return (
    <>
      {match(step)
        .with("Common", () => (
          <VerificationRenewalOwnershipFormCommon
            ref={commonRef}
            placekitApiKey={placekitApiKey}
            accountCountry={accountCountry}
            companyCountry={companyCountry}
            initialValues={
              commonValuesRef.current.isSome() ? commonValuesRef.current.get() : initialValues
            }
            onSave={values => {
              // the residency address country is required for every account country
              commonValuesRef.current = Option.Some(values);
              onStepChange("Address");
            }}
          />
        ))
        .with("Address", () => (
          <VerificationRenewalOwnershipFormAddress
            ref={addressRef}
            placekitApiKey={placekitApiKey}
            accountCountry={accountCountry}
            companyCountry={companyCountry}
            initialValues={
              addressValuesRef.current.isSome() ? addressValuesRef.current.get() : initialValues
            }
            onSave={values =>
              match(commonValuesRef.current)
                .with(Option.P.Some(P.select()), commonValues => {
                  const input = {
                    [REFERENCE_SYMBOL]: reference,
                    ...commonValues,
                    ...values,
                  } satisfies Input;
                  return onSave(input);
                })
                .otherwise(() => {})
            }
          />
        ))
        .exhaustive()}

      <Space height={12} />
      <StepDots currentStep={step} steps={formSteps} />
    </>
  );
};
