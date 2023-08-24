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
import {
  isNotEmpty,
  isNotNullish,
  isNullish,
  isNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import {
  validateCompanyTaxNumber,
  validateIndividualTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { ReactNode, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, toOptionalValidator, useForm } from "react-ux-form";
import { useMutation } from "urql";
import {
  AccountDetailsSettingsPageDocument,
  AccountLanguage,
  UpdateAccountDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
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

  const accountCountry = account?.country ?? "FRA";

  const [, updateAccount] = useMutation(UpdateAccountDocument);

  const holderInfo = account?.holder.info;
  const isCompany = holderInfo?.__typename === "AccountHolderCompanyInfo";

  const { Field, formStatus, submitForm } = useForm<{
    accountName: string;
    language: AccountLanguage;
    vatNumber: string;
    taxIdentificationNumber: string;
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
      validate: toOptionalValidator(validateVatNumber),
    },
    taxIdentificationNumber: {
      initialValue: holderInfo?.taxIdentificationNumber ?? "",
      sanitize: value => value.trim(),
      validate:
        account?.country === "NLD"
          ? combineValidators(validateRequired, validateIndividualTaxNumber(accountCountry))
          : isCompany
          ? validateCompanyTaxNumber(accountCountry)
          : validateIndividualTaxNumber(accountCountry),
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
  const shouldEditTaxIdentificationNumber =
    (account.country === "DEU" && account.holder.residencyAddress.country === "DEU") ||
    account.country === "NLD";
  const isTaxIdentificationRequired = account.country === "NLD";

  const tcuUrl = account.holder.onboarding?.tcuUrl;

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
        )}

        {shouldEditTaxIdentificationNumber && (
          <>
            <Field name="taxIdentificationNumber">
              {({ error, onBlur, onChange, valid, value }) => (
                <TaxIdentificationNumberInput
                  label={
                    account.country === "NLD"
                      ? t("accountDetails.settings.legalRepresentativeTaxIdentificationNumber")
                      : undefined
                  }
                  value={value}
                  error={error}
                  valid={valid}
                  disabled={formDisabled}
                  onChange={onChange}
                  onBlur={onBlur}
                  accountCountry={accountCountry}
                  isCompany={isCompany}
                  required={isTaxIdentificationRequired}
                />
              )}
            </Field>

            <Space height={12} />
          </>
        )}

        {shouldEditTaxIdentificationNumber &&
          isNullishOrEmpty(holderInfo?.taxIdentificationNumber) &&
          !isTaxIdentificationRequired && (
            <>
              <LakeAlert
                variant="info"
                title={t("accountDetails.settings.taxIdentificationNumberInfo")}
              />

              <Space height={20} />
            </>
          )}

        {isCompany && (
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

      {isNotNullish(tcuUrl) ? (
        <TileGrid>
          <Contract to={tcuUrl}>{t("accountDetails.swanTermsAndConditions")}</Contract>

          {/* <Contract to="#">{t("accountDetails.settings.partnershipConditions", { projectName })}</Contract> */}
        </TileGrid>
      ) : null}

      {!formDisabled && (
        <LakeButtonGroup>
          <LakeButton
            color="partner"
            loading={formStatus === "submitting"}
            onPress={() => {
              submitForm(values => {
                if (hasDefinedKeys(values, ["accountName", "language"])) {
                  const { accountName, language, vatNumber, taxIdentificationNumber } = values;

                  return updateAccount({
                    updateAccountInput: {
                      accountId,
                      name: accountName,
                      language,
                    },
                    updateAccountHolderInput: {
                      accountHolderId: account.holder.id,
                      vatNumber,
                      taxIdentificationNumber,
                    },
                  })
                    .then(parseOperationResult)
                    .then(data => {
                      if (data.updateAccount.__typename !== "UpdateAccountSuccessPayload") {
                        return Promise.reject(data.updateAccount.__typename);
                      }

                      if (
                        data.updateAccountHolder.__typename !== "UpdateAccountHolderSuccessPayload"
                      ) {
                        return Promise.reject(data.updateAccountHolder.__typename);
                      }

                      return data;
                    })
                    .catch(() => {
                      showToast({ variant: "error", title: t("error.generic") });
                    });
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
