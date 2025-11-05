import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithCurrentColor } from "@swan-io/lake/src/components/WithCurrentColor";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { Request } from "@swan-io/request";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateIban } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import {
  CreditLimitRequestDocument,
  CreditLimitSettingsRequestFragment,
  CreditLimitStatus,
  DayEnum,
  RepaymentAccountFragment,
  RepaymentCycleLengthInput,
  RequestCreditLimitSettingsDocument,
} from "../graphql/partner";
import { PermissionProvider } from "../hooks/usePermissions";
import { NotFoundPage } from "../pages/NotFoundPage";
import { getCreditLimitAmount } from "../utils/creditLimit";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { validateNumeric, validateRequired } from "../utils/validations";
import { ErrorView } from "./ErrorView";
import { WizardLayout } from "./WizardLayout";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  notLegalRepresentativeContainer: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
    alignItems: "center",
    justifyContent: "center",
  },
});

const COOKIE_REFRESH_INTERVAL = 30000; // 30s

type Props = { accountId: string; from: string | undefined };

export const CreditLimitRequest = ({ accountId, from }: Props) => {
  const [data, { setVariables }] = useQuery(CreditLimitRequestDocument, {
    first: 20,
    accountId,
  });

  // Load automatically all account memberships until we find the current account
  useEffect(() => {
    match(data)
      .with(AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable }))), ({ user }) => {
        if (
          user.accountMemberships.pageInfo.hasNextPage === true &&
          !user.accountMemberships.edges.some(membership => membership.node.accountId === accountId)
        ) {
          setVariables({ after: user.accountMemberships.pageInfo.endCursor });
        }
      })
      .otherwise(() => {});
  }, [accountId, data, setVariables]);

  // Call API to extend cookie TTL
  useEffect(() => {
    const tick = () => {
      Request.make({ url: "/api/ping", method: "POST", credentials: "include", type: "text" });
    };
    const intervalId = setInterval(tick, COOKIE_REFRESH_INTERVAL);
    // Run the ping directly on mount
    tick();
    return () => clearInterval(intervalId);
  }, []);

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(
      AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable, account: P.nonNullable }))),
      ({ user, account, projectInfo }) => {
        const isLegalRepresentative = account.legalRepresentativeMembership.user?.id === user.id;

        const userMembershipIdOnCurrentAccount = Array.findMap(
          user.accountMemberships.edges,
          membership =>
            membership.node.accountId === accountId
              ? Option.Some(membership.node.id)
              : Option.None(),
        );

        const legalRepresentativeName = Option.fromNullable(
          account.legalRepresentativeMembership.user,
        ).flatMap(user => Option.fromNullable(user.fullName));

        const accentColor = projectInfo.accentColor ?? invariantColors.defaultAccentColor;

        const onClose = userMembershipIdOnCurrentAccount
          .map(
            accountMembershipId => () =>
              match(from)
                .with("CreditLimitTab", () =>
                  Router.push("AccountDetailsCreditLimit", { accountMembershipId }),
                )
                .with("NewCard", () =>
                  Router.push("AccountCardsList", { accountMembershipId, new: "" }),
                )
                .otherwise(() =>
                  Router.push("AccountRoot", {
                    accountMembershipId,
                  }),
                ),
          )
          .getOr(() => Router.push("ProjectRootRedirect"));

        return (
          <PermissionProvider
            value={Option.Some({
              accountMembership: account.legalRepresentativeMembership,
              settings: projectInfo.webBankingSettings,
            })}
          >
            <WithPartnerAccentColor color={accentColor}>
              {isLegalRepresentative ? (
                <View style={styles.container}>
                  <WizardLayout title={t("creditLimitRequest.creditLimit")} onPressClose={onClose}>
                    {({ large }) =>
                      account.creditLimitSettings == null ? (
                        <CreditLimitRequestForm account={account} large={large} />
                      ) : (
                        <CreditLimitRequestResult
                          status={account.creditLimitSettings.statusInfo.status}
                          creditLimitRequests={account.creditLimitSettings.creditLimitSettingsRequests.edges.map(
                            edge => edge.node,
                          )}
                          accountMembershipId={userMembershipIdOnCurrentAccount}
                          large={large}
                          onClose={onClose}
                        />
                      )
                    }
                  </WizardLayout>
                </View>
              ) : (
                <WithCurrentColor variant="negative" style={styles.notLegalRepresentativeContainer}>
                  <EmptyView
                    icon="dismiss-circle-regular"
                    borderedIcon={true}
                    borderedIconPadding={20}
                    title={t("creditLimitRequest.notLegalRepresentative.title")}
                    subtitle={match(legalRepresentativeName)
                      .with(Option.P.Some(P.select()), legalRepresentativeName =>
                        t("creditLimitRequest.notLegalRepresentative.description.withName", {
                          legalRepresentativeName,
                          legalRepresentativeEmail: account.legalRepresentativeMembership.email,
                        }),
                      )
                      .otherwise(() => t("creditLimitRequest.notLegalRepresentative.description"))}
                  >
                    {userMembershipIdOnCurrentAccount
                      .map(accountMembershipId => {
                        return (
                          <LakeButtonGroup>
                            <LakeButton
                              onPress={() => Router.push("AccountRoot", { accountMembershipId })}
                              mode="secondary"
                            >
                              {t("common.closeButton")}
                            </LakeButton>
                          </LakeButtonGroup>
                        );
                      })
                      .toNull()}
                  </EmptyView>
                </WithCurrentColor>
              )}
            </WithPartnerAccentColor>
          </PermissionProvider>
        );
      },
    )
    .otherwise(() => <NotFoundPage />);
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

type FormProps = {
  account: RepaymentAccountFragment;
  large: boolean;
};

const CreditLimitRequestForm = ({ account, large }: FormProps) => {
  const [requestCreditLimitSettings, creditLimitSettingsRequest] = useMutation(
    RequestCreditLimitSettingsDocument,
  );

  const { Field, FieldsListener, submitForm } = useForm({
    amount: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateNumeric()),
    },
    repaymentFrequency: {
      initialValue: "Monthly" as "Monthly" | "Weekly",
      validate: validateRequired,
    },
    repaymentDayOfMonth: {
      initialValue: 1,
    },
    repaymentDayOfWeek: {
      initialValue: "Monday" as DayEnum,
    },
    repaymentMethod: {
      initialValue: "ThisAccount" as "ThisAccount" | "AnotherAccount",
    },
    repaymentAccountIban: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateIban),
    },
    repaymentAccountName: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentAccountAddress: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentAccountAddressPostalCode: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentAccountAddressCity: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentAccountAddressCountry: {
      initialValue: "",
      validate: validateRequired,
    },
  });

  const onPressSubmit = useCallback(() => {
    submitForm({
      onSuccess: ({
        amount,
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
              IBAN: Option.fromNullable(account.IBAN),
              addressLine1: Option.fromNullable(account.holder.residencyAddress.addressLine1),
              city: Option.fromNullable(account.holder.residencyAddress.city),
              postalCode: Option.fromNullable(account.holder.residencyAddress.postalCode),
              country: Option.fromNullable(account.holder.residencyAddress.country),
            }).map(({ IBAN, addressLine1, city, postalCode, country }) => ({
              name: account.holder.info.name,
              IBAN,
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

        const creditLimitSettings = Option.allFromDict({
          amount: amount.map(value => ({
            value,
            currency: "EUR",
          })),
        });

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
          creditLimitSettings,
          cycleLength,
        }).tapSome(input => {
          requestCreditLimitSettings({
            input: {
              ...input,
              accountId: account.id,
              consentRedirectUrl: window.location.href,
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
  }, [account, submitForm, requestCreditLimitSettings]);

  return (
    <>
      <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
        {t("creditLimitRequest.title")}
      </LakeHeading>

      <Space height={12} />
      <LakeText>{t("creditLimitRequest.notice")}</LakeText>
      <Space height={24} />

      <Field name="amount">
        {({ value, onChange, onBlur, error }) => (
          <LakeLabel
            label={t("creditLimitRequest.creditLimitAmount")}
            render={id => (
              <LakeTextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                id={id}
                unit="EUR"
                error={error}
              />
            )}
          />
        )}
      </Field>

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

              <Grid numColumns={large ? 2 : 1} horizontalSpace={24}>
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

      <LakeButtonGroup>
        <LakeButton
          grow={true}
          color="current"
          loading={creditLimitSettingsRequest.isLoading()}
          onPress={onPressSubmit}
        >
          {t("creditLimitRequest.requestCreditLimit")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type CreditLimitRequestResultProps = {
  accountMembershipId: Option<string>;
  status: CreditLimitStatus;
  creditLimitRequests: CreditLimitSettingsRequestFragment[];
  onClose: () => void;
  large: boolean;
};

const CreditLimitRequestResult = ({
  accountMembershipId,
  status,
  creditLimitRequests,
  onClose,
}: CreditLimitRequestResultProps) => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.fill}>
      {match(status)
        .with("Activated", () => {
          const creditLimitAmount = getCreditLimitAmount(creditLimitRequests);

          return (
            <>
              <BorderedIcon name={"lake-check"} color="positive" size={100} padding={16} />
              <Space height={24} />

              <LakeText variant="medium" align="center" color={colors.gray[900]}>
                {formatNestedMessage("creditLimitRequest.result.success.title", {
                  amount: formatCurrency(creditLimitAmount.value, creditLimitAmount.currency),
                  b: text => <LakeText color={colors.current[500]}>{text}</LakeText>,
                })}
              </LakeText>

              <Space height={4} />

              <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
                {t("creditLimitRequest.result.success.description")}
              </LakeText>

              <Space height={8} />

              <LakeButtonGroup>
                <LakeButton mode="secondary" onPress={onClose}>
                  {t("common.closeButton")}
                </LakeButton>
                {accountMembershipId.match({
                  Some: accountMembershipId => (
                    <LakeButton
                      color="current"
                      icon="add-circle-filled"
                      href={Router.AccountCardsList({ accountMembershipId, new: "" })}
                    >
                      {t("creditLimitRequest.result.success.cta")}
                    </LakeButton>
                  ),
                  None: () => null,
                })}
              </LakeButtonGroup>
            </>
          );
        })
        .with("Pending", () => (
          <>
            <BorderedIcon name={"clock-regular"} color="shakespear" size={100} padding={16} />
            <Space height={24} />

            <LakeText variant="medium" align="center" color={colors.gray[900]}>
              {t("creditLimitRequest.result.pending.title")}
            </LakeText>

            <Space height={4} />

            <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
              {t("creditLimitRequest.result.pending.description")}
            </LakeText>

            <Space height={24} />

            {accountMembershipId.match({
              Some: accountMembershipId => (
                <LakeButton
                  mode="secondary"
                  href={Router.AccountDetailsCreditLimit({ accountMembershipId })}
                >
                  {t("creditLimitRequest.result.pending.cta")}
                </LakeButton>
              ),
              None: () => (
                <LakeButton mode="secondary" onPress={onClose}>
                  {t("common.closeButton")}
                </LakeButton>
              ),
            })}
          </>
        ))
        .with("Deactivated", "Suspended", () => (
          <>
            <BorderedIcon name={"dismiss-circle-regular"} color="live" size={100} padding={16} />
            <Space height={24} />

            <LakeText variant="medium" align="center" color={colors.gray[900]}>
              {t("creditLimitRequest.result.refused.title")}
            </LakeText>

            <Space height={4} />

            <LakeText variant="smallRegular" align="center" color={colors.gray[500]}>
              {t("creditLimitRequest.result.refused.description")}
            </LakeText>

            <Space height={24} />

            <LakeButton mode="secondary" onPress={onClose}>
              {t("common.closeButton")}
            </LakeButton>
          </>
        ))
        .exhaustive()}
    </Box>
  );
};
