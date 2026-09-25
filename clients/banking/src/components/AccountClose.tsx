import { Array, AsyncData, Option, Result } from "@bloodyowl/boxed";
import { useMutation, useQuery } from "@bloodyowl/graphql-client";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FlowPresentation } from "@swan-io/lake/src/components/FlowPresentation";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { WithCurrentColor } from "@swan-io/lake/src/components/WithCurrentColor";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import {
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { AccountClosingDocument, CloseAccountDocument } from "../graphql/partner";
import { PermissionProvider } from "../hooks/usePermissions";
import { NotFoundPage } from "../pages/NotFoundPage";
import { env } from "../utils/env";
import { formatNestedMessage, languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { validateAccountReasonClose } from "../utils/validations";
import { ErrorView } from "./ErrorView";
import { TransferRegularWizard } from "./TransferRegularWizard";
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
  successContainer: {
    ...commonStyles.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelledContainer: {
    ...commonStyles.fill,
  },
  flex: {
    display: "flex",
  },
  accountInfoRow: {
    flexDirection: "row",
  },
  languagesSelect: {
    alignItems: "flex-end",
  },
  partnership: {
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanPartnershipLogo: {
    height: 9,
  },
});

type Props = { accountId: string; resourceId: string | undefined; status: string | undefined };

type Reason = "NotUsingAccountAnymore" | "NotSatisfied" | "Other";

const reasons: Item<Reason>[] = [
  { value: "NotUsingAccountAnymore", name: t("accountClose.reason.NotUsingAccountAnymore") },
  { value: "NotSatisfied", name: t("accountClose.reason.NotSatisfied") },
  { value: "Other", name: t("accountClose.reason.Other") },
];

const AccountCloseReasonForm = ({
  accountId,
  onCancel,
}: {
  accountId: string;
  onCancel: () => void;
}) => {
  const [closeAccount, accountClosure] = useMutation(CloseAccountDocument);

  const { Field, FieldsListener, submitForm } = useForm<{
    reason: Reason | undefined;
    message: string;
  }>({
    reason: {
      initialValue: undefined,
      validate: validateNullableRequired,
    },
    message: {
      initialValue: "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateAccountReasonClose),
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: ({ reason, message }) => {
        const messageToSend = reason
          .flatMap(Option.fromUndefined)
          .flatMap(item => (item === "Other" ? message : Option.Some(item)));

        const consentRedirectUrl = new URL(env.BANKING_URL);
        consentRedirectUrl.pathname = Router.AccountClose({ accountId });

        return match(messageToSend)
          .with(Option.P.Some(P.select()), message =>
            closeAccount({
              input: {
                accountId,
                reason: {
                  type: "ClosingRequested",
                  message,
                },
                consentRedirectUrl: consentRedirectUrl.toString(),
              },
            })
              .mapOk(data => data.closeAccount)
              .mapOkToResult(filterRejectionsToResult)
              .tapError(error =>
                showToast({ variant: "error", title: translateError(error), error }),
              )
              .tapOk(closeAccount => {
                window.location.replace(closeAccount.consent.consentUrl);
              }),
          )
          .otherwise(() => {});
      },
    });
  };

  return (
    <>
      <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
        {t("accountClose.whyLeaving")}
      </LakeHeading>

      <Space height={24} />

      <Tile
        footer={
          <LakeAlert
            anchored={true}
            variant="warning"
            title={t("accountClose.warning.title")}
            callToAction={
              <LakeButton
                icon="question-circle-regular"
                href="https://support.swan.io/hc/en-150/articles/14642306196765-Account-closure-process"
                hrefAttrs={{ target: "blank" }}
                mode="tertiary"
                size="small"
                color="warning"
              >
                {t("common.learnMore")}
              </LakeButton>
            }
          >
            <LakeText>
              {formatNestedMessage("accountClose.warning.description", {
                list: chunk => (
                  <View style={styles.flex}>
                    <Space height={4} />
                    <View role="list">{chunk}</View>
                  </View>
                ),
                listitem: chunk =>
                  Array.isArray(chunk) && typeof chunk[0] === "string" ? (
                    <LakeText role="listitem" key={chunk[0]}>
                      • {chunk[0]}
                    </LakeText>
                  ) : null,
              })}
            </LakeText>
          </LakeAlert>
        }
      >
        <Field name="reason">
          {({ value, onChange, ref }) => (
            <LakeLabel
              label={t("accountClose.form.reason")}
              render={id => (
                <LakeSelect
                  id={id}
                  ref={ref}
                  items={reasons}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />
          )}
        </Field>

        <FieldsListener names={["reason"]}>
          {({ reason }) =>
            reason.value === "Other" ? (
              <Field name="message">
                {({ onChange, onBlur, value, valid, error, ref }) => (
                  <LakeLabel
                    label={t("accountClose.form.otherReasonDetails")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        valid={valid}
                        error={error}
                        ref={ref}
                        multiline={true}
                        numberOfLines={4}
                        maxCharCount={255}
                      />
                    )}
                  />
                )}
              </Field>
            ) : null
          }
        </FieldsListener>
      </Tile>

      <LakeButtonGroup>
        <LakeButton color="negative" onPress={onPressSubmit} loading={accountClosure.isLoading()}>
          {t("accountClose.form.confirm")}
        </LakeButton>

        <LakeButton mode="secondary" onPress={onCancel}>
          {t("common.cancel")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type TransferStep = "Intro" | "Transfer" | "Later";

const TransferScreen = ({
  accountMembershipId,
  accountId,
  large,
}: {
  accountId: string;
  accountMembershipId: string;
  large: boolean;
}) => {
  const [step, setStep] = useState<TransferStep>("Intro");

  return match(step)
    .with("Intro", () => (
      <View style={styles.successContainer}>
        <EmptyView
          icon="arrow-swap-regular"
          borderedIcon={true}
          borderedIconPadding={20}
          title={t("accountClose.transferIntro.title")}
          subtitle={t("accountClose.transferIntro.description")}
        >
          <Space height={24} />

          <FlowPresentation
            mode="mobile"
            steps={[
              {
                label: t("accountClose.steps.letUsKnowWhy"),
                icon: "question-circle-regular",
              },
              {
                label: t("accountClose.steps.transferBalance"),
                icon: "arrow-swap-regular",
                isComplete: true,
              },
            ]}
          />

          <Space height={24} />

          <LakeButtonGroup>
            <LakeButton onPress={() => setStep("Later")} mode="secondary">
              {t("accountClose.transferIntro.later")}
            </LakeButton>

            <LakeButton color="current" onPress={() => setStep("Transfer")}>
              {t("accountClose.transferIntro.transferBalance")}
            </LakeButton>
          </LakeButtonGroup>
        </EmptyView>
      </View>
    ))
    .with("Later", () => (
      <View style={styles.successContainer}>
        <EmptyView
          icon="clock-regular"
          borderedIcon={true}
          borderedIconPadding={20}
          title={t("accountClose.transferIntro.later.title")}
          subtitle={t("accountClose.transferIntro.later.description")}
        >
          <LakeButtonGroup>
            <LakeButton
              onPress={() => Router.push("AccountRoot", { accountMembershipId })}
              mode="secondary"
            >
              {t("common.closeButton")}
            </LakeButton>
          </LakeButtonGroup>
        </EmptyView>
      </View>
    ))
    .with("Transfer", () => (
      <TransferRegularWizard
        large={large}
        accountId={accountId}
        isAccountClosing={true}
        accountMembershipId={accountMembershipId}
        onPressClose={() => Router.push("AccountRoot", { accountMembershipId })}
      />
    ))
    .exhaustive();
};

const languageOptions = languages.map(country => ({
  name: country.native,
  value: country.id,
}));

export const AccountClose = ({ accountId, resourceId, status }: Props) => {
  const [data, { setVariables }] = useQuery(AccountClosingDocument, { accountId, first: 20 });
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    match(data)
      .with(
        AsyncData.P.Done(Result.P.Ok(P.select({ user: P.nonNullable, holder: P.nonNullable }))),
        ({ user }) => {
          if (
            user.accountMemberships.pageInfo.hasNextPage === true &&
            !user.accountMemberships.edges.some(
              membership => membership.node.accountId === accountId,
            )
          ) {
            setVariables({ after: user.accountMemberships.pageInfo.endCursor });
          }
        },
      )
      .otherwise(() => {});
  }, [accountId, data, setVariables]);

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

        const balance = Number(account.balances?.available.value);

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
                    title={projectInfo.name}
                    logoUri={projectInfo.logoUri}
                    onPressClose={
                      isCancelled
                        ? undefined
                        : userMembershipIdOnCurrentAccount
                            .map(accountMembershipId => {
                              return () => {
                                if (account.statusInfo.status === "Opened") {
                                  setIsCancelled(true);
                                } else {
                                  Router.push("AccountRoot", { accountMembershipId });
                                }
                              };
                            })
                            .toUndefined()
                    }
                    headerEnd={
                      <View>
                        <LakeSelect
                          value={locale.language}
                          items={languageOptions}
                          hideErrors={true}
                          mode="borderless"
                          style={styles.languagesSelect}
                          onValueChange={locale => {
                            setPreferredLanguage(locale);
                          }}
                        />
                      </View>
                    }
                  >
                    {({ large }) =>
                      match({ accountStatus: account.statusInfo.status, balance })
                        .with({ accountStatus: "Closed" }, () => (
                          <WithCurrentColor variant="positive" style={styles.successContainer}>
                            <EmptyView
                              icon="lake-check"
                              borderedIcon={true}
                              borderedIconPadding={20}
                              title={t("accountClose.closed.title")}
                              subtitle={t("accountClose.closed.description")}
                            />
                          </WithCurrentColor>
                        ))
                        .with({ accountStatus: "Closing", balance: 0 }, () => (
                          <WithCurrentColor variant="positive" style={styles.successContainer}>
                            <EmptyView
                              icon="lake-check"
                              borderedIcon={true}
                              borderedIconPadding={20}
                              title={t("accountClose.closureSuccessful.title")}
                              subtitle={t("accountClose.closureSuccessful.description")}
                            />
                          </WithCurrentColor>
                        ))
                        .with({ accountStatus: "Closing", balance: P.number.negative() }, () => (
                          <WithCurrentColor variant="negative" style={styles.successContainer}>
                            <EmptyView
                              icon="dismiss-circle-regular"
                              borderedIcon={true}
                              borderedIconPadding={20}
                              title={t("accountClose.negativeBalance.title")}
                              subtitle={t("accountClose.negativeBalance.description")}
                            >
                              <LakeButtonGroup>
                                <LakeButton
                                  href="https://support.swan.io/hc/requests/new"
                                  mode="secondary"
                                >
                                  {t("accountClose.negativeBalance.contactSupport")}
                                </LakeButton>
                              </LakeButtonGroup>
                            </EmptyView>
                          </WithCurrentColor>
                        ))
                        .with({ accountStatus: "Closing", balance: P.number.positive() }, () => {
                          // as transactions are asynchronous, this approximates the success
                          // -> the resourceId includes a `_` char: it's likely a transactionId
                          // -> the status of the consent is `Accepted`
                          if (resourceId?.includes("_") && status === "Accepted") {
                            return (
                              <WithCurrentColor variant="positive" style={styles.successContainer}>
                                <EmptyView
                                  icon="lake-check"
                                  borderedIcon={true}
                                  borderedIconPadding={20}
                                  title={t("accountClose.transferDone.title")}
                                  subtitle={t("accountClose.transferDone.description")}
                                />
                              </WithCurrentColor>
                            );
                          }
                          return match(userMembershipIdOnCurrentAccount)
                            .with(Option.P.None, () => <LoadingView />)
                            .with(Option.P.Some(P.select()), accountMembershipId => (
                              <TransferScreen
                                accountMembershipId={accountMembershipId}
                                accountId={accountId}
                                large={large}
                              />
                            ))
                            .exhaustive();
                        })
                        .with({ accountStatus: "Opened" }, () =>
                          isCancelled ? (
                            <View style={styles.cancelledContainer}>
                              <WithCurrentColor variant="partner" style={styles.successContainer}>
                                <EmptyView
                                  icon="dismiss-circle-regular"
                                  borderedIcon={true}
                                  borderedIconPadding={20}
                                  title={t("accountClose.cancelled.title")}
                                  subtitle={t("accountClose.cancelled.description")}
                                />
                              </WithCurrentColor>

                              {isNotNullish(projectInfo.logoUri) && (
                                <LakeText variant="smallRegular" style={styles.partnership}>
                                  {t("login.partnership")}{" "}
                                  <SwanLogo style={styles.swanPartnershipLogo} />
                                </LakeText>
                              )}
                            </View>
                          ) : (
                            <>
                              <LakeHeading level={2} variant="h3" color={colors.gray[900]}>
                                {t("accountClose.closeAccount")}
                              </LakeHeading>

                              <Space height={12} />

                              <View style={styles.accountInfoRow}>
                                <View>
                                  <LakeText variant="smallRegular" color={colors.gray[500]}>
                                    {t("accountClose.accountHolder")}
                                  </LakeText>

                                  <LakeText variant="smallMedium" color={colors.gray[700]}>
                                    {account.holder.info.name}
                                  </LakeText>
                                </View>

                                <Space width={32} />

                                <View>
                                  <LakeText variant="smallRegular" color={colors.gray[500]}>
                                    {t("accountClose.accountName")}
                                  </LakeText>

                                  <LakeText variant="smallMedium" color={colors.gray[700]}>
                                    {account.name}
                                  </LakeText>
                                </View>
                              </View>

                              <Space height={32} />

                              {balance > 0 ? (
                                <>
                                  <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
                                    {t("accountClose.nextSteps")}
                                  </LakeHeading>

                                  <Space height={12} />
                                  <LakeText>{t("accountClose.twoSteps")}</LakeText>
                                  <Space height={24} />

                                  <FlowPresentation
                                    mode="mobile"
                                    steps={[
                                      {
                                        label: t("accountClose.steps.letUsKnowWhy"),
                                        icon: "question-circle-regular",
                                        isComplete: true,
                                      },
                                      {
                                        label: t("accountClose.steps.transferBalance"),
                                        icon: "arrow-swap-regular",
                                        isComplete: account.statusInfo.status === "Closing",
                                      },
                                    ]}
                                  />

                                  <Space height={48} />
                                </>
                              ) : null}

                              <AccountCloseReasonForm
                                accountId={accountId}
                                onCancel={() => setIsCancelled(true)}
                              />

                              <Space height={24} />
                            </>
                          ),
                        )
                        .with({ accountStatus: "Suspended" }, () => (
                          <WithCurrentColor variant="warning" style={styles.successContainer}>
                            <EmptyView
                              icon="lake-warning"
                              borderedIcon={true}
                              borderedIconPadding={24}
                              title={t("accountClose.suspended.title")}
                            >
                              <LakeButtonGroup>
                                <LakeButton
                                  href="https://support.swan.io/hc/requests/new"
                                  mode="secondary"
                                >
                                  {t("accountClose.negativeBalance.contactSupport")}
                                </LakeButton>
                              </LakeButtonGroup>
                            </EmptyView>
                          </WithCurrentColor>
                        ))
                        .otherwise(() => <ErrorView />)
                    }
                  </WizardLayout>
                </View>
              ) : (
                <WithCurrentColor variant="negative" style={styles.notLegalRepresentativeContainer}>
                  <EmptyView
                    icon="dismiss-circle-regular"
                    borderedIcon={true}
                    borderedIconPadding={20}
                    title={t("accountClose.notLegalRepresentative.title")}
                    subtitle={match(legalRepresentativeName)
                      .with(Option.P.Some(P.select()), legalRepresentativeName =>
                        t("accountClose.notLegalRepresentative.description.withName", {
                          legalRepresentativeName,
                          legalRepresentativeEmail: account.legalRepresentativeMembership.email,
                        }),
                      )
                      .otherwise(() => t("accountClose.notLegalRepresentative.description"))}
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
