import { useQuery } from "@swan-io/graphql-client";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { StyleSheet } from "react-native";
import { MerchantPaymentLinkDocument } from "../graphql/partner";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
});

type Props = {
  paymentLinkId: string;
  large: boolean;
};

export const MerchantProfilePaymentLinkDetail = ({ paymentLinkId, large }: Props) => {
  const [data, isLoading] = useQuery(MerchantPaymentLinkDocument, { paymentLinkId });

  return (
    <ScrollView contentContainerStyle={large ? styles.fill : undefined}>
      <ListRightPanelContent large={large} style={styles.fill}>
        <Tile></Tile>
      </ListRightPanelContent>
    </ScrollView>
  );
};
