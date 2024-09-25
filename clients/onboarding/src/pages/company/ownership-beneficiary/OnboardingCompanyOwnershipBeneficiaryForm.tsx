import { Option } from "@swan-io/boxed";
import { Space } from "@swan-io/lake/src/components/Space";
import { StepDots } from "@swan-io/lake/src/components/StepDots";
import { CountryCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import {
  validateBooleanRequired,
  validateIndividualTaxNumber,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { Validator, combineValidators } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { P, match } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { AccountCountry } from "../../../graphql/unauthenticated";
import { t } from "../../../utils/i18n";
import {
  Input as AddressInput,
  OnboardingCompanyOwnershipBeneficiaryFormAddress,
  OnboardingCompanyOwnershipBeneficiaryFormAddressRef,
} from "./OnboardingCompanyOwnershipBeneficiaryFormAddress";
import {
  Input as CommonInput,
  OnboardingCompanyOwnershipBeneficiaryFormCommon,
  OnboardingCompanyOwnershipBeneficiaryFormCommonRef,
} from "./OnboardingCompanyOwnershipBeneficiaryFormCommon";
import {
  Input as IdentityInput,
  OnboardingCompanyOwnershipBeneficiaryFormIdentity,
  OnboardingCompanyOwnershipBeneficiaryFormIdentityRef,
} from "./OnboardingCompanyOwnershipBeneficiaryFormIdentity";

export type OnboardingCompanyOwnershipBeneficiaryFormRef = {
  cancel: () => void;
  submit: () => void;
};

// The `REFERENCE_SYMBOL` is used to keep track of the instances of beneficiaries
// because we can't depend on the index
export const REFERENCE_SYMBOL = Symbol("REFERENCE");

type WithReference<T> = T & { [REFERENCE_SYMBOL]: string };

export type Input = WithReference<CommonInput & AddressInput & IdentityInput>;

export type BeneficiaryFormStep = "Common" | "Address" | "Identity";

export type SaveValue = WithReference<CommonInput & Partial<AddressInput> & Partial<IdentityInput>>;

type Props = {
  initialValues?: Partial<Input>;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  step: BeneficiaryFormStep;
  placekitApiKey: string;
  onStepChange: (step: BeneficiaryFormStep) => void;
  onSave: (editorState: SaveValue) => void | Promise<void>;
  onClose: () => void;
};

const formSteps: BeneficiaryFormStep[] = ["Common", "Address", "Identity"];

export const OnboardingCompanyOwnershipBeneficiaryForm = forwardRef<
  OnboardingCompanyOwnershipBeneficiaryFormRef,
  Props
>(
  (
    {
      initialValues = {},
      accountCountry,
      companyCountry,
      step,
      placekitApiKey,
      onStepChange,
      onClose,
      onSave,
    }: Props,
    ref,
  ) => {
    const isAddressRequired = match(accountCountry)
      .with("DEU", "ESP", "FRA", "NLD", "ITA", () => true)
      .otherwise(() => false);

    const isIdentityRequired = match(accountCountry)
      .with("ITA", () => true)
      .otherwise(() => false);

    const [reference] = useState(() => initialValues[REFERENCE_SYMBOL] ?? uuid());
    const commonRef = useRef<OnboardingCompanyOwnershipBeneficiaryFormCommonRef | null>(null);
    const addressRef = useRef<OnboardingCompanyOwnershipBeneficiaryFormAddressRef | null>(null);
    const identityRef = useRef<OnboardingCompanyOwnershipBeneficiaryFormIdentityRef | null>(null);

    useImperativeHandle(ref, () => {
      return {
        cancel: () => {
          match(step)
            .with("Common", () => onClose())
            .with("Address", () => {
              addressValuesRef.current = Option.fromNullable(addressRef.current?.getInput());
              onStepChange("Common");
            })
            .with("Identity", () => {
              identityValuesRef.current = Option.fromNullable(identityRef.current?.getInput());
              onStepChange("Address");
            })
            .exhaustive();
        },
        submit: () => {
          match(step)
            .with("Common", () => commonRef.current?.submit())
            .with("Address", () => addressRef.current?.submit())
            .with("Identity", () => identityRef.current?.submit())
            .exhaustive();
        },
      };
    });

    const commonValuesRef = useRef<Option<CommonInput>>(Option.None());
    const addressValuesRef = useRef<Option<AddressInput>>(Option.None());
    const identityValuesRef = useRef<Option<IdentityInput>>(Option.None());

    return (
      <>
        {match(step)
          .with("Common", () => (
            <OnboardingCompanyOwnershipBeneficiaryFormCommon
              ref={commonRef}
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
            <OnboardingCompanyOwnershipBeneficiaryFormAddress
              ref={addressRef}
              placekitApiKey={placekitApiKey}
              accountCountry={accountCountry}
              companyCountry={companyCountry}
              initialValues={
                addressValuesRef.current.isSome() ? addressValuesRef.current.get() : initialValues
              }
              onSave={values => {
                if (isIdentityRequired) {
                  addressValuesRef.current = Option.Some(values);
                  onStepChange("Identity");
                } else {
                  return match(commonValuesRef.current)
                    .with(Option.P.Some(P.select()), commonValues => {
                      const input = {
                        [REFERENCE_SYMBOL]: reference,
                        ...commonValues,
                        ...values,
                      } satisfies Input;
                      return onSave(input);
                    })
                    .otherwise(() => {});
                }
              }}
            />
          ))
          .with("Identity", () => (
            <OnboardingCompanyOwnershipBeneficiaryFormIdentity
              ref={identityRef}
              initialValues={
                identityValuesRef.current.isSome() ? identityValuesRef.current.get() : initialValues
              }
              onSave={values => {
                return match(
                  Option.allFromDict({
                    common: commonValuesRef.current,
                    address: addressValuesRef.current,
                  }),
                )
                  .with(Option.P.Some(P.select()), previousScreenValues => {
                    const input = {
                      [REFERENCE_SYMBOL]: reference,
                      ...previousScreenValues.common,
                      ...previousScreenValues.address,
                      ...values,
                    } satisfies Input;
                    return onSave(input);
                  })
                  .otherwise(() => {});
              }}
            />
          ))
          .exhaustive()}

        {(isAddressRequired || isIdentityRequired) && (
          <>
            <Space height={12} />

            <StepDots
              currentStep={step}
              steps={formSteps.filter(step =>
                match({ step, isAddressRequired, isIdentityRequired })
                  .with({ step: "Common" }, () => true)
                  .with({ step: "Address", isAddressRequired: true }, () => true)
                  .with({ step: "Identity", isIdentityRequired: true }, () => true)
                  .otherwise(() => false),
              )}
            />
          </>
        )}
      </>
    );
  },
);

const validateCca3CountryCode: Validator<string | undefined> = value => {
  if (value == null) {
    return t("error.requiredField");
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
    accountCountry === "DEU" && editorState.residencyAddressCountry === "DEU";

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
    type: validateRequired(editorState.type ?? ""),
    totalCapitalPercentage:
      editorState.type === "HasCapital"
        ? validateRequired(editorState.totalCapitalPercentage?.toString() ?? "")
        : undefined,
    residencyAddressLine1: isAddressRequired
      ? validateRequired(editorState.residencyAddressLine1 ?? "")
      : undefined,
    residencyAddressCity: isAddressRequired
      ? validateRequired(editorState.residencyAddressCity ?? "")
      : undefined,
    residencyAddressCountry:
      isAddressRequired || isAddressCountryRequired
        ? validateRequired(editorState.residencyAddressCountry ?? "")
        : undefined,
    residencyAddressPostalCode: isAddressRequired
      ? validateRequired(editorState.residencyAddressPostalCode ?? "")
      : undefined,
    taxIdentificationNumber: validateTaxNumber(editorState.taxIdentificationNumber ?? ""),
    indirect:
      editorState.type !== "HasCapital" || editorState.direct === true
        ? undefined
        : validateBooleanRequired(editorState.indirect),
    direct:
      editorState.type !== "HasCapital" || editorState.indirect === true
        ? undefined
        : validateBooleanRequired(editorState.direct),
  };
};
