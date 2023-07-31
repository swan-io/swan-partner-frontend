import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { useEffect, useState } from "react";
import { combineValidators, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { GetIbanValidationDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { printIbanFormat, validateIban } from "../utils/iban";
import { validateRequired } from "../utils/validations";

export type Beneficiary = {
  name: string;
  iban: string;
};

type Props = {
  initialBeneficiary?: Beneficiary;
};

export const TransferWizardBeneficiary = ({ initialBeneficiary }: Props) => {
  const [iban, setIban] = useState<string | undefined>(undefined);
  const { data } = useUrqlQuery(
    {
      query: GetIbanValidationDocument,
      pause: iban == undefined,
      variables: {
        // `pause` gives us the guarantee we get a valid iban
        iban: iban as string,
      },
    },
    [iban],
  );

  const { Field, listenFields } = useForm({
    name: {
      initialValue: initialBeneficiary?.name ?? "",
      validate: validateRequired,
    },
    iban: {
      initialValue: initialBeneficiary?.iban ?? "",
      validate: combineValidators(validateRequired, validateIban),
    },
  });

  useEffect(() => {
    return listenFields(["iban"], ({ iban }) => {
      if (iban.valid) {
        setIban(iban.value);
      } else {
        setIban(undefined);
      }
    });
  }, [listenFields]);

  console.log(data);

  return (
    <>
      <Tile
        footer={match(data)
          .with(
            AsyncData.P.Done(Result.P.Ok({ ibanValidation: { __typename: "ValidIban" } })),
            () => {
              return (
                <LakeAlert
                  anchored={true}
                  variant="info"
                  title={t("transfer.new.bankInformation")}
                />
              );
            },
          )
          .otherwise(() => null)}
      >
        <LakeLabel
          label={t("transfer.new.beneficiary.name")}
          render={id => (
            <Field name="name">
              {({ value, onChange, onBlur, error, valid }) => (
                <LakeTextInput
                  id={id}
                  value={value}
                  error={error}
                  valid={valid}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            </Field>
          )}
        />

        <LakeLabel
          label={t("transfer.new.iban.label")}
          render={id => (
            <Field name="iban">
              {({ value, onChange, onBlur, error, validating, valid }) => (
                <LakeTextInput
                  id={id}
                  placeholder={t("transfer.new.iban.placeholder")}
                  value={printIbanFormat(value)}
                  validating={validating}
                  error={error}
                  valid={valid}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            </Field>
          )}
        />
      </Tile>

      <Space height={32} />

      <Box direction="row">
        <LakeButton color="current">{t("common.continue")}</LakeButton>
      </Box>
    </>
  );
};
