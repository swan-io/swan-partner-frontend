import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { AccountCountry, AddSepaBeneficiaryDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { BeneficiaryWizard } from "./BeneficiaryWizard";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  header: {
    paddingVertical: spacings[12],
  },
  headerContents: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 1336,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1172,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
});

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
};

export const BeneficiarySepaWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
}: Props) => {
  const [addSepaBeneficiary] = useMutation(AddSepaBeneficiaryDocument);

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null && (
                <>
                  <LakeButton
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                    ariaLabel={t("common.closeButton")}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              )}

              <View style={styles.headerTitle}>
                <LakeHeading level={2} variant="h3">
                  New beneficiary
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            <LakeHeading level={2} variant="h3">
              Beneficiary’s info
            </LakeHeading>

            <Space height={32} />

            <BeneficiaryWizard
              mode="add"
              accountCountry={accountCountry}
              accountId={accountId}
              onPressPrevious={onPressClose}
              onPressSubmit={beneficiary => {
                addSepaBeneficiary({
                  input: {
                    accountId,
                    iban: beneficiary.iban,
                    name: beneficiary.name,
                    consentRedirectUrl:
                      window.location.origin +
                      Router.AccountPaymentsBeneficiariesList({ accountMembershipId }),
                  },
                })
                  .mapOk(data => data.addTrustedSepaBeneficiary)
                  .mapOkToResult(data => Option.fromNullable(data).toResult(data))
                  .mapOkToResult(filterRejectionsToResult)
                  .tapOk(({ trustedBeneficiary }) => {
                    match(trustedBeneficiary.statusInfo)
                      .with(
                        { __typename: "TrustedBeneficiaryStatusInfoConsentPending" },
                        ({ consent }) => window.location.assign(consent.consentUrl),
                      )
                      .otherwise(() => {});
                  })
                  .tapError(error => {
                    showToast({ variant: "error", error, title: translateError(error) });
                  });
              }}
            />
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
