import { Option } from "@swan-io/boxed";
import { Space } from "@swan-io/lake/src/components/Space";
import { StepDots } from "@swan-io/lake/src/components/StepDots";
import { CountryCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import {
  validateBooleanRequired,
  validateIndividualTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, Validator } from "@swan-io/use-form";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { AccountCountry } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { validateRequired } from "../../utils/validations";
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

export type RenewalVerificationBeneficiaryFormStep = "Common" | "Address";

export type SaveValue = WithReference<CommonInput & Partial<AddressInput>>;

export type BeneficiaryFormStep = "Common" | "Address";

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
  const isAddressRequired = match(accountCountry)
    .with("DEU", "ESP", "FRA", "NLD", "ITA", "BEL", () => true) //TODO remove french
    .otherwise(() => false);

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
            placekitApiKey={placekitApiKey}
            accountCountry={accountCountry}
            companyCountry={companyCountry}
            initialValues={
              commonValuesRef.current.isSome() ? commonValuesRef.current.get() : initialValues
            }
            onSave={values => {
              if (isAddressRequired) {
                commonValuesRef.current = Option.Some(values);
                onStepChange("Address");
              } else {
                return onSave({
                  [REFERENCE_SYMBOL]: reference,
                  ...values,
                });
              }
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

      {isAddressRequired && (
        <>
          <Space height={12} />

          <StepDots
            currentStep={step}
            steps={formSteps.filter(step =>
              match({ step, isAddressRequired })
                .with({ step: "Common" }, () => true)
                .with({ step: "Address", isAddressRequired: true }, () => true)
                .otherwise(() => false),
            )}
          />
        </>
      )}
    </>
  );
};

const validateCca3CountryCode: Validator<string | undefined> = value => {
  if (value == null) {
    return t("common.form.required");
  }
  if (!isCountryCCA3(value)) {
    // no need to set an error message because country picker contains only valid values
    // this is used only for validateUbo function to display an error indicator without opening UBO modal
    return " ";
  }
};

export const validateUbo = (
  editorState: Partial<Input>,
  accountCountry: AccountCountry,
): Partial<Record<keyof Input, string | void>> => {
  const isAddressRequired = match(accountCountry)
    .with("DEU", "ESP", () => true)
    .otherwise(() => false);
  const isAddressCountryRequired = match(accountCountry)
    .with("DEU", "ESP", "FRA", "NLD", () => true)
    .otherwise(() => false);
  const isBirthInfoRequired = match(accountCountry)
    .with("ESP", "FRA", "NLD", () => true)
    .otherwise(() => false);
  const isTaxIdentificationNumberRequired =
    accountCountry === "DEU" && editorState.country === "DEU";

  const validateTaxNumber = isTaxIdentificationNumberRequired
    ? combineValidators(validateRequired, validateIndividualTaxNumber(accountCountry))
    : validateIndividualTaxNumber(accountCountry);

  return {
    firstName: validateRequired(editorState.firstName ?? ""),
    lastName: validateRequired(editorState.lastName ?? ""),
    birthDate: isBirthInfoRequired ? validateRequired(editorState.birthDate ?? "") : undefined,
    birthCountryCode: validateCca3CountryCode(editorState.birthCountryCode),
    birthCity: isBirthInfoRequired ? validateRequired(editorState.birthCity ?? "") : undefined,
    birthCityPostalCode: isBirthInfoRequired
      ? validateRequired(editorState.birthCityPostalCode ?? "")
      : undefined,
    totalPercentage:
      editorState.qualificationType === "Ownership"
        ? validateRequired(editorState.totalPercentage?.toString() ?? "")
        : undefined,
    addressLine1: isAddressRequired ? validateRequired(editorState.addressLine1 ?? "") : undefined,
    city: isAddressRequired ? validateRequired(editorState.city ?? "") : undefined,
    country:
      isAddressRequired || isAddressCountryRequired
        ? validateRequired(editorState.country ?? "")
        : undefined,
    postalCode: isAddressRequired ? validateRequired(editorState.postalCode ?? "") : undefined,
    taxIdentificationNumber: validateTaxNumber(editorState.taxIdentificationNumber ?? ""),
    indirect:
      editorState.qualificationType !== "Ownership" || editorState.direct === true
        ? undefined
        : validateBooleanRequired(editorState.indirect),
    direct:
      editorState.qualificationType !== "Ownership" || editorState.indirect === true
        ? undefined
        : validateBooleanRequired(editorState.direct),
  };
};
