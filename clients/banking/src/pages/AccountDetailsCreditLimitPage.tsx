import { Option } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { GetEdge } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateIban } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { CreditLimitIntro } from "../components/CreditLimitIntro";
import { ErrorView } from "../components/ErrorView";
import { ProgressBar } from "../components/ProgressBar";
import { Redirect } from "../components/Redirect";
import {
  CreditLimitPageDocument,
  CreditLimitPageQuery,
  DayEnum,
  RepaymentCycleLengthInput,
  RequestCreditLimitSettingsDocument,
} from "../graphql/partner";
import { getCreditLimitAmount, getPendingCreditLimitAmount } from "../utils/creditLimit";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { validateRequired } from "../utils/validations";

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
              if (account == null) {
                return <Redirect to={Router.ProjectRootRedirect()} />;
              }

              const creditLimitSettings = account.creditLimitSettings;

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
                  const creditLimitAmount = getPendingCreditLimitAmount(
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
                      title={t("accountDetails.creditLimit.edit.title")}
                    >
                      <EditCreditLimitForm
                        accountId={account.id}
                        accountIban={account.IBAN ?? ""}
                        accountHolder={account.holder}
                        accountMembershipId={accountMembershipId}
                        creditLimitSettings={creditLimitSettings}
                        largeBreakpoint={largeBreakpoint}
                        onClose={() =>
                          Router.push("AccountDetailsCreditLimitRoot", { accountMembershipId })
                        }
                      />
                    </LakeModal>

                    <LakeModal
                      visible={route?.name === "AccountDetailsCreditLimitStatements"}
                      icon="arrow-download-filled"
                      color="partner"
                      title={t("accountDetails.creditLimit.statements.title")}
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
            title={
              creditLimitSettings.currentCycle?.endDate != null
                ? t("accountDetails.creditLimit.firstRepaymentScheduledAt", {
                    date: dayjs(creditLimitSettings.currentCycle.endDate).format("LL"),
                  })
                : t("accountDetails.creditLimit.noRepaymentYet")
            }
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

type EditCreditLimitFormProps = {
  accountId: string;
  accountIban: string;
  accountHolder: NonNullable<NonNullable<CreditLimitPageQuery["account"]>["holder"]>;
  accountMembershipId: string;
  creditLimitSettings: NonNullable<
    NonNullable<CreditLimitPageQuery["account"]>["creditLimitSettings"]
  >;
  largeBreakpoint: boolean;
  onClose: () => void;
};

const weekDays: Item<DayEnum>[] = [
  { value: "Monday", name: t("common.form.weekDay.monday") },
  { value: "Tuesday", name: t("common.form.weekDay.tuesday") },
  { value: "Wednesday", name: t("common.form.weekDay.wednesday") },
  { value: "Thursday", name: t("common.form.weekDay.thursday") },
  { value: "Friday", name: t("common.form.weekDay.friday") },
  { value: "Saturday", name: t("common.form.weekDay.saturday") },
  { value: "Sunday", name: t("common.form.weekDay.sunday") },
];

const monthDays: Item<number>[] = Array.from({ length: 31 }, (_, i) => i + 1).map(day => ({
  value: day,
  name: day.toString(),
}));

const EditCreditLimitForm = ({
  accountId,
  accountIban,
  accountHolder,
  accountMembershipId,
  creditLimitSettings,
  largeBreakpoint,
  onClose,
}: EditCreditLimitFormProps) => {
  const [requestCreditLimitSettings, creditLimitSettingsRequest] = useMutation(
    RequestCreditLimitSettingsDocument,
  );

  const repaymentInitialValues = useMemo(
    () =>
      match(creditLimitSettings.repaymentSettings.repaymentMethod)
        .with({ mandate: { __typename: "InternalReceivedDirectDebitMandate" } }, ({ mandate }) => ({
          repaymentAccountIban: mandate.iban,
          repaymentAccountName: mandate.creditor.name,
          repaymentAccountAddress: mandate.creditor.address.addressLine1,
          repaymentAccountAddressPostalCode: mandate.creditor.address.postalCode,
          repaymentAccountAddressCity: mandate.creditor.address.city,
          repaymentAccountAddressCountry: mandate.creditor.address.country,
        }))
        .otherwise(() => null),
    [creditLimitSettings.repaymentSettings.repaymentMethod],
  );

  const { Field, FieldsListener, submitForm } = useForm({
    repaymentFrequency: {
      initialValue: "Monthly" as "Monthly" | "Weekly",
      validate: validateRequired,
    },
    repaymentDayOfMonth: {
      initialValue: match(creditLimitSettings.repaymentSettings.repaymentCycleLength)
        .with({ __typename: "MonthlyPeriod" }, c => c.dayOfMonth)
        .otherwise(() => 1),
    },
    repaymentDayOfWeek: {
      initialValue: match(creditLimitSettings.repaymentSettings.repaymentCycleLength)
        .with({ __typename: "WeeklyPeriod" }, c => c.dayOfWeek)
        .otherwise(() => "Monday" as DayEnum),
    },
    repaymentMethod: {
      initialValue:
        repaymentInitialValues?.repaymentAccountIban === accountIban
          ? ("ThisAccount" as const)
          : ("AnotherAccount" as const),
    },
    repaymentAccountIban: {
      initialValue: repaymentInitialValues?.repaymentAccountIban ?? "",
      validate: combineValidators(validateRequired, validateIban),
    },
    repaymentAccountName: {
      initialValue: repaymentInitialValues?.repaymentAccountName ?? "",
      validate: validateRequired,
    },
    repaymentAccountAddress: {
      initialValue: repaymentInitialValues?.repaymentAccountAddress ?? "",
      validate: validateRequired,
    },
    repaymentAccountAddressPostalCode: {
      initialValue: repaymentInitialValues?.repaymentAccountAddressPostalCode ?? "",
      validate: validateRequired,
    },
    repaymentAccountAddressCity: {
      initialValue: repaymentInitialValues?.repaymentAccountAddressCity ?? "",
      validate: validateRequired,
    },
    repaymentAccountAddressCountry: {
      initialValue: repaymentInitialValues?.repaymentAccountAddressCountry ?? "",
      validate: validateRequired,
    },
  });

  const onPressSubmit = useCallback(() => {
    submitForm({
      onSuccess: ({
        repaymentFrequency,
        repaymentDayOfMonth,
        repaymentDayOfWeek,
        repaymentAccountIban,
        repaymentAccountName,
        repaymentAccountAddress,
        repaymentAccountAddressPostalCode,
        repaymentAccountAddressCity,
        repaymentAccountAddressCountry,
      }) => {
        const repaymentSettings = Option.allFromDict({
          repaymentAccountIban,
          repaymentAccountName,
          repaymentAccountAddress,
          repaymentAccountAddressPostalCode,
          repaymentAccountAddressCity,
          repaymentAccountAddressCountry,
        })
          .map(values => ({
            name: values.repaymentAccountName,
            IBAN: values.repaymentAccountIban,
            address: {
              addressLine1: values.repaymentAccountAddress,
              city: values.repaymentAccountAddressCity,
              postalCode: values.repaymentAccountAddressPostalCode,
              country: values.repaymentAccountAddressCountry,
            },
          }))
          .orElse(
            Option.allFromDict({
              addressLine1: Option.fromNullable(accountHolder.residencyAddress.addressLine1),
              city: Option.fromNullable(accountHolder.residencyAddress.city),
              postalCode: Option.fromNullable(accountHolder.residencyAddress.postalCode),
              country: Option.fromNullable(accountHolder.residencyAddress.country),
            }).map(({ addressLine1, city, postalCode, country }) => ({
              name: accountHolder.info.name,
              IBAN: accountIban,
              address: {
                addressLine1,
                city,
                postalCode,
                country,
              },
            })),
          )
          .map(sepaDirectDebitB2B => ({ sepaDirectDebitB2B }))
          .map(repaymentMethod => ({ repaymentMethod }));

        const cycleLength = repaymentFrequency.flatMap<RepaymentCycleLengthInput>(
          repaymentFrequency =>
            match(repaymentFrequency)
              .with("Monthly", () =>
                repaymentDayOfMonth.map(dayOfMonth => ({
                  monthly: { dayOfMonth },
                })),
              )
              .with("Weekly", () =>
                repaymentDayOfWeek.map(dayOfWeek => ({
                  weekly: { dayOfWeek, weekCount: 1 },
                })),
              )
              .exhaustive(),
        );

        Option.allFromDict({
          repaymentSettings,
          cycleLength,
        }).tapSome(input => {
          const creditLimitAmount = getCreditLimitAmount(
            creditLimitSettings.creditLimitSettingsRequests.edges.map(edge => edge.node),
          );

          const consentRedirectUrl = new URL(window.location.href);
          consentRedirectUrl.pathname = Router.AccountDetailsCreditLimitRoot({
            accountMembershipId,
          });

          requestCreditLimitSettings({
            input: {
              ...input,
              creditLimitSettings: {
                amount: {
                  value: creditLimitAmount.value.toString(),
                  currency: creditLimitAmount.currency,
                },
              },
              accountId,
              consentRedirectUrl: consentRedirectUrl.toString(),
            },
          })
            .mapOkToResult(data =>
              Option.fromNullable(data.requestCreditLimitSettings).toResult(undefined),
            )
            .mapOkToResult(filterRejectionsToResult)
            .tapOk(payload =>
              window.location.assign(payload.creditLimitSettingsRequest.consent.consentUrl),
            )
            .tapError(error =>
              showToast({ variant: "error", error, title: translateError(error) }),
            );
        });
      },
    });
  }, [
    accountId,
    accountIban,
    accountHolder,
    accountMembershipId,
    creditLimitSettings,
    submitForm,
    requestCreditLimitSettings,
  ]);

  return (
    <>
      <LakeText variant="smallRegular" color={colors.gray[500]}>
        {t("accountDetails.creditLimit.edit.description")}
      </LakeText>

      <Space height={24} />

      {creditLimitSettings.statusInfo.__typename === "CreditLimitStatusPendingInfo" && (
        <>
          <LakeAlert variant="info" title={t("accountDetails.creditLimit.edit.pendingWarning")} />
          <Space height={24} />
        </>
      )}

      <Field name="repaymentFrequency">
        {({ value, onChange, error }) => (
          <LakeLabel
            label={t("creditLimitRequest.repaymentFrequency")}
            render={() => (
              <RadioGroup
                direction="row"
                items={[
                  { value: "Monthly", name: t("creditLimitRequest.repaymentFrequency.monthly") },
                  { value: "Weekly", name: t("creditLimitRequest.repaymentFrequency.weekly") },
                ]}
                value={value}
                onValueChange={onChange}
                error={error}
              />
            )}
          />
        )}
      </Field>

      <FieldsListener names={["repaymentFrequency"]}>
        {({ repaymentFrequency }) =>
          match(repaymentFrequency.value)
            .with("Monthly", () => (
              <Field name="repaymentDayOfMonth">
                {({ value, onChange }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.repaymentDayOfMonth")}
                    render={id => (
                      <LakeSelect
                        id={id}
                        value={value}
                        items={monthDays}
                        onValueChange={onChange}
                      />
                    )}
                  />
                )}
              </Field>
            ))
            .with("Weekly", () => (
              <Field name="repaymentDayOfWeek">
                {({ value, onChange }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.repaymentDayOfWeek")}
                    render={id => (
                      <LakeSelect id={id} value={value} items={weekDays} onValueChange={onChange} />
                    )}
                  />
                )}
              </Field>
            ))
            .exhaustive()
        }
      </FieldsListener>

      <Field name="repaymentMethod">
        {({ value, onChange }) => (
          <LakeLabel
            label={t("creditLimitRequest.repaymentMethod")}
            render={() => (
              <RadioGroup
                direction="row"
                items={[
                  {
                    value: "ThisAccount",
                    name: t("creditLimitRequest.repaymentMethod.thisAccount"),
                  },
                  {
                    value: "AnotherAccount",
                    name: t("creditLimitRequest.repaymentMethod.anotherAccount"),
                  },
                ]}
                value={value}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <FieldsListener names={["repaymentMethod"]}>
        {({ repaymentMethod }) =>
          repaymentMethod.value === "AnotherAccount" ? (
            <>
              <Field name="repaymentAccountIban">
                {({ value, onChange, onBlur, error }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.iban")}
                    render={id => (
                      <LakeTextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        id={id}
                        error={error}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="repaymentAccountName">
                {({ value, onChange, onBlur, error }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.fullName")}
                    render={id => (
                      <LakeTextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        id={id}
                        error={error}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="repaymentAccountAddressCountry">
                {({ value, onChange, onBlur, error }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.addressCountry")}
                    render={id => (
                      <LakeTextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        id={id}
                        error={error}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="repaymentAccountAddress">
                {({ value, onChange, onBlur, error }) => (
                  <LakeLabel
                    label={t("creditLimitRequest.address")}
                    render={id => (
                      <LakeTextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        id={id}
                        error={error}
                      />
                    )}
                  />
                )}
              </Field>

              <Grid numColumns={largeBreakpoint ? 2 : 1} horizontalSpace={24}>
                <Field name="repaymentAccountAddressCity">
                  {({ value, onChange, onBlur, error }) => (
                    <LakeLabel
                      label={t("creditLimitRequest.addressCity")}
                      render={id => (
                        <LakeTextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          id={id}
                          error={error}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="repaymentAccountAddressPostalCode">
                  {({ value, onChange, onBlur, error }) => (
                    <LakeLabel
                      label={t("creditLimitRequest.addressPostalCode")}
                      render={id => (
                        <LakeTextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          id={id}
                          error={error}
                        />
                      )}
                    />
                  )}
                </Field>
              </Grid>
            </>
          ) : null
        }
      </FieldsListener>

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton grow={true} mode="secondary" onPress={onClose}>
          {t("common.cancel")}
        </LakeButton>

        <LakeButton
          grow={true}
          color="current"
          loading={creditLimitSettingsRequest.isLoading()}
          onPress={onPressSubmit}
        >
          {t("common.update")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};
