import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useState } from "react";
import { ScrollView } from "react-native";
import { t } from "./utils/i18n";
import { Router } from "./utils/routes";

const items = [{ id: "sdd", name: "SEPA Direct Debit" }] as const;

type ItemId = (typeof items)[number]["id"];

export const App = () => {
  const route = Router.useRoute(["PaymentLinkArea"]);

  const [selected, setSelected] = useState<ItemId>(items[0].id);

  return (
    <ScrollView>
      <Box>
        <Box>
          <LakeLabel
            label={t("paymentLink.paymentMethod")}
            render={() => (
              <SegmentedControl
                mode="desktop"
                selected={selected}
                items={[{ name: "Direct debit", id: "sdd" }]}
                onValueChange={setSelected}
              />
            )}
          />
        </Box>

        <LakeLabel label={t("paymentLink.iban")} render={() => <LakeTextInput />} />
        <LakeLabel label={t("paymentLink.country")} render={() => <LakeTextInput />} />

        <Box direction="row">
          <LakeLabel label={t("paymentLink.firstName")} render={() => <LakeTextInput />} />
          <LakeLabel label={t("paymentLink.lastName")} render={() => <LakeTextInput />} />
        </Box>

        <LakeLabel label={t("paymentLink.addressLine1")} render={() => <LakeTextInput />} />
        <LakeLabel label={t("paymentLink.addressLine2")} render={() => <LakeTextInput />} />
        <LakeLabel label={t("paymentLink.city")} render={() => <LakeTextInput />} />

        <Box direction="row">
          <LakeLabel label={t("paymentLink.postcode")} render={() => <LakeTextInput />} />
          <LakeLabel label={t("paymentLink.state")} render={() => <LakeTextInput />} />
        </Box>

        <LakeButton onPress={() => {}}>
          <LakeText color={backgroundColor.accented}> {t("button.pay")}</LakeText>
        </LakeButton>
      </Box>
    </ScrollView>
  );
};
