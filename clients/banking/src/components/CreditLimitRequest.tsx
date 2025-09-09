import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithCurrentColor } from "@swan-io/lake/src/components/WithCurrentColor";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { Request } from "@swan-io/request";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { CreditLimitRequestDocument } from "../graphql/partner";
import { PermissionProvider } from "../hooks/usePermissions";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { validateNumeric, validateRequired } from "../utils/validations";
import { ErrorView } from "./ErrorView";
import { WizardLayout } from "./WizardLayout";

const styles = StyleSheet.create({
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

type Props = { accountId: string; resourceId: string | undefined; status: string | undefined };

export const CreditLimitRequest = ({ accountId, resourceId, status }: Props) => {
  const [data, { setVariables }] = useQuery(CreditLimitRequestDocument, {
    first: 20,
    accountId,
  });

  useEffect(() => {
    match(data)
      .with(AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable }))), ({ user }) => {
        if (
          user.accountMemberships.pageInfo.hasNextPage === true &&
          !user.accountMemberships.edges.some(membership => membership.node.accountId === accountId)
        ) {
          console.log(user.accountMemberships.pageInfo.endCursor);
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
                  <WizardLayout
                    title={t("creditLimitRequest.creditLimit")}
                    onPressClose={userMembershipIdOnCurrentAccount
                      .map(accountMembershipId => {
                        return () =>
                          Router.push("AccountRoot", {
                            accountMembershipId,
                          });
                      })
                      .toUndefined()}
                  >
                    {({ large }) => (
                      <>
                        <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
                          {t("creditLimitRequest.title")}
                        </LakeHeading>

                        <Space height={12} />
                        <LakeText>{t("creditLimitRequest.notice")}</LakeText>
                        <Space height={24} />

                        <CreditLimitRequestForm />
                      </>
                    )}
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

const CreditLimitRequestForm = () => {
  const { Field, FieldsListener, submitForm } = useForm({
    amount: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateNumeric()),
    },
    repaymentFrequency: {
      initialValue: "Monthly",
      validate: validateRequired,
    },
    repaymentDate: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentDayOfWeek: {
      initialValue: "",
      validate: validateRequired,
    },
    repaymentMethod: {
      initialValue: "ThisAccount",
      validate: validateRequired,
    },
    repaymentAccountIban: {
      initialValue: "",
      validate: validateRequired,
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
      onSuccess: () => {},
    });
  }, [submitForm]);

  return (
    <>
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
                unit="€"
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
            render={id => (
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
          repaymentFrequency.value === "Monthly" ? (
            <Field name="repaymentDate">
              {({ value, onChange, onBlur, error }) => (
                <LakeLabel
                  label={t("creditLimitRequest.repaymentDate")}
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
          ) : (
            <Field name="repaymentDayOfWeek">
              {({ value, onChange, onBlur, error }) => (
                <LakeLabel
                  label={t("creditLimitRequest.repaymentDayOfWeek")}
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
          )
        }
      </FieldsListener>

      <Field name="repaymentMethod">
        {({ value, onChange, error }) => (
          <LakeLabel
            label={t("creditLimitRequest.repaymentMethod")}
            render={id => (
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
                error={error}
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
            </>
          ) : null
        }
      </FieldsListener>

      <LakeButtonGroup>
        <LakeButton grow={true} color="current" onPress={onPressSubmit}>
          {t("creditLimitRequest.requestCreditLimit")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};
