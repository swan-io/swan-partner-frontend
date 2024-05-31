import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { QuickActions } from "@swan-io/lake/src/components/QuickActions";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { Svg } from "@swan-io/lake/src/components/Svg";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { pick } from "@swan-io/lake/src/utils/object";
import { ChoicePicker } from "@swan-io/shared-business/src/components/ChoicePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  CountryCCA3,
  allCountries,
  getCountryName,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { combineValidators, useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import cardIdentifier from "../assets/images/card-identifier.svg";
import physicalCardPlaceholder from "../assets/images/physical-card-placeholder.svg";
import {
  ActivatePhysicalCardDocument,
  AddressInfo,
  CancelPhysicalCardDocument,
  CancelPhysicalCardReason,
  CardPageDocument,
  CardPageQuery,
  CompleteAddressInput,
  ConfirmPhysicalCardRenewalDocument,
  IdentificationFragment,
  PrintPhysicalCardDocument,
  ResumePhysicalCardDocument,
  SuspendPhysicalCardDocument,
  ViewPhysicalCardNumbersDocument,
  ViewPhysicalCardPinDocument,
} from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { partnerClient } from "../utils/gql";
import { formatCurrency, locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  validateAddressLine,
  validateNullableRequired,
  validateRequired,
} from "../utils/validations";
import { CardItemIdentityVerificationGate } from "./CardItemIdentityVerificationGate";
import { MaskedCard } from "./MaskedCard";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  card: {
    maxWidth: 390,
    width: "100%",
    alignSelf: "center",
    paddingTop: 16,
  },
  cardPlaceholder: {
    width: "100%",
    paddingBottom: "65%",
  },
  cardPlaceholderBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardPlaceholderText: {
    ...StyleSheet.absoluteFillObject,
    paddingLeft: "14%",
    paddingBottom: "14%",
    justifyContent: "flex-end",
  },
  cardIdentifier: {
    paddingBottom: "30%",
    width: "50%",
    marginHorizontal: "auto",
  },
  physicalCardContainer: {
    position: "relative",
    perspective: "200px",
    perspectiveOrigin: "50% 50%",
  },
  physicalCardFront: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
    transitionProperty: "transform",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },
  physicalCardRenewedBehind: {
    zIndex: 0,
    transform: "translateZ(0) translateX(30%) scale(0.6, 0.75) rotateY(-10deg)",
  },
  physicalCardPreviousBehind: {
    zIndex: 0,
    transform: "translateZ(0) translateX(-30%) scale(0.6, 0.75) rotateY(10deg)",
  },
  physicalCardItem: { width: "100%", height: "auto" },
  shippingAddressAlert: {
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0.8,
    borderColor: colors.gray[100],
  },
  shippingAddressTile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  spendingContainer: {
    ...commonStyles.fill,
    alignSelf: "stretch",
  },
  spendingLimitText: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  progress: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gray[100],
    width: "100%",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 1,
  },
  trackingNumber: {
    ...commonStyles.fill,
  },
  renewAlert: {
    width: "100%",
  },
  renewAlertCta: {
    width: "fit-content",
  },
  dotIndicatorsContainer: {
    marginHorizontal: "auto",
  },
  dotIndicator: {
    height: 6,
    width: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  dotIndicatorActive: {
    backgroundColor: colors.gray[500],
  },
});

const DotIndicator = ({ active, onPress }: { active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.dotIndicator, active && styles.dotIndicatorActive]} />
);

type Card = NonNullable<CardPageQuery["card"]>;

type Address = {
  addressLine1?: string | null | undefined;
  addressLine2?: string | null | undefined;
  city?: string | null | undefined;
  country?: string | null | undefined;
  postalCode?: string | null | undefined;
  state?: string | null | undefined;
};

type CardItemPhysicalShippingFormProps = {
  initialAddress?: Address;
  mode?: "order" | "renewal";
  onPressClose: () => void;
  onSubmit: (input: CompleteAddressInput) => void;
  isLoading: boolean;
};

const CardItemPhysicalShippingForm = ({
  initialAddress,
  mode = "order",
  onPressClose,
  onSubmit,
  isLoading,
}: CardItemPhysicalShippingFormProps) => {
  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
    addressLine1: {
      initialValue: initialAddress?.addressLine1 ?? "",
      validate: combineValidators(validateRequired, validateAddressLine),
    },
    addressLine2: {
      initialValue: initialAddress?.addressLine2 ?? "",
    },
    postalCode: {
      initialValue: initialAddress?.postalCode ?? "",
      validate: validateRequired,
    },
    city: {
      initialValue: initialAddress?.city ?? "",
      validate: validateRequired,
    },
    country: {
      initialValue: (initialAddress?.country as CountryCCA3) ?? "FRA",
      validate: validateRequired,
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(
          pick(values, ["addressLine1", "city", "country", "postalCode"]),
        );

        if (option.isSome()) {
          onSubmit({
            ...option.get(),
            addressLine2: values.addressLine2
              .flatMap(value => Option.fromNullable(nullishOrEmptyToUndefined(value)))
              .toUndefined(),
          });
        }
      },
    });
  };

  return (
    <>
      <Field name="country">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.country")}
            render={id => (
              <CountryPicker
                readOnly={isLoading}
                id={id}
                ref={ref}
                error={error}
                value={value}
                placeholder={t("members.form.address.countryPlaceholder")}
                countries={allCountries}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <FieldsListener names={["country"]}>
        {({ country }) => {
          return (
            <Field name="addressLine1">
              {({ value, error, onChange }) => (
                <LakeLabel
                  label={t("card.physical.order.shippingAddress.addressLine1")}
                  render={id => (
                    <PlacekitAddressSearchInput
                      apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                      country={country.value}
                      value={value}
                      onValueChange={onChange}
                      onSuggestion={suggestion => {
                        setFieldValue("addressLine1", suggestion.completeAddress);
                        setFieldValue("city", suggestion.city);
                        setFieldValue("postalCode", suggestion.postalCode ?? "");
                      }}
                      language={locale.language}
                      placeholder={t("addressInput.placeholder")}
                      emptyResultText={t("common.noResults")}
                      error={error}
                      id={id}
                      disabled={isLoading}
                    />
                  )}
                />
              )}
            </Field>
          );
        }}
      </FieldsListener>

      <Field name="addressLine2">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.addressLine2")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="postalCode">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.postalCode")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <Field name="city">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("card.physical.order.shippingAddress.city")}
            render={id => (
              <LakeTextInput
                readOnly={isLoading}
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        )}
      </Field>

      <LakeButtonGroup>
        <LakeButton mode="secondary" grow={true} onPress={onPressClose} disabled={isLoading}>
          {t("common.cancel")}
        </LakeButton>

        <LakeButton color="current" onPress={onPressSubmit} grow={true} loading={isLoading}>
          {mode === "renewal" ? t("common.update") : t("common.validate")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type CardItemPhysicalPermanentlyBlockProps = {
  initialAddress?: AddressInfo;
  onSubmit: (input: { reason: CancelPhysicalCardReason }) => void;
  isLoading: boolean;
};

const cancelReasons: { name: string; value: CancelPhysicalCardReason }[] = [
  { name: t("card.physical.cancel.reason.malfunction"), value: "Defected" },
  { name: t("card.physical.cancel.reason.lost"), value: "Lost" },
  { name: t("card.physical.cancel.reason.stolen"), value: "Stolen" },
  { name: t("card.physical.cancel.reason.neverReceived"), value: "NonReceived" },
];

const CardItemPhysicalPermanentlyBlockForm = ({
  onSubmit,
  isLoading,
}: CardItemPhysicalPermanentlyBlockProps) => {
  const { Field, submitForm } = useForm<{
    reason: CancelPhysicalCardReason | undefined;
  }>({
    reason: {
      initialValue: undefined,
      validate: validateNullableRequired,
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const reason = values.reason.flatMap(Option.fromUndefined);

        if (reason.isSome()) {
          onSubmit({ reason: reason.get() });
        }
      },
    });
  };

  return (
    <>
      <Field name="reason">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("card.physical.cancelConfirmation")}
            render={id => (
              <LakeSelect
                readOnly={isLoading}
                id={id}
                ref={ref}
                error={error}
                items={cancelReasons}
                value={value}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <LakeButtonGroup>
        <LakeButton color="negative" onPress={onPressSubmit} grow={true} loading={isLoading}>
          {t("card.physical.cancel")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type CardItemPhysicalActivationFormProps = {
  isLoading: boolean;
  onSubmit: ({ identifier }: { identifier: string }) => void;
};

const validateIdentifier = (value: string) => {
  // identifier is a 10 digits number
  if (!/^\d{10}$/.test(value)) {
    return t("card.physical.identifier.invalid");
  }
};

const CardItemPhysicalActivationForm = ({
  isLoading,
  onSubmit,
}: CardItemPhysicalActivationFormProps) => {
  const { Field, submitForm } = useForm({
    identifier: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateIdentifier),
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: ({ identifier }) => {
        if (identifier.isSome()) {
          onSubmit({ identifier: identifier.get() });
        }
      },
    });
  };

  return (
    <>
      <Field name="identifier">
        {({ value, valid, error, onChange, ref }) => (
          <LakeLabel
            label={t("card.physical.identifier")}
            render={id => (
              <LakeTextInput
                id={id}
                ref={ref}
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
              />
            )}
          />
        )}
      </Field>

      <LakeButtonGroup>
        <LakeButton color="current" onPress={onPressSubmit} loading={isLoading} grow={true}>
          {t("card.physical.activate")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type Props = {
  card: Card;
  projectId: string;
  cardId: string;
  accountMembershipId: string;
  isCurrentUserCardOwner: boolean;
  canManageAccountMembership: boolean;
  cardRequiresIdentityVerification: boolean;
  onRefreshRequest: () => void;
  onRefreshAccountRequest: () => void;
  lastRelevantIdentification: Option<IdentificationFragment>;
  physicalCardOrderVisible: boolean;
  hasBindingUserError: boolean;
};

export const CardItemPhysicalDetails = ({
  projectId,
  cardId,
  accountMembershipId,
  card,
  isCurrentUserCardOwner,
  canManageAccountMembership,
  cardRequiresIdentityVerification,
  onRefreshAccountRequest,
  lastRelevantIdentification,
  onRefreshRequest,
  physicalCardOrderVisible,
  hasBindingUserError,
}: Props) => {
  const { desktop } = useResponsive(breakpoints.medium);

  const [orderModalStatus, setOrderModalStatus] = useState<
    Option<
      | { type: "order"; initialShippingAddress?: Address }
      | { type: "renewal"; initialShippingAddress?: Address }
    >
  >(Option.None());
  const [isPermanentlyBlockModalOpen, setIsPermanentlyBlockModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  const [isTemporaryBlockModalOpen, setIsTemporaryBlockModalOpen] = useState(false);

  const initialShippingAddress =
    card.accountMembership.account?.holder.residencyAddress ?? undefined;

  const [confirmPhysicalCardRenewal, physicalCardRenewalConfirming] = useMutation(
    ConfirmPhysicalCardRenewalDocument,
  );
  const [printPhysicalCard, physicalCardPrinting] = useMutation(PrintPhysicalCardDocument);
  const [permanentlyBlockCard, permanentBlocking] = useMutation(CancelPhysicalCardDocument);
  const [suspendPhysicalCard, cardSuspension] = useMutation(SuspendPhysicalCardDocument);
  const [unsuspendPhysicalCard, cardUnsuspension] = useMutation(ResumePhysicalCardDocument);
  const [viewPhysicalCardPin, pinCardViewing] = useMutation(ViewPhysicalCardPinDocument);
  const [activatePhysicalCard, physicalCardActivation] = useMutation(ActivatePhysicalCardDocument);
  const [viewPhysicalCardNumbers, physicalCardNumberViewing] = useMutation(
    ViewPhysicalCardNumbersDocument,
  );

  const onConfirmingPhysicalCardRenewal = (address: CompleteAddressInput) => {
    confirmPhysicalCardRenewal({
      input: {
        address,
        cardId,
      },
    })
      .mapOk(data => data.confirmPhysicalCardRenewal)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        setOrderModalStatus(Option.None());
        partnerClient.query(CardPageDocument, { cardId });
      })
      .mapOk(data => data.physicalCard.identifier)
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const onShippingFormSubmit = (address: CompleteAddressInput) => {
    printPhysicalCard({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountCardsItemPhysicalCard({ cardId, accountMembershipId }),
        choosePin: false,
        address,
      },
    })
      .mapOk(data => data.printPhysicalCard)
      .mapOkToResult(filterRejectionsToResult)
      .mapOk(data => data.physicalCard.statusInfo)
      .tapOk(data => {
        match(data)
          .with(
            { __typename: "PhysicalCardConsentPendingStatusInfo" },
            ({ consent: { consentUrl } }) => {
              window.location.replace(consentUrl);
            },
          )
          .otherwise(() => {
            setOrderModalStatus(Option.Some({ type: "order", initialShippingAddress }));
            onRefreshRequest();
          });
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const onPermanentlyBlockFormSubmit = ({ reason }: { reason: CancelPhysicalCardReason }) => {
    permanentlyBlockCard({
      input: {
        cardId,
        reason,
      },
    })
      .mapOk(data => data.cancelPhysicalCard)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        setIsPermanentlyBlockModalOpen(false);
        onRefreshRequest();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const suspendCard = () => {
    suspendPhysicalCard({ cardId })
      .mapOk(data => data.suspendPhysicalCard)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        onRefreshRequest();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const unsuspendCard = () => {
    unsuspendPhysicalCard({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountCardsItemPhysicalCard({ cardId, accountMembershipId }),
      },
    })
      .mapOk(data => data.resumePhysicalCard)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const viewPinCode = () => {
    viewPhysicalCardPin({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountCardsItemPhysicalCard({ cardId, accountMembershipId }),
      },
    })
      .mapOk(data => data.viewPhysicalCardPin)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const onCardActivationFormSubmit = ({ identifier }: { identifier: string }) => {
    activatePhysicalCard({
      input: {
        identifier,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountCardsItemPhysicalCard({ cardId, accountMembershipId }),
      },
    })
      .mapOk(data => data.activatePhysicalCard)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const onPressRevealPhysicalCardNumbers = () => {
    viewPhysicalCardNumbers({
      input: {
        cardId,
        consentRedirectUrl:
          window.location.origin + Router.AccountCardsItem({ cardId, accountMembershipId }),
      },
    })
      .mapOk(data => data.viewPhysicalCardNumbers)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const textColor = hasBindingUserError ? colors.gray[300] : colors.gray[800];
  const previousCard = card.physicalCard?.previousPhysicalCards[0];
  const [currentCard, setCurrentCard] = useState<"previous" | "renewed">("renewed");

  return (
    <View style={styles.container}>
      {match(card.physicalCard)
        .with(
          {
            __typename: "PhysicalCard",
            statusInfo: {
              __typename: "PhysicalCardToRenewStatusInfo",
            },
            expiryDate: P.nonNullable,
          },
          ({ statusInfo: { address }, previousPhysicalCards, expiryDate }) => {
            const { addressLine1, addressLine2, city, country, postalCode } = address;
            const completeAddress = Array.filterMap(
              [
                Option.fromNullable(addressLine1),
                Option.fromNullable(addressLine2),
                Option.all([Option.fromNullable(postalCode), Option.fromNullable(city)]).map(
                  ([postalCode, city]) => `${postalCode} ${city}`,
                ),
                Option.fromNullable(country),
              ],
              x => x,
            ).join(", ");
            const fourWeeksBefore = dayjs(
              isNotNullish(previousPhysicalCards[0])
                ? previousPhysicalCards[0].expiryDate
                : expiryDate,
              "MM/YY",
            )
              .endOf("month")
              .subtract(4, "weeks")
              .format("LL");

            return (
              <>
                <Space height={24} />

                <LakeAlert
                  style={styles.renewAlert}
                  variant="info"
                  title={t("card.physical.toRenewAlert", {
                    expiryDate: dayjs(
                      isNotNullish(previousPhysicalCards[0])
                        ? previousPhysicalCards[0].expiryDate
                        : expiryDate,
                      "MM/YY",
                    )
                      .endOf("month")
                      .format("LL"),
                  })}
                  children={
                    <>
                      <LakeText>
                        {t("card.physical.toRenewAlert.description", {
                          deadline: fourWeeksBefore,
                          address: completeAddress,
                        })}
                      </LakeText>

                      <Space height={12} />

                      <Box>
                        <LakeButton
                          ariaLabel={t("card.physical.toRenewAlert.cta")}
                          size="small"
                          icon="edit-regular"
                          mode="secondary"
                          style={styles.renewAlertCta}
                          onPress={() => {
                            setOrderModalStatus(
                              Option.Some({
                                type: "renewal",
                                initialShippingAddress: address,
                              }),
                            );
                          }}
                        >
                          {t("card.physical.toRenewAlert.cta")}
                        </LakeButton>
                      </Box>

                      <Space height={12} />
                    </>
                  }
                />
              </>
            );
          },
        )
        .with(
          {
            statusInfo: { __typename: "PhysicalCardRenewedStatusInfo" },
            previousPhysicalCards: [{ expiryDate: P.nonNullable }, ...P.array(P._)],
          },
          ({ previousPhysicalCards }) => (
            <>
              <Space height={24} />

              {previousPhysicalCards[0].isExpired === true ? (
                <LakeAlert
                  style={styles.renewAlert}
                  variant="info"
                  title={t("card.physical.expiredAlert")}
                  children={
                    <>
                      <LakeText>{t("card.physical.expiredAlert.description")}</LakeText>
                      <Space height={12} />
                    </>
                  }
                />
              ) : (
                <LakeAlert
                  style={styles.renewAlert}
                  variant="info"
                  title={t("card.physical.toRenewAlert", {
                    expiryDate: dayjs(previousPhysicalCards[0].expiryDate, "MM/YY")
                      .endOf("month")
                      .format("LL"),
                  })}
                  children={
                    <>
                      <LakeText>{t("card.physical.toRenewAlert.info")}</LakeText>
                      <Space height={12} />
                    </>
                  }
                />
              )}
            </>
          ),
        )
        .otherwise(() => null)}

      <View style={styles.card}>
        {match(card.physicalCard)
          .with({ __typename: "PhysicalCard" }, physicalCard => (
            <View style={styles.card}>
              {card.cardDesignUrl != null
                ? match({ physicalCard, previousCard })
                    .with(
                      {
                        physicalCard: { statusInfo: { status: "Renewed" } },
                        previousCard: P.nonNullable,
                      },
                      {
                        physicalCard: { statusInfo: { status: "ToRenew" } },
                        previousCard: P.nonNullable,
                      },
                      ({ previousCard }) =>
                        desktop ? (
                          <>
                            <View style={styles.physicalCardContainer}>
                              <Svg role="none" viewBox="0 0 85 55" />

                              <Pressable
                                onPress={() => setCurrentCard("renewed")}
                                style={[
                                  styles.physicalCardFront,
                                  currentCard === "previous" && styles.physicalCardRenewedBehind,
                                ]}
                              >
                                <MaskedCard
                                  cardDesignUrl={card.cardDesignUrl}
                                  textColor={
                                    card.cardProduct.cardDesigns.find(
                                      cardDesign => cardDesign.cardDesignUrl === card.cardDesignUrl,
                                    )?.accentColor ?? invariantColors.white
                                  }
                                  holderName={getMemberName({
                                    accountMembership: card.accountMembership,
                                  })}
                                  pan={physicalCard.cardMaskedNumber}
                                  expiryDate={physicalCard.expiryDate ?? ""}
                                  status={physicalCard.statusInfo.status}
                                  estimatedDeliveryDate={match(physicalCard.statusInfo)
                                    .with(
                                      {
                                        __typename: "PhysicalCardToActivateStatusInfo",
                                        estimatedDeliveryDate: P.string,
                                      },
                                      {
                                        __typename: "PhysicalCardRenewedStatusInfo",
                                        estimatedDeliveryDate: P.string,
                                      },
                                      ({ estimatedDeliveryDate }) => estimatedDeliveryDate,
                                    )
                                    .otherwise(() => undefined)}
                                />
                              </Pressable>

                              <Pressable
                                onPress={() => setCurrentCard("previous")}
                                style={[
                                  styles.physicalCardFront,
                                  currentCard === "renewed" && styles.physicalCardPreviousBehind,
                                ]}
                              >
                                <MaskedCard
                                  expired={previousCard.isExpired}
                                  cardDesignUrl={card.cardDesignUrl}
                                  textColor={
                                    card.cardProduct.cardDesigns.find(
                                      cardDesign => cardDesign.cardDesignUrl === card.cardDesignUrl,
                                    )?.accentColor ?? invariantColors.white
                                  }
                                  holderName={getMemberName({
                                    accountMembership: card.accountMembership,
                                  })}
                                  pan={previousCard.cardMaskedNumber}
                                  expiryDate={previousCard.expiryDate ?? ""}
                                  status={"ToRenew"}
                                />
                              </Pressable>
                            </View>

                            <Space height={24} />

                            <Stack direction="row" space={8} style={styles.dotIndicatorsContainer}>
                              <DotIndicator
                                onPress={() => setCurrentCard("previous")}
                                active={currentCard === "previous"}
                              />

                              <DotIndicator
                                onPress={() => setCurrentCard("renewed")}
                                active={currentCard === "renewed"}
                              />
                            </Stack>
                          </>
                        ) : (
                          <ChoicePicker
                            tile={false}
                            onChange={setCurrentCard}
                            value={currentCard}
                            items={["previous", "renewed"]}
                            renderItem={selectedCard => (
                              <View style={styles.physicalCardContainer}>
                                <Svg
                                  role="none"
                                  viewBox="0 0 85 55"
                                  style={styles.physicalCardItem}
                                />

                                <View style={styles.physicalCardFront}>
                                  <MaskedCard
                                    expired={previousCard.isExpired}
                                    cardDesignUrl={card.cardDesignUrl}
                                    textColor={
                                      card.cardProduct.cardDesigns.find(
                                        cardDesign =>
                                          cardDesign.cardDesignUrl === card.cardDesignUrl,
                                      )?.accentColor ?? "#fff"
                                    }
                                    holderName={getMemberName({
                                      accountMembership: card.accountMembership,
                                    })}
                                    pan={
                                      selectedCard === "previous"
                                        ? previousCard.cardMaskedNumber
                                        : physicalCard.cardMaskedNumber
                                    }
                                    expiryDate={
                                      selectedCard === "previous"
                                        ? previousCard.expiryDate ?? ""
                                        : physicalCard.expiryDate ?? ""
                                    }
                                    status={
                                      selectedCard === "previous"
                                        ? "ToRenew"
                                        : physicalCard.statusInfo.status
                                    }
                                    estimatedDeliveryDate={match(physicalCard.statusInfo)
                                      .with(
                                        {
                                          __typename: "PhysicalCardToActivateStatusInfo",
                                          estimatedDeliveryDate: P.string,
                                        },
                                        {
                                          __typename: "PhysicalCardRenewedStatusInfo",
                                          estimatedDeliveryDate: P.string,
                                        },
                                        ({ estimatedDeliveryDate }) => estimatedDeliveryDate,
                                      )
                                      .otherwise(() => undefined)}
                                  />
                                </View>
                              </View>
                            )}
                          />
                        ),
                    )
                    .otherwise(() => (
                      <MaskedCard
                        cardDesignUrl={card.cardDesignUrl}
                        textColor={
                          card.cardProduct.cardDesigns.find(
                            cardDesign => cardDesign.cardDesignUrl === card.cardDesignUrl,
                          )?.accentColor ?? invariantColors.white
                        }
                        holderName={getMemberName({ accountMembership: card.accountMembership })}
                        pan={physicalCard.cardMaskedNumber}
                        expiryDate={physicalCard.expiryDate ?? ""}
                        status={physicalCard.statusInfo.status}
                        estimatedDeliveryDate={match(physicalCard.statusInfo)
                          .with(
                            {
                              __typename: "PhysicalCardToActivateStatusInfo",
                              estimatedDeliveryDate: P.string,
                            },
                            {
                              __typename: "PhysicalCardRenewedStatusInfo",
                              estimatedDeliveryDate: P.string,
                            },
                            ({ estimatedDeliveryDate }) => estimatedDeliveryDate,
                          )
                          .otherwise(() => undefined)}
                      />
                    ))
                : null}

              {cardRequiresIdentityVerification ? (
                <>
                  <Space height={24} />

                  <CardItemIdentityVerificationGate
                    recommendedIdentificationLevel={
                      card.accountMembership.recommendedIdentificationLevel
                    }
                    isCurrentUserCardOwner={isCurrentUserCardOwner}
                    projectId={projectId}
                    description={t("card.identityVerification.payments")}
                    descriptionForOtherMember={t("card.identityVerification.payments.otherMember", {
                      name: getMemberName({ accountMembership: card.accountMembership }),
                    })}
                    onComplete={onRefreshAccountRequest}
                    lastRelevantIdentification={lastRelevantIdentification}
                  />
                </>
              ) : null}

              {match({ card, physicalCardOrderVisible })
                .with(
                  {
                    physicalCardOrderVisible: true,
                    card: {
                      statusInfo: {
                        __typename: P.not(
                          P.union("CardCancelingStatusInfo", "CardCanceledStatusInfo"),
                        ),
                      },
                      cardProduct: {
                        applicableToPhysicalCards: true,
                      },
                      physicalCard: {
                        statusInfo: {
                          __typename: P.union(
                            "PhysicalCardCanceledStatusInfo",
                            "PhysicalCardCancelingStatusInfo",
                          ),
                        },
                      },
                    },
                  },
                  () => (
                    <>
                      <Space height={24} />

                      <LakeButton
                        icon="add-circle-filled"
                        color="current"
                        onPress={() =>
                          setOrderModalStatus(
                            Option.Some({ type: "order", initialShippingAddress }),
                          )
                        }
                      >
                        {t("card.physical.orderNewCard")}
                      </LakeButton>
                    </>
                  ),
                )
                .otherwise(() => null)}

              {match({ physicalCard, isCurrentUserCardOwner })
                .with(
                  {
                    isCurrentUserCardOwner: true,
                    physicalCard: {
                      statusInfo: {
                        __typename: "PhysicalCardToActivateStatusInfo",
                      },
                    },
                  },
                  () => (
                    <>
                      <Space height={24} />

                      <LakeTooltip
                        content={t("card.tooltipConflict")}
                        placement="center"
                        disabled={!hasBindingUserError}
                      >
                        <LakeButton
                          color="current"
                          onPress={() => setIsActivationModalOpen(true)}
                          loading={physicalCardActivation.isLoading()}
                          disabled={hasBindingUserError}
                        >
                          {t("card.physical.activate")}
                        </LakeButton>
                      </LakeTooltip>
                    </>
                  ),
                )
                .with(
                  {
                    isCurrentUserCardOwner: true,
                    physicalCard: {
                      statusInfo: {
                        __typename: "PhysicalCardRenewedStatusInfo",
                      },
                    },
                  },
                  () => (
                    <>
                      <Space height={24} />

                      <LakeTooltip
                        content={t("card.tooltipConflict")}
                        placement="center"
                        disabled={!hasBindingUserError}
                      >
                        {currentCard === "renewed" && (
                          <LakeButton
                            color="current"
                            onPress={() => setIsActivationModalOpen(true)}
                            loading={physicalCardActivation.isLoading()}
                            disabled={hasBindingUserError}
                          >
                            {t("card.physical.activate")}
                          </LakeButton>
                        )}
                      </LakeTooltip>
                    </>
                  ),
                )
                .otherwise(() => null)}

              {match({ isCurrentUserCardOwner, card })
                .with(
                  {
                    isCurrentUserCardOwner: true,
                    card: {
                      physicalCard: {
                        statusInfo: {
                          __typename: P.union(
                            "PhysicalCardActivatedStatusInfo",
                            "PhysicalCardToRenewStatusInfo",
                          ),
                        },
                      },
                      accountMembership: {
                        statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" },
                      },
                    },
                  },
                  () => (
                    <>
                      <Space height={24} />

                      <LakeTooltip
                        content={t("card.tooltipConflict")}
                        placement="center"
                        disabled={!hasBindingUserError}
                      >
                        <LakeButton
                          disabled={hasBindingUserError}
                          mode="secondary"
                          icon="eye-regular"
                          loading={physicalCardNumberViewing.isLoading()}
                          onPress={onPressRevealPhysicalCardNumbers}
                        >
                          {t("card.revealNumbers")}
                        </LakeButton>
                      </LakeTooltip>

                      <Space height={24} />
                    </>
                  ),
                )
                .with(
                  {
                    isCurrentUserCardOwner: true,
                    card: {
                      physicalCard: {
                        statusInfo: {
                          __typename: "PhysicalCardRenewedStatusInfo",
                        },
                      },
                      accountMembership: {
                        statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" },
                      },
                    },
                  },
                  () => (
                    <>
                      <LakeTooltip
                        content={t("card.tooltipConflict")}
                        placement="center"
                        disabled={!hasBindingUserError}
                      >
                        {currentCard === "previous" && (
                          <LakeButton
                            disabled={hasBindingUserError}
                            mode="secondary"
                            icon="eye-regular"
                            loading={physicalCardNumberViewing.isLoading()}
                            onPress={onPressRevealPhysicalCardNumbers}
                          >
                            {t("card.revealNumbers")}
                          </LakeButton>
                        )}
                      </LakeTooltip>

                      <Space height={24} />
                    </>
                  ),
                )
                .otherwise(() => null)}

              {match(card)
                .with(
                  {
                    spending: { amount: { value: P.string, currency: P.string } },
                    spendingLimits: P.array({ amount: { value: P.string, currency: P.string } }),
                  },
                  ({ spending, spendingLimits }) => {
                    const spendingLimit = spendingLimits[0];
                    if (spendingLimit == null) {
                      return null;
                    }
                    const spentOverLimitRatio = Math.min(
                      Number(spending.amount.value) / Number(spendingLimit.amount.value),
                      1,
                    );
                    const remainderToSpend = Math.max(
                      0,
                      Number(spendingLimit.amount.value) - Number(spending.amount.value),
                    );
                    return (
                      <>
                        <Space height={12} />

                        <View style={styles.spendingContainer}>
                          <View style={styles.spendingLimitText}>
                            <LakeText color={textColor} variant="smallRegular">
                              {t("card.spendingLimit")}
                            </LakeText>

                            <Fill minWidth={24} />

                            <LakeText
                              color={
                                hasBindingUserError
                                  ? colors.gray[300]
                                  : Number(spending.amount.value) >=
                                      Number(spendingLimit.amount.value)
                                    ? colors.negative[500]
                                    : colors.gray[800]
                              }
                              variant="smallSemibold"
                            >
                              {formatCurrency(
                                Number(spending.amount.value),
                                spending.amount.currency,
                              )}
                            </LakeText>

                            <Space width={4} />

                            <LakeText color={textColor} variant="smallRegular">
                              {"/"}
                            </LakeText>

                            <Space width={4} />

                            <LakeText color={textColor} variant="smallRegular">
                              {formatCurrency(
                                Number(spendingLimit.amount.value),
                                spendingLimit.amount.currency,
                              )}
                            </LakeText>
                          </View>

                          <Space height={8} />

                          <View style={styles.progress}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  backgroundColor:
                                    spentOverLimitRatio >= 1
                                      ? colors.negative[500]
                                      : colors.current[500],
                                  width: `${spentOverLimitRatio * 100}%`,
                                },
                              ]}
                            />
                          </View>

                          <Space height={8} />

                          <View style={styles.spendingLimitText}>
                            <LakeText color={textColor} variant="smallRegular">
                              {match(spendingLimit.period)
                                .with("Daily", () => t("card.spendingLimit.remaining.daily"))
                                .with("Weekly", () => t("card.spendingLimit.remaining.weekly"))
                                .with("Monthly", () => t("card.spendingLimit.remaining.monthly"))
                                .with("Always", () => t("card.spendingLimit.remaining.always"))
                                .exhaustive()}
                            </LakeText>

                            <Fill minWidth={24} />

                            <LakeText color={textColor} variant="smallRegular">
                              {formatCurrency(remainderToSpend, spending.amount.currency)}
                            </LakeText>
                          </View>
                        </View>

                        <Space height={32} />
                      </>
                    );
                  },
                )
                .otherwise(() => null)}

              {match(physicalCard.statusInfo)
                .with({ __typename: "PhysicalCardToActivateStatusInfo" }, ({ address }) => (
                  <>
                    <LakeAlert
                      variant={"neutral"}
                      title={t("card.shippingAddress")}
                      children={[
                        address.addressLine1,
                        address.addressLine2,
                        address.postalCode,
                        address.city,
                        address.country != null && isCountryCCA3(address.country)
                          ? getCountryName(address.country)
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />

                    <Space height={24} />
                  </>
                ))
                .with(
                  { __typename: "PhysicalCardRenewedStatusInfo", trackingNumber: P.nullish },
                  ({ address }) =>
                    currentCard === "renewed" && (
                      <>
                        <LakeAlert
                          variant={"neutral"}
                          title={t("card.shippingAddress")}
                          children={[
                            address.addressLine1,
                            address.addressLine2,
                            address.postalCode,
                            address.city,
                            address.country != null && isCountryCCA3(address.country)
                              ? getCountryName(address.country)
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        />

                        <Space height={24} />
                      </>
                    ),
                )
                .otherwise(() => null)}

              <QuickActions
                actions={[
                  ...match(physicalCard)
                    .with(
                      {
                        statusInfo: {
                          __typename: P.union(
                            "PhysicalCardActivatedStatusInfo",
                            "PhysicalCardRenewedStatusInfo",
                            "PhysicalCardToRenewStatusInfo",
                          ),
                        },
                      },
                      () => [
                        {
                          label: t("card.physical.temporarilyBlock"),
                          icon: "lock-closed-regular" as const,
                          onPress: () =>
                            isNotNullish(previousCard)
                              ? setIsTemporaryBlockModalOpen(true)
                              : suspendCard(),
                          isLoading: cardSuspension.isLoading(),
                          disabled: hasBindingUserError,
                          tooltipDisabled: !hasBindingUserError,
                          tooltipText: t("card.tooltipConflict"),
                        },
                      ],
                    )
                    .with(
                      {
                        statusInfo: {
                          __typename: "PhysicalCardSuspendedStatusInfo",
                        },
                      },
                      () => [
                        {
                          label: t("card.physical.unblock"),
                          icon: "lock-open-regular" as const,
                          onPress: () => unsuspendCard(),
                          color: colors.warning.contrast,
                          backgroundColor: colors.warning[500],
                          isLoading: cardUnsuspension.isLoading(),
                          disabled: hasBindingUserError,
                          tooltipDisabled: !hasBindingUserError,
                          tooltipText: t("card.tooltipConflict"),
                        },
                      ],
                    )
                    .otherwise(() => []),
                  ...match({
                    currentUserHasRights: isCurrentUserCardOwner || canManageAccountMembership,
                    physicalCard,
                  })
                    .with(
                      {
                        currentUserHasRights: true,
                        physicalCard: {
                          statusInfo: {
                            __typename: P.not(
                              P.union(
                                "PhysicalCardCancelingStatusInfo",
                                "PhysicalCardCanceledStatusInfo",
                              ),
                            ),
                          },
                        },
                      },
                      () => [
                        {
                          label: t("card.physical.cancel"),
                          icon: "subtract-circle-regular" as const,
                          onPress: () => setIsPermanentlyBlockModalOpen(true),
                          disabled: hasBindingUserError,
                          tooltipDisabled: !hasBindingUserError,
                          tooltipText: t("card.tooltipConflict"),
                        },
                      ],
                    )
                    .otherwise(() => []),
                  ...match({ statusInfo: physicalCard.statusInfo, isCurrentUserCardOwner })
                    .with(
                      {
                        isCurrentUserCardOwner: true,
                        statusInfo: P.union(
                          {
                            __typename: P.union(
                              "PhysicalCardRenewedStatusInfo",
                              "PhysicalCardToActivateStatusInfo",
                            ),
                            isPINReady: true,
                          },
                          {
                            __typename: "PhysicalCardToRenewStatusInfo",
                          },
                        ),
                      },
                      {
                        isCurrentUserCardOwner: true,
                        statusInfo: {
                          __typename: "PhysicalCardActivatedStatusInfo",
                        },
                      },
                      () => [
                        {
                          label: t("card.physical.viewPin"),
                          icon: "key-regular" as const,
                          onPress: () => viewPinCode(),
                          isLoading: pinCardViewing.isLoading(),
                          disabled: hasBindingUserError,
                          tooltipDisabled: !hasBindingUserError,
                          tooltipText: t("card.tooltipConflict"),
                        },
                      ],
                    )
                    .otherwise(() => []),
                ]}
              />

              {match(physicalCard.statusInfo)
                .with(
                  {
                    __typename: P.union("PhysicalCardToActivateStatusInfo"),
                    trackingNumber: P.string,
                    shippingProvider: P.string,
                  },
                  ({ trackingNumber, shippingProvider }) => {
                    return (
                      <>
                        <Space height={48} />

                        <Tile>
                          <Icon size={20} color={colors.current[500]} name="box-regular" />
                          <Space height={8} />

                          <Box direction="row" alignItems="center">
                            <View style={styles.trackingNumber}>
                              <LakeText variant="smallMedium" color={colors.gray[900]}>
                                {t("card.physical.trackingNumber", { shippingProvider })}
                              </LakeText>

                              <LakeText variant="smallRegular" color={colors.gray[700]}>
                                {trackingNumber}
                              </LakeText>
                            </View>

                            <LakeCopyButton
                              valueToCopy={trackingNumber}
                              copyText={t("copyButton.copyTooltip")}
                              copiedText={t("copyButton.copiedTooltip")}
                            />
                          </Box>
                        </Tile>
                      </>
                    );
                  },
                )
                .with(
                  {
                    __typename: P.union("PhysicalCardRenewedStatusInfo"),
                    trackingNumber: P.string,
                    shippingProvider: P.string,
                  },
                  ({ trackingNumber, shippingProvider, address }) => {
                    return (
                      currentCard === "renewed" && (
                        <>
                          <Space height={48} />

                          <Tile style={styles.shippingAddressTile}>
                            <Icon size={20} color={colors.current[500]} name="box-regular" />
                            <Space height={8} />

                            <Box direction="row" alignItems="center">
                              <View style={styles.trackingNumber}>
                                <LakeText variant="smallMedium" color={colors.gray[900]}>
                                  {t("card.physical.trackingNumber", { shippingProvider })}
                                </LakeText>

                                <LakeText variant="smallRegular" color={colors.gray[700]}>
                                  {trackingNumber}
                                </LakeText>
                              </View>

                              <LakeCopyButton
                                valueToCopy={trackingNumber}
                                copyText={t("copyButton.copyTooltip")}
                                copiedText={t("copyButton.copiedTooltip")}
                              />
                            </Box>
                          </Tile>

                          <LakeAlert
                            style={styles.shippingAddressAlert}
                            anchored={true}
                            variant={"neutral"}
                            title={t("card.yourAddress")}
                            children={[
                              address.addressLine1,
                              address.addressLine2,
                              address.postalCode,
                              address.city,
                              address.country != null && isCountryCCA3(address.country)
                                ? getCountryName(address.country)
                                : undefined,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          />

                          <Space height={24} />
                        </>
                      )
                    );
                  },
                )
                .otherwise(() => null)}
            </View>
          ))
          .with(P.nullish, () => (
            <>
              <View style={styles.cardPlaceholder}>
                <Image
                  source={{ uri: physicalCardPlaceholder }}
                  style={styles.cardPlaceholderBackground}
                />

                <View style={styles.cardPlaceholderText}>
                  <LakeHeading level={2} variant="h3" color={colors.gray[900]}>
                    {t("card.physicalCard.needAPhysicalCard")}
                  </LakeHeading>

                  <LakeText variant="smallRegular" color={colors.gray[600]}>
                    {t("card.physicalCard.needAPhysicalCard.description")}
                  </LakeText>
                </View>
              </View>

              {match({ physicalCardOrderVisible, card })
                .with(
                  {
                    physicalCardOrderVisible: true,
                    card: {
                      statusInfo: {
                        __typename: P.not(
                          P.union("CardCancelingStatusInfo", "CardCanceledStatusInfo"),
                        ),
                      },
                    },
                  },
                  () => (
                    <>
                      <Space height={24} />

                      <LakeTooltip
                        content={t("card.tooltipConflict")}
                        placement="center"
                        disabled={!hasBindingUserError}
                      >
                        <LakeButton
                          disabled={hasBindingUserError}
                          color="current"
                          onPress={() =>
                            setOrderModalStatus(
                              Option.Some({ type: "order", initialShippingAddress }),
                            )
                          }
                        >
                          {t("card.physical.order")}
                        </LakeButton>
                      </LakeTooltip>
                    </>
                  ),
                )
                .otherwise(() => null)}
            </>
          ))
          .exhaustive()}
      </View>

      <LakeModal
        visible={orderModalStatus.isSome()}
        icon="pin-regular"
        title={t("card.physical.order.shippingAddress")}
      >
        <LakeText color={colors.gray[600]}>
          {t("card.physical.order.shippingAddress.description")}
        </LakeText>

        <Space height={16} />

        {match(orderModalStatus)
          .with(Option.P.Some(P.select({ type: "order" })), ({ initialShippingAddress }) => (
            <CardItemPhysicalShippingForm
              onPressClose={() => setOrderModalStatus(Option.None())}
              onSubmit={onShippingFormSubmit}
              initialAddress={initialShippingAddress}
              isLoading={physicalCardPrinting.isLoading()}
            />
          ))
          .with(Option.P.Some(P.select({ type: "renewal" })), ({ initialShippingAddress }) => (
            <CardItemPhysicalShippingForm
              mode="renewal"
              onPressClose={() => setOrderModalStatus(Option.None())}
              onSubmit={onConfirmingPhysicalCardRenewal}
              initialAddress={initialShippingAddress}
              isLoading={physicalCardRenewalConfirming.isLoading()}
            />
          ))
          .otherwise(() => null)}
      </LakeModal>

      <LakeModal
        visible={isPermanentlyBlockModalOpen}
        icon="subtract-circle-regular"
        title={t("card.physical.cancel")}
        onPressClose={() => setIsPermanentlyBlockModalOpen(false)}
        color="negative"
      >
        <LakeText color={colors.gray[600]}>
          {isNotNullish(previousCard)
            ? t("card.physical.cancelDescriptionWithRenewal")
            : t("card.physical.cancelDescription")}
        </LakeText>

        <Space height={16} />

        <CardItemPhysicalPermanentlyBlockForm
          onSubmit={onPermanentlyBlockFormSubmit}
          isLoading={permanentBlocking.isLoading()}
        />
      </LakeModal>

      <LakeModal
        visible={isTemporaryBlockModalOpen}
        icon="lock-closed-regular"
        title={t("card.physical.cancelTemporaryConfirmationWithRenewal")}
        onPressClose={() => setIsTemporaryBlockModalOpen(false)}
        color="warning"
      >
        <LakeText color={colors.gray[600]}>
          {t("card.physical.cancelTemporaryDescriptionWithRenewal")}
        </LakeText>

        <Space height={16} />

        <LakeButton
          onPress={() => {
            suspendCard();
            setIsTemporaryBlockModalOpen(false);
          }}
          color="warning"
        >
          {t("card.block")}
        </LakeButton>
      </LakeModal>

      <LakeModal
        visible={isActivationModalOpen}
        title={t("card.physical.cardActivation")}
        color="negative"
        onPressClose={() => setIsActivationModalOpen(false)}
      >
        <LakeText color={colors.gray[600]}>
          {t("card.physical.cardActivation.description")}
        </LakeText>

        <Space height={16} />

        <Image
          resizeMode="contain"
          source={{ uri: cardIdentifier }}
          style={styles.cardIdentifier}
        />

        <Space height={16} />

        <CardItemPhysicalActivationForm
          onSubmit={onCardActivationFormSubmit}
          isLoading={physicalCardActivation.isLoading()}
        />
      </LakeModal>
    </View>
  );
};
