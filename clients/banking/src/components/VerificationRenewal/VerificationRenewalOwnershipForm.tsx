import { Option } from "@swan-io/boxed";
import { StepDots } from "@swan-io/lake/src/components/StepDots";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useState } from "react";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { AccountCountry, AddressInput } from "../../graphql/partner";
import { VerificationRenewalOwnershipFormAddress } from "./VerificationRenewalOwnershipFormAddress";
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
  // const commonRef = useRef<OnboardingCompanyOwnershipBeneficiaryFormCommonRef>(null);

  return (
    <>
      {match(step)
        .with("Common", () => (
          <VerificationRenewalOwnershipFormCommon
            accountCountry={accountCountry}
            companyCountry={companyCountry}
            initialValues={initialValues}
            onSave={values => {
              return match(
                Option.allFromDict({
                  common: commonValuesRef.current,
                  // address: addressValuesRef.current,
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
        .with("Address", () => (
          <VerificationRenewalOwnershipFormAddress
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
        .with("Identity", () => <p>TODO</p>)

        .exhaustive()}

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
    // <ResponsiveContainer breakpoint={breakpoints.tiny}>
    //   {({ small }) => (
    //     <>
    //       <View role="form">
    //         <Box direction={small ? "column" : "row"}>
    //           <Field name="firstName">
    //             {({ value, onChange, error }) => (
    //               <LakeLabel
    //                 label={t("verificationRenewal.ownership.firstName")}
    //                 style={styles.inputContainer}
    //                 render={id => (
    //                   <LakeTextInput
    //                     error={error}
    //                     placeholder={t("verificationRenewal.ownership.firstName.placeholder")}
    //                     id={id}
    //                     value={value}
    //                     onChangeText={onChange}
    //                   />
    //                 )}
    //               />
    //             )}
    //           </Field>

    //           <Space width={12} />

    //           <Field name="lastName">
    //             {({ value, onChange, error }) => (
    //               <LakeLabel
    //                 label={t("verificationRenewal.ownership.lastName")}
    //                 style={styles.inputContainer}
    //                 render={id => (
    //                   <LakeTextInput
    //                     error={error}
    //                     placeholder={t("verificationRenewal.ownership.lastName.placeholder")}
    //                     id={id}
    //                     value={value}
    //                     onChangeText={onChange}
    //                   />
    //                 )}
    //               />
    //             )}
    //           </Field>
    //         </Box>

    //         <Box direction={small ? "column" : "row"}>
    //           <Field name="birthDate">
    //             {({ value, onChange, error }) => (
    //               <BirthdatePicker
    //                 style={styles.inputContainer}
    //                 label={t("verificationRenewal.ownership.birthDate")}
    //                 value={value}
    //                 onValueChange={onChange}
    //                 error={error}
    //               />
    //             )}
    //           </Field>

    //           <Space width={12} />

    //           <Field name="birthCountryCode">
    //             {({ value, onChange, error }) => (
    //               <LakeLabel
    //                 label={t("verificationRenewal.ownership.birthCountry")}
    //                 style={styles.inputContainer}
    //                 render={id => (
    //                   <CountryPicker
    //                     id={id}
    //                     error={error}
    //                     value={value}
    //                     placeholder={t("verificationRenewal.ownership.birthCountry.placeholder")}
    //                     countries={allCountries}
    //                     onValueChange={onChange}
    //                   />
    //                 )}
    //               />
    //             )}
    //           </Field>
    //         </Box>

    //         <Box direction={small ? "column" : "row"}>
    //           <FieldsListener names={["birthCountryCode"]}>
    //             {({ birthCountryCode }) => (
    //               <>
    //                 <Field name="birthCity">
    //                   {({ value, onChange, error }) => (
    //                     <LakeLabel
    //                       label={t("verificationRenewal.ownership.birthCity")}
    //                       optionalLabel={isBirthInfoRequired ? undefined : t("common.optional")}
    //                       style={styles.inputContainer}
    //                       render={id => (
    //                         <PlacekitCityInput
    //                           id={id}
    //                           apiKey={__env.CLIENT_PLACEKIT_API_KEY}
    //                           error={error}
    //                           country={birthCountryCode.value}
    //                           value={value ?? ""}
    //                           onValueChange={onChange}
    //                           placeholder={
    //                             birthCountryCode.value == null
    //                               ? t("verificationRenewal.ownership.fillBirthCountry")
    //                               : t("verificationRenewal.ownership.birthCityPlaceholder")
    //                           }
    //                           onSuggestion={place => {
    //                             onChange(place.city);
    //                             if (place.postalCode != null) {
    //                               setFieldValue("birthCityPostalCode", place.postalCode);
    //                             }
    //                           }}
    //                           onLoadError={identity}
    //                         />
    //                       )}
    //                     />
    //                   )}
    //                 </Field>

    //                 <Space width={12} />

    //                 <Field name="birthCityPostalCode">
    //                   {({ value, onChange, error }) => (
    //                     <LakeLabel
    //                       label={t("verificationRenewal.ownership.birthPostalCode")}
    //                       optionalLabel={isBirthInfoRequired ? undefined : t("common.optional")}
    //                       style={styles.inputContainer}
    //                       render={id => (
    //                         <LakeTextInput
    //                           error={error}
    //                           placeholder={
    //                             birthCountryCode.value == null
    //                               ? t("verificationRenewal.ownership.fillBirthCountry")
    //                               : t("verificationRenewal.ownership.birthPostalCode.placeholder")
    //                           }
    //                           id={id}
    //                           disabled={birthCountryCode.value === undefined}
    //                           value={value}
    //                           onChangeText={onChange}
    //                         />
    //                       )}
    //                     />
    //                   )}
    //                 </Field>
    //               </>
    //             )}
    //           </FieldsListener>
    //         </Box>

    //         <Field name="type">
    //           {({ value, onChange }) => (
    //             <LakeLabel
    //               label={t("verificationRenewal.ownership.type")}
    //               type="radioGroup"
    //               render={() => (
    //                 <RadioGroup
    //                   direction="row"
    //                   value={value}
    //                   onValueChange={onChange}
    //                   items={beneficiaryTypes}
    //                 />
    //               )}
    //             />
    //           )}
    //         </Field>

    //         <FieldsListener names={["type"]}>
    //           {({ type }) =>
    //             type.value === "Ownership" ? (
    //               <>
    //                 <Field name="totalCapitalPercentage">
    //                   {({ value, onChange, error }) => (
    //                     <LakeLabel
    //                       label={t("verificationRenewal.ownership.totalCapitalPercentage")}
    //                       render={id => (
    //                         <LakeTextInput
    //                           error={error}
    //                           unit="%"
    //                           inputMode="decimal"
    //                           aria-valuemin={0}
    //                           aria-valuemax={100}
    //                           id={id}
    //                           value={value}
    //                           onChangeText={onChange}
    //                         />
    //                       )}
    //                     />
    //                   )}
    //                 </Field>

    //                 <Space height={12} />

    //                 <View>
    //                   <Box direction="row" alignItems="center">
    //                     <Field name="direct">
    //                       {({ value, error, onChange }) => (
    //                         <LakeLabelledCheckbox
    //                           value={value}
    //                           onValueChange={onChange}
    //                           label={t("verificationRenewal.ownership.directly")}
    //                           isError={error != null}
    //                         />
    //                       )}
    //                     </Field>

    //                     <Space width={24} />

    //                     <Field name="indirect">
    //                       {({ value, error, onChange }) => (
    //                         <LakeLabelledCheckbox
    //                           value={value}
    //                           onValueChange={onChange}
    //                           label={t("verificationRenewal.ownership.indirectly")}
    //                           isError={error != null}
    //                         />
    //                       )}
    //                     </Field>
    //                   </Box>

    //                   <Space height={4} />

    //                   <FieldsListener names={["direct", "indirect"]}>
    //                     {({ direct, indirect }) => (
    //                       <LakeText color={colors.negative[400]}>
    //                         {direct.error ?? indirect.error ?? " "}
    //                       </LakeText>
    //                     )}
    //                   </FieldsListener>
    //                 </View>
    //               </>
    //             ) : null
    //           }
    //         </FieldsListener>
    //       </View>

    //       <Space height={12} />

    //       <StepDots
    //         currentStep={step}
    //         steps={formSteps.filter(step =>
    //           match({ step, isAddressRequired, isIdentityRequired })
    //             .with({ step: "Common" }, () => true)
    //             .with({ step: "Address", isAddressRequired: true }, () => true)
    //             .with({ step: "Identity", isIdentityRequired: true }, () => true)
    //             .otherwise(() => false),
    //         )}
    //       />
    //     </>
    //   )}
    // </ResponsiveContainer>
  );
};
