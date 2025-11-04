import { useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { CreditLimitIntro } from "../components/CreditLimitIntro";
import { ErrorView } from "../components/ErrorView";
import { CreditLimitPageDocument, CreditLimitPageQuery } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

const styles = StyleSheet.create({
  content: {
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingTop: spacings[32],
  },
  contentDesktop: {
    paddingHorizontal: spacings[40],
    paddingTop: spacings[40],
  },
});

type Props = {
  accountId: string;
  largeBreakpoint: boolean;
};

export const AccountDetailsCreditLimitPage = ({ accountId, largeBreakpoint }: Props) => {
  const [data] = useQuery(CreditLimitPageDocument, {
    accountId,
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, largeBreakpoint && styles.contentDesktop]}>
      {data.match({
        NotAsked: () => null,
        Loading: () => <LoadingView color={colors.current[500]} />,
        Done: result =>
          result.match({
            Ok: ({ account }) => {
              const creditLimitSettings = account?.creditLimitSettings;

              if (creditLimitSettings == null) {
                return <CreditLimitIntro accountId={accountId} />;
              }

              return match(creditLimitSettings.statusInfo.status)
                .with("Deactivated", "Suspended", () => (
                  <Box direction="column" justifyContent="center" alignItems="center" grow={1}>
                    <BorderedIcon
                      name={"dismiss-circle-regular"}
                      color="live"
                      size={100}
                      padding={16}
                    />
                    <Space height={24} />

                    <LakeText variant="medium" align="center" color={colors.gray[900]}>
                      {t("creditLimitRequest.result.refused.title")}
                    </LakeText>

                    <Space height={4} />

                    <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
                      {t("creditLimitRequest.result.refused.description")}
                    </LakeText>
                  </Box>
                ))
                .with("Pending", () => (
                  <Box direction="column" justifyContent="center" alignItems="center" grow={1}>
                    <BorderedIcon
                      name={"clock-regular"}
                      color="shakespear"
                      size={100}
                      padding={16}
                    />
                    <Space height={24} />

                    <LakeText variant="medium" align="center" color={colors.gray[900]}>
                      {t("accountDetails.creditLimit.pending.title", {
                        amount: formatCurrency(
                          Number(creditLimitSettings.owedAmount.value),
                          creditLimitSettings.owedAmount.currency,
                        ),
                      })}
                    </LakeText>

                    <Space height={4} />

                    <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
                      {t("accountDetails.creditLimit.pending.description")}
                    </LakeText>
                  </Box>
                ))
                .with("Activated", () => (
                  <CreditLimitInfo creditLimitSettings={creditLimitSettings} />
                ))
                .exhaustive();
            },
            Error: error => <ErrorView error={error} />,
          }),
      })}
    </ScrollView>
  );
};

type CreditLimitInfoProps = {
  creditLimitSettings: NonNullable<
    NonNullable<CreditLimitPageQuery["account"]>["creditLimitSettings"]
  >;
};

const CreditLimitInfo = ({ creditLimitSettings }: CreditLimitInfoProps) => {
  return <LakeText>CreditLimitInfo {creditLimitSettings.owedAmount.value}</LakeText>;
};
