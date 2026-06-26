import { Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { getCCA2forCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { CardPageQuery, UpdateCardDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { formatNestedMessage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  deriveSingleUseSpendingLimitValue,
  singleUseToSpendingLimitValue,
  validateSingleUseSpendingLimit,
} from "../utils/singleUseSpendingLimit";
import { deriveSpendingLimitContext, getSpendingLimitAmountError } from "../utils/spendingLimit";
import { CardCancelConfirmationModal } from "./CardCancelConfirmationModal";
import {
  deriveSpendingLimitInput,
  deriveSpendingLimitValue,
  SpendingLimitForm,
  SpendingLimitFormValue,
  SpendingLimitValidationError,
  SpendingLimitValue,
  validateSpendingLimit,
} from "./CardItemSpendingLimit";
import { CardSettings, CardSettingsFields } from "./CardSettingsFields";
import {
  SingleUseSpendingLimitFields,
  SingleUseSpendingLimitFieldsValue,
} from "./SingleUseSpendingLimitFields";

const styles = StyleSheet.create({
  link: {
    color: colors.current.primary,
    display: "inline-block",
  },
  box: { width: "50%" },
});

type Card = NonNullable<CardPageQuery["card"]>;

type Props = {
  card: Card;
  cardId: string;
  accountMembershipId: string;
};

export const CardItemSettings = ({ cardId, accountMembershipId, card }: Props) => {
  const [updateCard, cardUpdate] = useMutation(UpdateCardDocument);
  const [isCancelConfirmationModalVisible, setIsCancelConfirmationModalVisible] = useState(false);
  const accountHolder = card.accountMembership.account?.holder;
  const spendingLimits = card.spendingLimits ?? [];
  const initialSpendingLimit = deriveSpendingLimitValue(spendingLimits);
  const maxSpendingLimit = spendingLimits.find(
    item => item.type === "Partner" && item.period === "Monthly",
  );
  // Single-use cards have no feature toggles, but UpdateCardInput requires them: these are the
  // card's current values, used both to seed the settings form (regular) and to preserve them on
  // save (single-use).
  const cardToggles = {
    eCommerce: card.eCommerce ?? false,
    withdrawal: card.withdrawal ?? false,
    international: card.international ?? false,
    nonMainCurrencyTransactions: card.nonMainCurrencyTransactions ?? false,
  };
  const cardInsurance = card.insuranceSubscription;
  const cardHolderType = card.accountMembership.account?.holder.info.type;

  const { canUpdateCard } = usePermissions();

  const { maxValue, currency } = deriveSpendingLimitContext(
    card.cardProduct,
    accountHolder,
    maxSpendingLimit,
  );

  // Draft state owned here; the form children are fully controlled (value/onChange only).
  const [spendingLimit, setSpendingLimit] = useState<SpendingLimitFormValue>(
    () =>
      initialSpendingLimit ?? {
        amount: { value: String(maxValue), currency },
        mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
      },
  );
  const [settings, setSettings] = useState<CardSettings>(() => ({
    cardName: card.name ?? "",
    ...cardToggles,
  }));
  const [singleUse, setSingleUse] = useState<SingleUseSpendingLimitFieldsValue>(() => ({
    spendingLimit: deriveSingleUseSpendingLimitValue(spendingLimits) ?? {
      amount: { value: String(maxValue), currency },
      period: "Always",
    },
    cardName: card.name ?? "",
  }));
  const [validation, setValidation] = useState<SpendingLimitValidationError[]>([]);

  const spendingLimitError = getSpendingLimitAmountError(validation, maxValue, currency);

  const submitUpdate = (
    spendingLimit: SpendingLimitValue,
    cardName: string | undefined,
    settings: {
      eCommerce: boolean;
      withdrawal: boolean;
      international: boolean;
      nonMainCurrencyTransactions: boolean;
    },
  ) => {
    updateCard({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin + Router.AccountCardsItemSettings({ cardId, accountMembershipId }),
        spendingLimit: deriveSpendingLimitInput(spendingLimit),
        name: cardName,
        eCommerce: settings.eCommerce,
        withdrawal: settings.withdrawal,
        international: settings.international,
        nonMainCurrencyTransactions: settings.nonMainCurrencyTransactions,
      },
    })
      .mapOk(data => data.updateCard)
      .mapOkToResult(data => (isNotNullish(data) ? Result.Ok(data) : Result.Error(undefined)))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  // Single Save: validate the relevant form, then fire one update. No ref chaining.
  const onPressSubmit = () => {
    if (card.type === "SingleUseVirtual") {
      validateSingleUseSpendingLimit(singleUse.spendingLimit, maxValue).match({
        Ok: value => {
          setValidation([]);
          submitUpdate(singleUseToSpendingLimitValue(value), singleUse.cardName, cardToggles);
        },
        Error: errors => setValidation(errors),
      });
    } else {
      validateSpendingLimit(spendingLimit, maxValue).match({
        Ok: value => {
          setValidation([]);
          submitUpdate(value, settings.cardName, {
            eCommerce: settings.eCommerce,
            withdrawal: settings.withdrawal,
            international: settings.international,
            nonMainCurrencyTransactions: settings.nonMainCurrencyTransactions,
          });
        },
        Error: errors => setValidation(errors),
      });
    }
  };

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ small, large }) => (
        <>
          {card.accountMembership.canManageCards ? null : (
            <>
              <LakeAlert title={t("card.settings.notAllowed")} variant="info" />
              <Space height={24} />
            </>
          )}

          {card.type === "SingleUseVirtual" ? (
            <SingleUseSpendingLimitFields
              value={singleUse}
              onChange={next => {
                setSingleUse(next);
                if (validation.length > 0) {
                  validateSingleUseSpendingLimit(next.spendingLimit, maxValue).match({
                    Ok: () => setValidation([]),
                    Error: errors => setValidation(errors),
                  });
                }
              }}
              error={spendingLimitError}
              canEditPeriodicity={false}
              disabled={!canUpdateCard}
            />
          ) : (
            <>
              <Tile title={large ? t("card.settings.spendingLimit") : undefined}>
                <SpendingLimitForm
                  large={large}
                  value={spendingLimit}
                  onChange={next => {
                    setSpendingLimit(next);
                    validateSpendingLimit(next, maxValue).match({
                      Ok: () => setValidation([]),
                      Error: errors => setValidation(errors),
                    });
                  }}
                  disabled={!canUpdateCard}
                  error={spendingLimitError}
                />
              </Tile>

              <Space height={24} />

              <CardSettingsFields
                value={settings}
                onChange={setSettings}
                disabled={!canUpdateCard}
              />
            </>
          )}

          <Space height={24} />

          {canUpdateCard && (
            <>
              <LakeButtonGroup>
                <LakeButton
                  color="current"
                  onPress={onPressSubmit}
                  loading={cardUpdate.isLoading()}
                >
                  {t("common.save")}
                </LakeButton>

                {match(card.statusInfo)
                  .with(
                    {
                      __typename: P.not(
                        P.union("CardCanceledStatusInfo", "CardCancelingStatusInfo"),
                      ),
                    },
                    () => (
                      <LakeButton
                        color="negative"
                        mode="secondary"
                        icon="subtract-circle-regular"
                        onPress={() => setIsCancelConfirmationModalVisible(true)}
                      >
                        {t("card.cancel.cancelCard")}
                      </LakeButton>
                    ),
                  )
                  .otherwise(() => (
                    <View />
                  ))}
              </LakeButtonGroup>

              <CardCancelConfirmationModal
                cardId={cardId}
                onPressClose={() => setIsCancelConfirmationModalVisible(false)}
                visible={isCancelConfirmationModalVisible}
                onSuccess={() => {
                  setIsCancelConfirmationModalVisible(false);
                  Router.push("AccountCardsList", { accountMembershipId });
                }}
              />
            </>
          )}

          <Box direction={large && cardHolderType === "Company" ? "row" : "column"}>
            {cardInsurance != null &&
              cardInsurance.package.noticeUrl != null &&
              cardHolderType === "Company" && (
                <Box style={small ? undefined : styles.box}>
                  <>
                    <Box direction="row" alignItems="center">
                      <Icon name="shield-checkmark-regular" size={16} color={colors.gray[500]} />
                      <Space width={8} />

                      <LakeText align="center" variant="smallSemibold">
                        {match(cardInsurance.package)
                          .with({ level: "Basic" }, { level: "Standard" }, () =>
                            t("cardDetail.insurance.description.basic"),
                          )
                          .with({ level: "Essential" }, () =>
                            t("cardDetail.insurance.description.essential"),
                          )
                          .with({ level: "Premium" }, () =>
                            t("cardDetail.insurance.description.premium"),
                          )
                          .otherwise(() => null)}
                      </LakeText>
                    </Box>
                    <Space height={8} />

                    <LakeText variant="smallRegular">
                      <Link style={styles.link} to={cardInsurance.package.noticeUrl} target="blank">
                        <Box direction="row" alignItems="center">
                          <LakeText color={colors.current.primary} variant="smallRegular">
                            {t("cardDetail.insurance.link")}
                          </LakeText>

                          <Space width={4} />
                          <Icon color={colors.current.primary} name="open-filled" size={16} />
                        </Box>
                      </Link>
                    </LakeText>

                    <Space height={8} />
                    <LakeText variant="smallRegular">
                      <Link style={styles.link} to={cardInsurance.claimsUrl} target="blank">
                        <Box direction="row" alignItems="center">
                          <LakeText color={colors.current.primary} variant="smallRegular">
                            {t("cardDetail.insurance.claim")}
                          </LakeText>

                          <Space width={4} />
                          <Icon color={colors.current.primary} name="open-filled" size={16} />
                        </Box>
                      </Link>
                    </LakeText>
                  </>
                </Box>
              )}

            <Box style={small ? undefined : styles.box}>
              {match({
                type: accountHolder?.info.type,
                country: isCountryCCA3(card.issuingCountry)
                  ? getCCA2forCCA3(card.issuingCountry)?.toLowerCase()
                  : undefined,
              })
                .with({ type: "Company", country: P.nonNullable }, ({ country }) => (
                  <>
                    <Box direction="row" alignItems="center">
                      <Icon name="gift-regular" size={16} color={colors.gray[500]} />
                      <Space width={8} />

                      <LakeText align="center" variant="smallSemibold">
                        {t("cardDetail.mastercardBonuses")}
                      </LakeText>
                    </Box>

                    <Space height={8} />

                    <LakeText variant="smallRegular">
                      {formatNestedMessage("card.mastercardBonusProgramLink", {
                        learnMoreLink: (
                          <>
                            <Link
                              style={styles.link}
                              to={`https://www.mastercard.com/businessbonus/${country}/home`}
                              target="blank"
                            >
                              <Box direction="row" alignItems="center">
                                <LakeText color={colors.current.primary} variant="smallRegular">
                                  {t("common.learnMore")}
                                </LakeText>

                                <Space width={4} />
                                <Icon color={colors.current.primary} name="open-filled" size={16} />
                              </Box>
                            </Link>
                          </>
                        ),
                      })}
                    </LakeText>
                  </>
                ))
                .otherwise(() => null)}
            </Box>
          </Box>
        </>
      )}
    </ResponsiveContainer>
  );
};
