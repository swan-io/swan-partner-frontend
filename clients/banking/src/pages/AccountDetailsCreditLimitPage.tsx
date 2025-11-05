import { useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { GetEdge } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { CreditLimitIntro } from "../components/CreditLimitIntro";
import { ErrorView } from "../components/ErrorView";
import { ProgressBar } from "../components/ProgressBar";
import { Redirect } from "../components/Redirect";
import { CreditLimitPageDocument, CreditLimitPageQuery } from "../graphql/partner";
import { getCreditLimitAmount } from "../utils/creditLimit";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: spacings[24],
    paddingTop: spacings[32],
  },
  contentDesktop: {
    paddingHorizontal: spacings[40],
    paddingTop: spacings[40],
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 3,
  },
  legendDotUsed: {
    backgroundColor: colors.partner[500],
    borderColor: colors.partner[100],
  },
  legendDotRemaining: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[500],
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  largeBreakpoint: boolean;
};

type Account = NonNullable<CreditLimitPageQuery["account"]>;
type Edge = GetEdge<NonNullable<NonNullable<Account["creditLimitSettings"]>["cycles"]>>;
type ExtraInfo = null;

const columns: ColumnConfig<Edge, ExtraInfo>[] = [
  {
    width: "grow",
    id: "date",
    title: t("accountDetails.creditLimit.repayments.table.repaymentDate"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { node } }) => (
      <TextCell
        text={`${dayjs(node.startDate).format("LL")} - ${dayjs(node.endDate).format("LL")}`}
      />
    ),
  },
  {
    width: 160,
    id: "amount",
    title: t("accountDetails.creditLimit.repayments.table.amount"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({
      item: {
        node: { owedAmount },
      },
    }) => <TextCell text={formatCurrency(Number(owedAmount.value), owedAmount.currency)} />,
  },
];

const smallColumns: ColumnConfig<Edge, ExtraInfo>[] = columns;

const keyExtractor = ({ node: { id } }: Edge) => id;

export const AccountDetailsCreditLimitPage = ({
  accountId,
  accountMembershipId,
  largeBreakpoint,
}: Props) => {
  const [data] = useQuery(CreditLimitPageDocument, {
    accountId,
  });
  const route = Router.useRoute([
    "AccountDetailsCreditLimitEdit",
    "AccountDetailsCreditLimitStatements",
  ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {data.match({
        NotAsked: () => null,
        Loading: () => <LoadingView color={colors.current[500]} />,
        Done: result =>
          result.match({
            Ok: ({ account }) => {
              const creditLimitSettings = account?.creditLimitSettings;

              // Should never happened, in case someone tries to access edit/statements without an active credit limit
              if (
                (route?.name === "AccountDetailsCreditLimitEdit" ||
                  route?.name === "AccountDetailsCreditLimitStatements") &&
                creditLimitSettings?.statusInfo.status !== "Activated"
              ) {
                return (
                  <Redirect to={Router.AccountDetailsCreditLimitRoot({ accountMembershipId })} />
                );
              }

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
                .with("Pending", () => {
                  const creditLimitAmount = getCreditLimitAmount(
                    creditLimitSettings.creditLimitSettingsRequests.edges.map(edge => edge.node),
                  );

                  return (
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
                            creditLimitAmount.value,
                            creditLimitAmount.currency,
                          ),
                        })}
                      </LakeText>

                      <Space height={4} />

                      <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
                        {t("accountDetails.creditLimit.pending.description")}
                      </LakeText>
                    </Box>
                  );
                })
                .with("Activated", () => (
                  <>
                    <CreditLimitInfo
                      accountMembershipId={accountMembershipId}
                      creditLimitSettings={creditLimitSettings}
                      largeBreakpoint={largeBreakpoint}
                    />

                    <LakeModal
                      visible={route?.name === "AccountDetailsCreditLimitEdit"}
                      icon="edit-regular"
                      color="partner"
                      title="Edit"
                      onPressClose={() =>
                        Router.push("AccountDetailsCreditLimitRoot", { accountMembershipId })
                      }
                    >
                      <LakeText>Edit Credit Limit - to be implemented</LakeText>
                    </LakeModal>

                    <LakeModal
                      visible={route?.name === "AccountDetailsCreditLimitStatements"}
                      icon="arrow-download-filled"
                      color="partner"
                      title="Statements"
                      onPressClose={() =>
                        Router.push("AccountDetailsCreditLimitRoot", { accountMembershipId })
                      }
                    >
                      <LakeText>Credit Limit Statements - to be implemented</LakeText>
                    </LakeModal>
                  </>
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
  accountMembershipId: string;
  creditLimitSettings: NonNullable<
    NonNullable<CreditLimitPageQuery["account"]>["creditLimitSettings"]
  >;
  largeBreakpoint: boolean;
};

const CreditLimitInfo = ({
  accountMembershipId,
  creditLimitSettings,
  largeBreakpoint,
}: CreditLimitInfoProps) => {
  const creditLimitAmount = getCreditLimitAmount(
    creditLimitSettings.creditLimitSettingsRequests.edges.map(edge => edge.node),
  );

  return (
    <>
      <View style={[styles.content, largeBreakpoint && styles.contentDesktop]}>
        <Box direction="row" alignItems="center">
          <LakeHeading level={2} variant="h4">
            {t("accountDetails.creditLimit.title")}
          </LakeHeading>

          <Fill minWidth={16} />

          <LakeButton
            size="small"
            icon="edit-regular"
            mode="tertiary"
            onPress={() => Router.push("AccountDetailsCreditLimitEdit", { accountMembershipId })}
          >
            {t("common.edit")}
          </LakeButton>
        </Box>

        <Space height={12} />

        <Tile paddingVertical={24}>
          <LakeHeading level={3} variant="h3">
            {formatCurrency(creditLimitAmount.value, creditLimitAmount.currency)}
          </LakeHeading>

          <LakeText variant="smallRegular" color={colors.gray[500]}>
            {t("accountDetails.creditLimit.amountLabel")}
          </LakeText>

          <Space height={12} />

          <LakeText variant="smallMedium" color={colors.gray[900]}>
            {match(creditLimitSettings.repaymentSettings.repaymentCycleLength)
              .with({ __typename: "MonthlyPeriod" }, () =>
                t("accountDetails.creditLimit.monthlyRepayment"),
              )
              .with({ __typename: "WeeklyPeriod" }, () =>
                t("accountDetails.creditLimit.weeklyRepayment"),
              )
              .exhaustive()}
          </LakeText>

          {creditLimitSettings.currentCycle != null && (
            <>
              <LakeText variant="regular" color={colors.gray[500]}>
                {formatNestedMessage("accountDetails.creditLimit.nextRepaymentDate", {
                  date: dayjs(creditLimitSettings.currentCycle.endDate).format("dddd, LL"),
                  b: text => (
                    <LakeText variant="smallMedium" color={colors.gray[900]}>
                      {text}
                    </LakeText>
                  ),
                })}
              </LakeText>

              <Space height={12} />
              <ProgressBar
                min={0}
                max={creditLimitAmount.value}
                value={Number(creditLimitSettings.currentCycle?.owedAmount.value ?? "0")}
                color="partner"
              />
              <Space height={12} />
              <CreditLimitProgressLegend
                usedAmount={{
                  value: Number(creditLimitSettings.currentCycle.owedAmount.value),
                  currency: creditLimitSettings.currentCycle.owedAmount.currency,
                }}
                availableAmount={creditLimitAmount}
              />
            </>
          )}
        </Tile>

        <Space height={24} />

        <LakeHeading level={2} variant="h4">
          {t("accountDetails.creditLimit.pastRepayments")}
        </LakeHeading>

        <Space height={12} />

        <Box direction="row">
          <LakeButton
            icon="arrow-download-filled"
            size="small"
            color="partner"
            onPress={() =>
              Router.push("AccountDetailsCreditLimitStatements", { accountMembershipId })
            }
          >
            {t("accountDetails.creditLimit.statements")}
          </LakeButton>
        </Box>

        <Space height={12} />
      </View>

      <PlainListView
        withoutScroll={true}
        data={
          creditLimitSettings.cycles?.edges.filter(
            edge => edge.node.id !== creditLimitSettings.currentCycle?.id,
          ) ?? []
        }
        extraInfo={null}
        columns={columns}
        smallColumns={smallColumns}
        keyExtractor={keyExtractor}
        headerHeight={48}
        groupHeaderHeight={48}
        rowHeight={56}
        renderEmptyList={() => (
          <EmptyView
            icon="arrow-swap-regular"
            title={t("accountDetails.virtualIbans.emptyTitle")}
            subtitle={t("accountDetails.virtualIbans.emptyDescription")}
          />
        )}
      />
    </>
  );
};

type CreditLimitProgressLegendProps = {
  usedAmount: { value: number; currency: string };
  availableAmount: { value: number; currency: string };
};

const CreditLimitProgressLegend = ({
  usedAmount,
  availableAmount,
}: CreditLimitProgressLegendProps) => {
  const remainingAmount = {
    value: availableAmount.value - usedAmount.value,
    currency: availableAmount.currency,
  };

  return (
    <Box direction="row" alignItems="center">
      <View style={[styles.legendDot, styles.legendDotUsed]} />
      <Space width={8} />
      <LakeText variant="smallRegular" color={colors.gray[500]}>
        {formatNestedMessage("accountDetails.creditLimit.amountUsed", {
          amount: formatCurrency(usedAmount.value, usedAmount.currency),
          b: text => <LakeText color={colors.gray[900]}>{text}</LakeText>,
        })}
      </LakeText>

      <Space width={32} />

      <View style={[styles.legendDot, styles.legendDotRemaining]} />
      <Space width={8} />
      <LakeText variant="smallRegular" color={colors.gray[500]}>
        {formatNestedMessage("accountDetails.creditLimit.amountRemaining", {
          amount: formatCurrency(remainingAmount.value, remainingAmount.currency),
          b: text => <LakeText color={colors.gray[900]}>{text}</LakeText>,
        })}
      </LakeText>
    </Box>
  );
};
