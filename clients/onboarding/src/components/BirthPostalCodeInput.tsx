import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Ref } from "react";
import { TextInput } from "react-native";
import { t } from "../utils/i18n";

type Props = {
  ref: Ref<TextInput>;
  value: string;
  valid: boolean;
  error: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export const BirthPostalCodeInput = ({ ref, value, valid, error, onChange, readOnly }: Props) => (
  <LakeLabel
    label={t("form.label.birthPostal")}
    render={id => (
      <LakeTextInput
        id={id}
        ref={ref}
        value={value}
        valid={valid}
        error={error}
        onChangeText={onChange}
        readOnly={readOnly}
      />
    )}
  />
);
