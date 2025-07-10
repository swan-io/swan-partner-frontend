import { AsyncData, Future, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  breakpoints,
  invariantColors,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { Request } from "@swan-io/request";
import { validateIban } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { isValidElement, useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import logoSwan from "../assets/images/logo-swan.svg";
import {
  AddReceivedSepaDirectDebitB2bMandateDocument,
  AddReceivedSepaDirectDebitB2bMandateInfoDocument,
  AddReceivedSepaDirectDebitB2bMandateInput,
  SepaReceivedDirectDebitMandateSequence,
} from "../graphql/partner";
import { formatNestedMessage, languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import {
  validateMandateCreditorName,
  validateNullableRequired,
  validateReference,
  validateRequired,
} from "../utils/validations";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  base: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  baseFinalView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    marginHorizontal: "auto",
    maxWidth: 960,
    width: "100%",
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    minHeight: "100%",
  },
  logo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  centered: {
    marginHorizontal: "auto",
  },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  flex: {
    display: "flex",
  },
  link: {
    textDecorationLine: "underline",
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
  },
});

const COOKIE_REFRESH_INTERVAL = 30000; // 30s
const LOGO_MAX_HEIGHT = 40;
const LOGO_MAX_WIDTH = 180;

const languageOptions = languages.map(country => ({
  name: country.native,
  value: country.id,
}));

type Props = { accountId: string; resourceId: string | undefined; status: string | undefined };

export const AddReceivedSepaDirectDebitB2bMandate = ({ accountId, resourceId, status }: Props) => {
  const [data] = useQuery(AddReceivedSepaDirectDebitB2bMandateInfoDocument, {
    first: 1,
    accountId,
  });

  const [addReceivedSepaDirectDebitB2bMandate] = useMutation(
    AddReceivedSepaDirectDebitB2bMandateDocument,
  );

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

  const [isCanceled, setIsCanceled] = useState(false);
  const state = isCanceled
    ? "Canceled"
    : resourceId != null && status === "Accepted"
      ? "Success"
      : "Form";

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <View style={styles.base}>
          {match(data)
            .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
            .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
              <ErrorView error={error} />
            ))
            .with(
              AsyncData.P.Done(
                Result.P.Ok(
                  P.select({
                    user: P.nonNullable,
                  }),
                ),
              ),
              ({ user, projectInfo }) => {
                const accentColor = projectInfo.accentColor ?? invariantColors.defaultAccentColor;
                const projectName = projectInfo.name;
                const projectLogo = projectInfo.logoUri;

                return (
                  <WithPartnerAccentColor color={accentColor}>
                    <ScrollView contentContainerStyle={styles.content}>
                      <>
                        <Box direction="row" alignItems="center">
                          {state !== "Form" || user.accountMemberships.edges.length === 0 ? null : (
                            <LakeButton
                              ariaLabel={t("common.cancel")}
                              icon="dismiss-regular"
                              mode="tertiary"
                              onPress={() => {
                                setIsCanceled(true);
                              }}
                            >
                              {large ? t("common.cancel") : null}
                            </LakeButton>
                          )}

                          <Fill minWidth={16} />

                          <View style={styles.logo}>
                            <AutoWidthImage
                              ariaLabel={projectName}
                              sourceUri={projectLogo ?? logoSwan}
                              height={LOGO_MAX_HEIGHT}
                              maxWidth={LOGO_MAX_WIDTH}
                              resizeMode="contain"
                            />
                          </View>

                          <Fill minWidth={16} />

                          <View>
                            <LakeSelect
                              value={locale.language}
                              items={languageOptions}
                              hideErrors={true}
                              mode="borderless"
                              onValueChange={locale => {
                                setPreferredLanguage(locale);
                              }}
                            />
                          </View>
                        </Box>

                        <Space height={24} />

                        {match(user)
                          .with(
                            {
                              accountMemberships: {
                                edges: [
                                  {
                                    node: {
                                      canInitiatePayments: true,
                                      canViewAccount: true,
                                      account: P.select({
                                        holder: {
                                          info: {
                                            __typename: "AccountHolderCompanyInfo",
                                          },
                                        },
                                      }),
                                    },
                                  },
                                ],
                              },
                            },
                            account =>
                              match(state)
                                .with("Canceled", () => <IncompleteRegistrationView />)
                                .with("Success", () => <SuccessView />)
                                .with("Form", () => (
                                  <View>
                                    <Space height={32} />

                                    <LakeHeading level={1} variant="h3">
                                      {t("addReceivedSepaDirectDebitB2bMandate.title")}
                                    </LakeHeading>

                                    <Space height={8} />

                                    <LakeText>
                                      {formatNestedMessage(
                                        "addReceivedSepaDirectDebitB2bMandate.notice",
                                        {
                                          bold: text => (
                                            <LakeText variant="semibold">{text}</LakeText>
                                          ),
                                          list: chunk => (
                                            <View style={styles.flex}>
                                              <Space height={4} />
                                              <View role="list">{chunk}</View>
                                            </View>
                                          ),
                                          listitem: chunk =>
                                            Array.isArray(chunk) &&
                                            typeof isValidElement(chunk[0]) ? (
                                              <LakeText role="listitem" key={String(chunk[0])}>
                                                • {chunk[0]}
                                              </LakeText>
                                            ) : null,
                                          link: chunk =>
                                            Array.isArray(chunk) && typeof chunk[0] === "string" ? (
                                              <LakeText
                                                href="https://support.swan.io/hc/en-150/articles/19637943123101-SEPA-Direct-Debit-mandates"
                                                hrefAttrs={{ target: "blank" }}
                                                style={styles.link}
                                              >
                                                {chunk[0]}
                                                <Space width={4} />
                                                <Icon name="open-regular" size={16} />
                                              </LakeText>
                                            ) : null,
                                        },
                                      )}
                                    </LakeText>

                                    <Space height={24} />

                                    <Box direction="row">
                                      <LakeLabel
                                        label={t(
                                          "addReceivedSepaDirectDebitB2bMandate.accountHolder",
                                        )}
                                        render={() => (
                                          <LakeText>{account.holder.info.name}</LakeText>
                                        )}
                                      />

                                      <Space width={32} />

                                      <LakeLabel
                                        label={t(
                                          "addReceivedSepaDirectDebitB2bMandate.accountName",
                                        )}
                                        render={() => <LakeText>{account.name}</LakeText>}
                                      />
                                    </Box>

                                    <Space height={32} />

                                    <AddReceivedSepaDirectDebitB2bMandateForm
                                      onSubmit={input =>
                                        addReceivedSepaDirectDebitB2bMandate({
                                          input: {
                                            ...input,
                                            consentRedirectUrl: window.location.href,
                                          },
                                        })
                                          .mapOk(data => data.addReceivedSepaDirectDebitB2bMandate)
                                          .mapOkToResult(filterRejectionsToResult)
                                          .mapOkToResult(value =>
                                            match(value)
                                              .with(
                                                {
                                                  receivedDirectDebitMandate: {
                                                    statusInfo: {
                                                      __typename:
                                                        "ReceivedDirectDebitMandateStatusInfoConsentPending",
                                                      consent: { consentUrl: P.select() },
                                                    },
                                                  },
                                                },
                                                Result.Ok,
                                              )
                                              .otherwise(Result.Error),
                                          )
                                          .tapOk(consentUrl => {
                                            window.location.replace(consentUrl);
                                          })
                                          .tapError(error =>
                                            showToast({
                                              variant: "error",
                                              error,
                                              title: translateError(error),
                                            }),
                                          )
                                      }
                                    />
                                  </View>
                                ))
                                .exhaustive(),
                          )
                          .otherwise(() => (
                            <NoPermissionsView />
                          ))}
                      </>
                    </ScrollView>
                  </WithPartnerAccentColor>
                );
              },
            )
            .otherwise(() => (
              <NoPermissionsView />
            ))}
        </View>
      )}
    </ResponsiveContainer>
  );
};

type FormValues = {
  mandateReference: string;
  creditorName: string;
  creditorIdentifier: string;
  iban: string;
  sequence: SepaReceivedDirectDebitMandateSequence | undefined;
  name: string;
};

type FormProps = {
  onSubmit: (
    values: Omit<AddReceivedSepaDirectDebitB2bMandateInput, "consentRedirectUrl">,
  ) => Future<unknown>;
};

const AddReceivedSepaDirectDebitB2bMandateForm = ({ onSubmit }: FormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { Field, submitForm } = useForm<FormValues>({
    mandateReference: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateReference),
    },
    creditorName: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateMandateCreditorName),
    },
    creditorIdentifier: {
      initialValue: "",
      validate: validateRequired,
    },
    iban: {
      initialValue: "",
      sanitize: electronicFormat,
      validate: combineValidators(validateRequired, validateIban),
    },
    sequence: {
      initialValue: undefined,
      validate: validateNullableRequired,
    },
    name: {
      initialValue: "",
    },
  });

  const onPressSubmit = useCallback(() => {
    submitForm({
      onSuccess: ({ name, ...values }) => {
        Option.allFromDict({
          ...values,
          sequence: values.sequence.flatMap(Option.fromNullable),
        }).tapSome(values => {
          setIsLoading(true);
          onSubmit({ ...values, name: name.toNull() }).tap(() => setIsLoading(false));
        });
      },
    });
  }, [onSubmit, submitForm]);

  return (
    <View>
      <Field name="mandateReference">
        {({ value, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.mandateReference")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                ref={ref}
                id={id}
                value={value}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
                help={t("addReceivedSepaDirectDebitB2bMandate.form.mandateReference.help")}
              />
            )}
          />
        )}
      </Field>

      <Field name="creditorName">
        {({ value, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.creditorName")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                ref={ref}
                id={id}
                value={value}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="creditorIdentifier">
        {({ value, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.creditorIdentifier")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                ref={ref}
                id={id}
                value={value}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="iban">
        {({ value, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.iban")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                ref={ref}
                id={id}
                value={value}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="sequence">
        {({ value, error, onChange }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.sequence")}
            render={() => (
              <>
                <Space height={8} />

                <RadioGroup
                  direction="row"
                  disabled={isLoading}
                  value={value}
                  error={error}
                  items={[
                    {
                      name: t("addReceivedSepaDirectDebitB2bMandate.form.sequence.Recurrent"),
                      value: "Recurrent",
                    },
                    {
                      name: t("addReceivedSepaDirectDebitB2bMandate.form.sequence.OneOff"),
                      value: "OneOff",
                    },
                  ]}
                  onValueChange={onChange}
                />
              </>
            )}
          />
        )}
      </Field>

      <Field name="name">
        {({ value, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("addReceivedSepaDirectDebitB2bMandate.form.name")}
            optionalLabel={t("form.optional")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                ref={ref}
                id={id}
                value={value}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <LakeButtonGroup>
        <LakeButton color="current" onPress={onPressSubmit} loading={isLoading}>
          {t("addReceivedSepaDirectDebitB2bMandate.form.submit")}
        </LakeButton>
      </LakeButtonGroup>
    </View>
  );
};

import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { electronicFormat } from "iban";

const NoPermissionsView = () => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.baseFinalView}>
      <BorderedIcon color="negative" name="lake-error" size={100} padding={24} />
      <Space height={24} />

      <LakeHeading level={1} variant="h3" align="center">
        {t("addReceivedSepaDirectDebitB2bMandate.permissionError.title")}
      </LakeHeading>

      <Space height={4} />
      <LakeText variant="smallRegular">
        {t("addReceivedSepaDirectDebitB2bMandate.permissionError.description")}
      </LakeText>
    </Box>
  );
};

const IncompleteRegistrationView = () => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.baseFinalView}>
      <BorderedIcon color="current" name="lake-receipt" size={100} />
      <Space height={24} />

      <LakeHeading level={1} variant="h3" align="center">
        {t("addReceivedSepaDirectDebitB2bMandate.incompleteRegistration.title")}
      </LakeHeading>

      <Space height={4} />
      <LakeText variant="smallRegular">
        {t("addReceivedSepaDirectDebitB2bMandate.incompleteRegistration.description")}
      </LakeText>
    </Box>
  );
};

const SuccessView = () => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.baseFinalView}>
      <BorderedIcon color="positive" name="lake-check" size={100} padding={24} />
      <Space height={24} />

      <LakeHeading level={1} variant="h3" align="center">
        {t("addReceivedSepaDirectDebitB2bMandate.success.title")}
      </LakeHeading>

      <Space height={4} />
      <LakeText variant="smallRegular">
        {t("addReceivedSepaDirectDebitB2bMandate.success.description")}
      </LakeText>
    </Box>
  );
};
