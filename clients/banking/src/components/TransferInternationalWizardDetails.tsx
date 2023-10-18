import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { View } from "react-native";
import { useForm } from "react-ux-form";
import { t } from "../utils/i18n";

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
  const { Field, getFieldState, submitForm, listenFields } = useForm({
    details: {
      initialValue: null,
      sanitize: () => {},
      validate: () => {},
    },
  });

  return (
    <View>
      <Tile></Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={() => {}} grow={small}>
              {t("common.confirm")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};
