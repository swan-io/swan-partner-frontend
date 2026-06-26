import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { t } from "../utils/i18n";

type Props = {
  value: string | undefined;
  onChange: (cardName: string) => void;
  disabled?: boolean;
};

export const CardNameField = ({ value, onChange, disabled }: Props) => (
  <Tile>
    <LakeLabel
      style={{ paddingTop: 0 }}
      label={t("cardSettings.name")}
      extra={() => (
        <LakeText color={colors.gray[500]} style={{ fontStyle: "italic" }}>
          {` (${t("form.optional")})`}
        </LakeText>
      )}
      render={id => (
        <>
          <LakeTextInput
            id={id}
            hideErrors={true}
            disabled={disabled}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={() => onChange((value ?? "").trim())}
          />
          <Space height={4} />
          <LakeText>{t("cardSettings.name.description")}</LakeText>
        </>
      )}
    />
  </Tile>
);
