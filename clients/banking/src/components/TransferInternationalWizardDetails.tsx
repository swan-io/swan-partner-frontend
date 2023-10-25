import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { StyleSheet, View } from "react-native";
import { useForm } from "react-ux-form";
import { t } from "../utils/i18n";
import { validateRequired } from "../utils/validations";

const styles = StyleSheet.create({
  field: {
    ...commonStyles.fill,
    flexBasis: "50%",
  },
});

export type Details = { label: string; reference: string };

type Props = {
  initialDetails?: Details;
  onPressPrevious: () => void;
  onSave: (details: Details) => void;
};

export const TransferInternationalWizardDetails = ({
  initialDetails,
  onPressPrevious,
  onSave,
}: Props) => {
  const { Field, submitForm } = useForm({
    label: {
      initialValue: initialDetails?.label ?? "",
      validate: validateRequired,
    },
    reference: {
      initialValue: initialDetails?.reference ?? "",
      validate: () => undefined,
    },
  });

  return (
    <View>
      <Tile>
        <ResponsiveContainer breakpoint={800}>
          {({ large }) => (
            <Box direction={large ? "row" : "column"}>
              <View style={styles.field}>
                <LakeLabel
                  label={t("transfer.new.details.label")}
                  render={id => (
                    <Field name="label">
                      {({ value, onChange, onBlur, error, valid, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
              </View>

              <Space width={24} />

              <View style={styles.field}>
                <LakeLabel
                  optionalLabel={t("form.optional")}
                  label={t("transfer.new.details.reference")}
                  render={id => (
                    <Field name="reference">
                      {({ value, onChange, onBlur, error, valid, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          valid={valid}
                          help={t(
                            "transfer.new.internationalTransfer.details.form.field.reference.help",
                          )}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      )}
                    </Field>
                  )}
                />
              </View>
            </Box>
          )}
        </ResponsiveContainer>
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton
              color="current"
              onPress={() => submitForm(details => onSave(details as Details))}
              grow={small}
            >
              {t("common.confirm")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};
