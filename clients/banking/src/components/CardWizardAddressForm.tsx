import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";

import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { View } from "react-native";
import {  t } from "../utils/i18n";
import {
  validateAddressLine,
  validateCity,
  validatePostalCode,
  validateRequired,
  validateState,
} from "../utils/validations";

import { Space } from "@swan-io/lake/src/components/Space";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import axios from "axios";

export type Address = {
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: CountryCCA3;
  selectedAddress?: string;
};

type Props = {
  initialAddress: Omit<Address, "country"> & { country?: CountryCCA3 };
  showButtons?: boolean;
  onSubmit: (address: Address) => void;
  onPressClose?: () => void;
};

export type CardWizardAddressFormRef = { submit: () => void };

type AddressResponse = {
  result: {
    street1: string;
    street2: string;
    city: string;
    postal: string;
  };
};

export const CardWizardAddressForm = forwardRef<CardWizardAddressFormRef, Props>(
  ({ initialAddress, onPressClose, onSubmit, showButtons = true }: Props, ref) => {
    const { Field, FieldsListener, setFieldValue, submitForm, getFieldValue } = useForm({
      addressLine1: {
        initialValue: initialAddress.addressLine1,
        validate: combineValidators(validateRequired, validateAddressLine),
      },
      addressLine2: {
        initialValue: initialAddress.addressLine2 ?? "",
        validate: validateAddressLine,
      },
      postalCode: {
        initialValue: initialAddress.postalCode,
        validate: combineValidators(validateRequired, validatePostalCode),
      },
      city: {
        initialValue: initialAddress.city,
        validate: combineValidators(validateRequired, validateCity),
      },
      state: {
        initialValue: initialAddress.state ?? "",
        validate: combineValidators(validateState, validateState),
      },
      country: {
        initialValue: initialAddress.country ?? "",
        validate: validateRequired,
      },
      selectedAddress: {
        initialValue: "",
      },
    });

    const submit = useCallback(() => {
      submitForm({
        onSuccess: values => {

          if (!values.selectedAddress.isSome() && getFieldValue("country") === "FRA") {
            return
          }

          onSubmit({
            addressLine1: values.addressLine1.isSome() ? values.addressLine1.get() : "",
            addressLine2: values.addressLine2.isSome() ? values.addressLine2.get() : "",
            postalCode: values.postalCode.isSome() ? values.postalCode.get() : "",
            city: values.city.isSome() ? values.city.get() : "",
            state: values.state.isSome() ? values.state.get() : "",
            country: values.country.isSome()
              ? (values.country.get() as CountryCCA3)
              : ("" as CountryCCA3),
          });
        },
      });
    }, [onSubmit, submitForm, getFieldValue]);

    const [suggestedAddresses, setSuggestedAddresses] = useState<{
      adresse: string;
      code: string;
    }[]
  >([]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const addressControlApiUrl = 'https://services.assoconnect.com/services/laposte/address-control'

  const searchAddress = () => {
    const addressLine1 = getFieldValue("addressLine1");
    const postalCode = getFieldValue("postalCode");
    const city = getFieldValue("city");

    const formatedAddress = `${addressLine1} ${postalCode} ${city}`;

    axios
      .get<AddressResponse>(
        addressControlApiUrl,
        {
          params: { q: formatedAddress },
        },
      )
      .then(response => {
        if (Array.isArray(response.data.result)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const filteredAddresses: { adresse: string; code: string; }[] = response.data.result;
          setSuggestedAddresses(filteredAddresses);
          if(filteredAddresses.length > 0 && filteredAddresses[0]?.code !== undefined) {
            handleSelectAddress(filteredAddresses[0]?.code);          }
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  };

  const handleSelectAddress = (address: string) => {
    axios
      .get<AddressResponse>(
        `${addressControlApiUrl}/${address}`,
      )
      .then(response => {
        setFieldValue("addressLine1", response.data.result.street1);
        setFieldValue("city", response.data.result.city);
        setFieldValue("postalCode", response.data.result.postal);
        setFieldValue("selectedAddress", address);
      })
      .catch(error => {
        console.error("Error:", error);
      });
  };

    useImperativeHandle(
      ref,
      () => ({
        submit,
      }),
      [submit],
    );

    return (
      <View>
        <LakeLabel
          label={t("cardWizard.address.country")}
          render={id => (
            <Field name="country">
              {({ value, onChange, error, ref }) => (
                <CountryPicker
                  id={id}
                  ref={ref}
                  error={error}
                  value={value === "" ? undefined : (value as CountryCCA3)}
                  placeholder={t("cardWizard.address.countryPlaceholder")}
                  countries={allCountries}
                  onValueChange={onChange}
                />
              )}
            </Field>
          )}
        />

        <FieldsListener names={["country"]}>
          {() => {
            return (
              <>
                <Field name="addressLine1">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.line1")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          error={error}
                          placeholder={t("addressInput.placeholder")}
                          value={value}
                          onChangeText={value => {
                            onChange(value);
                            setFieldValue("selectedAddress", "");
                          }}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="addressLine2">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.line2")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          error={error}
                          placeholder={t("cardWizard.address.line2Placeholder")}
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="postalCode">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.postalCode")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          error={error}
                          placeholder={t("cardWizard.address.postalCodePlaceholder")}
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="state">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.state")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          error={error}
                          placeholder={t("cardWizard.address.statePlaceholder")}
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="city">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.city")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          error={error}
                          placeholder={t("cardWizard.address.cityPlaceholder")}
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>


                <LakeModal
                  onPressClose={() => {
                    setIsModalVisible(false);
                    setFieldValue("selectedAddress", "");
                  }}
                  color="negative"
                  visible={isModalVisible}
                >
                  <>
                    <Field name="selectedAddress">
                      {({ value, ref }) => (
                        <LakeLabel
                          label={t("card.address.form.select")}
                          render={id => (
                            <LakeSelect
                              id={id}
                              ref={ref}
                              items={suggestedAddresses.map(value => ({
                                value: value.code,
                                name: value.adresse,
                              }))}
                              value={value}
                              placeholder="Select an address"
                              onValueChange={handleSelectAddress}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Space height={32} />

                    <FieldsListener names={["selectedAddress"]}>
                      {() => (
                        <LakeButton
                          onPress={submit}
                          disabled={getFieldValue("selectedAddress").length === 0}
                          color="current"
                          grow={true}
                        >
                          {t("common.confirm")}
                        </LakeButton>
                      )}
                    </FieldsListener>
                  </>
                </LakeModal>
              </>
            );
          }}
        </FieldsListener>

        <FieldsListener names={["country"]}>
          {() =>
            showButtons && getFieldValue("country") === "FRA" ? (
              <LakeButton
                mode="primary"
                color="current"
                onPress={() => {
                  setIsModalVisible(true);
                  searchAddress();
                }}
                grow={true}
              >
                {t("common.search.address")}
              </LakeButton>
            ) : null
          }
        </FieldsListener>

        <FieldsListener names={["country"]}>
          {() =>
            showButtons && getFieldValue("country") !== "FRA" ? (
              <LakeButtonGroup>
                <LakeButton mode="secondary" onPress={onPressClose} grow={true}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton onPress={submit} color="current">
                  {t("common.confirm")}
                </LakeButton>
              </LakeButtonGroup>
            ) : null
          }
        </FieldsListener>
      </View>
    );
  },
);

