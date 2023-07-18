import { Tile } from "@swan-io/lake/src/components/Tile";
import { combineValidators, useForm } from "react-ux-form";
import { validateIban } from "../utils/iban";
import { validateRequired } from "../utils/validations";

export type Beneficiary = {
  name: string;
  iban: string;
};

type Props = {
  initialBeneficiary?: Beneficiary;
};

export const TransferWizardBeneficiary = ({ initialBeneficiary }: Props) => {
  const { Field } = useForm({
    name: {
      initialValue: initialBeneficiary?.name ?? "",
      validate: validateRequired,
    },
    iban: {
      initialValue: initialBeneficiary?.iban ?? "",
      validate: combineValidators(validateRequired, validateIban),
    },
  });

  return <Tile></Tile>;
};
