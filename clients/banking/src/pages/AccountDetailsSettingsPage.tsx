import { Dict } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile, TileGrid } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotEmpty, isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { getTermsAndConditionsPathByAccountCountryAndLocale } from "@swan-io/shared-business/src/constants/termsAndConditions";
import { ReactNode, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { useMutation } from "urql";
import {
  AccountDetailsSettingsPageDocument,
  AccountLanguage,
  UpdateCompanyAccountDocument,
  UpdateIndividualAccountDocument,
} from "../graphql/partner";
import { env } from "../utils/env";
import { locale, t } from "../utils/i18n";
import { parseOperationResult, useQueryWithErrorBoundary } from "../utils/urql";
import {
  validateAccountNameLength,
  validateRequired,
  validateVatNumber,
} from "../utils/validations";
import { NotFoundPage } from "./NotFoundPage";

const styles = StyleSheet.create({
  tile: {
    ...commonStyles.fill,
  },
  link: {
    display: "flex",
    transitionProperty: "opacity",
    transitionDuration: "150ms",
  },
  linkPressed: {
    opacity: 0.7,
  },
});

const Contract = ({ children, to }: { children: ReactNode; to: string }) => (
  <Link
    target="blank"
    to={to}
    style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
  >
    <Tile paddingVertical={24} style={styles.tile}>
      <Box direction="row" alignItems="center">
        <Icon name="lake-document-pdf" color={colors.gray[900]} size={24} />
        <Space width={24} />

        <LakeHeading variant="h5" level={3}>
          {children}
        </LakeHeading>

        <Fill minWidth={24} />
        <Icon name="open-regular" color={colors.gray[900]} size={24} />
      </Box>
    </Tile>
  </Link>
);

type Props = {
  projectName: string;
  accountId: string;
  canManageAccountMembership: boolean;
};

export const AccountDetailsSettingsPage = ({
  // projectName,
  accountId,
  canManageAccountMembership,
}: Props) => {
  const [
    {
      data: { account },
    },
  ] = useQueryWithErrorBoundary({
    query: AccountDetailsSettingsPageDocument,
    variables: { accountId },
  });

  const [, updateIndividualAccount] = useMutation(UpdateIndividualAccountDocument);
  const [, updateCompanyAccount] = useMutation(UpdateCompanyAccountDocument);

  const holderInfo = account?.holder.info;
  const isCompany = holderInfo?.__typename === "AccountHolderCompanyInfo";

  const { Field, formStatus, submitForm, resetForm } = useForm<{
    accountName: string;
    language: AccountLanguage;
    vatNumber: string;
  }>({
    accountName: {
      initialValue: account?.name ?? "",
      sanitize: value => value.trim(),
      validate: combineValidators(validateRequired, validateAccountNameLength),
    },
    language: {
      initialValue: account?.language ?? "en",
      strategy: "onChange",
      validate: validateRequired,
    },
    vatNumber: {
      initialValue: isCompany && isNotNullish(holderInfo.vatNumber) ? holderInfo.vatNumber : "",
      sanitize: value => value.trim(),
      validate: value => {
        if (isNotEmpty(value)) {
          return validateVatNumber(value);
        }
      },
    },
  });

  const countries: Item<AccountLanguage>[] = useMemo(() => {
    const map: Record<AccountLanguage, { name: string; cca3: CountryCCA3 }> = {
      de: { name: "Deutsch", cca3: "DEU" },
      en: { name: "English", cca3: "USA" },
      es: { name: "Español", cca3: "ESP" },
      fr: { name: "Français", cca3: "FRA" },
      it: { name: "Italiano", cca3: "ITA" },
      nl: { name: "Nederlands", cca3: "NLD" },
    };

    return Dict.entries(map).map(([value, { name }]) => ({
      value,
      name,
    }));
  }, []);

  if (isNullish(account) || isNullish(holderInfo)) {
    return <NotFoundPage />;
  }

  const { statusInfo } = account;
  const accountClosed = statusInfo.status === "Closing" || statusInfo.status === "Closed";
  const formDisabled = !canManageAccountMembership || accountClosed;

  return (
    <View>
      <LakeHeading level={2} variant="h4">
        {t("accountDetails.title.details")}
      </LakeHeading>

      <Space height={12} />

      {accountClosed && (
        <>
          <LakeAlert variant="warning" title={t("accountDetails.alert.accountClosed")} />
          <Space height={20} />
        </>
      )}

      <Tile paddingVertical={24}>
        <LakeLabel
          label={t("accountDetails.settings.accountNameLabel")}
          render={id => (
            <Field name="accountName">
              {({ error, onBlur, onChange, valid, value }) => (
                <LakeTextInput
                  id={id}
                  placeholder={t("accountDetails.settings.accountNamePlaceholder")}
                  disabled={formDisabled}
                  readOnly={formDisabled}
                  error={error}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  valid={valid}
                />
              )}
            </Field>
          )}
        />

        {isCompany && (
          <>
            <LakeLabel
              label={t("accountDetails.settings.vatLabel")}
              render={id => (
                <Field name="vatNumber">
                  {({ error, onBlur, onChange, valid, value }) => (
                    <LakeTextInput
                      id={id}
                      disabled={formDisabled}
                      readOnly={formDisabled}
                      error={error}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      valid={isNotEmpty(value) ? valid : undefined}
                    />
                  )}
                </Field>
              )}
            />

            <LakeLabel
              label={t("accountDetails.settings.companyRegistrationNumber")}
              render={id => (
                <LakeTextInput
                  id={id}
                  placeholder={t("common.empty")}
                  disabled={true}
                  readOnly={true}
                  value={holderInfo.registrationNumber ?? ""}
                />
              )}
            />
          </>
        )}

        <LakeLabel
          label={t("accountDetails.settings.language")}
          render={id => (
            <Field name="language">
              {({ onChange, value }) => (
                <LakeSelect
                  id={id}
                  disabled={formDisabled}
                  readOnly={formDisabled}
                  items={countries}
                  hideErrors={true}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            </Field>
          )}
        />

        <Space height={8} />
        <LakeText>{t("accountDetails.settings.languageDescription")}</LakeText>
      </Tile>

      <Space height={32} />

      <LakeHeading level={2} variant="h4">
        {t("accountDetails.title.contracts")}
      </LakeHeading>

      <Space height={12} />
      <LakeText>{t("accountDetails.settings.contractsDescription")}</LakeText>
      <Space height={12} />

      <TileGrid>
        <Contract
          to={getTermsAndConditionsPathByAccountCountryAndLocale({
            accountCountry: account.country,
            locale: locale.language,
            rootUrl: env.SWAN_TCU_BASE_URL,
          })}
        >
          {t("accountDetails.swanTermsAndConditions")}
        </Contract>

        {/* <Contract to="#">{t("accountDetails.settings.partnershipConditions", { projectName })}</Contract> */}
      </TileGrid>

      {!formDisabled && (
        <LakeButtonGroup>
          <LakeButton
            color="partner"
            loading={formStatus === "submitting"}
            onPress={() => {
              submitForm(values => {
                if (hasDefinedKeys(values, ["accountName", "language"])) {
                  const { accountName, language, vatNumber } = values;

                  if (isNotNullish(vatNumber)) {
                    return updateCompanyAccount({
                      updateAccountInput: {
                        accountId,
                        name: accountName,
                        language,
                      },
                      updateAccountHolderInput: {
                        accountHolderId: account.holder.id,
                        vatNumber,
                      },
                    })
                      .then(parseOperationResult)
                      .then(data => {
                        resetForm({ feedbackOnly: true });

                        if (data.updateAccount.__typename !== "UpdateAccountSuccessPayload") {
                          return Promise.reject(data.updateAccount.__typename);
                        }

                        if (
                          data.updateAccountHolder.__typename !==
                          "UpdateAccountHolderSuccessPayload"
                        ) {
                          return Promise.reject(data.updateAccountHolder.__typename);
                        }

                        return data;
                      })
                      .catch(() => {
                        showToast({ variant: "error", title: t("error.generic") });
                      });
                  } else {
                    return updateIndividualAccount({
                      input: {
                        accountId,
                        name: accountName,
                        language,
                      },
                    })
                      .then(parseOperationResult)
                      .then(data => {
                        resetForm({ feedbackOnly: true });

                        return data.updateAccount.__typename !== "UpdateAccountSuccessPayload"
                          ? Promise.reject(data.__typename)
                          : data;
                      })
                      .catch(() => {
                        showToast({ variant: "error", title: t("error.generic") });
                      });
                  }
                }
              });
            }}
          >
            {t("accountDetails.settings.save")}
          </LakeButton>

          {/* <LakeButton icon="subtract-circle-regular" mode="secondary" color="negative">
          Close account
        </LakeButton> */}
        </LakeButtonGroup>
      )}
    </View>
  );
};
