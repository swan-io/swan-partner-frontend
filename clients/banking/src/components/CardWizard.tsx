import { Array, AsyncData, Future, Option, Result } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useQuery } from "urql";
import {
  AccountMembershipFragment,
  AddCardDocument,
  AddCardsDocument,
  AddCardsInput,
  AddCardsWithGroupDeliveryDocument,
  AddSingleUseVirtualCardDocument,
  AddSingleUseVirtualCardsDocument,
  AddSingleUseVirtualCardsInput,
  CardFragment,
  CreateMultiConsentDocument,
  GetCardProductsDocument,
  GetCardProductsQuery,
  GetEligibleCardMembershipsDocument,
  SpendingLimitInput,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardWizardDelivery, CardWizardDeliveryRef } from "./CardWizardDelivery";
import { CardFormat, CardWizardFormat, CardWizardFormatRef } from "./CardWizardFormat";
import {
  CardWizardGroupedDelivery,
  CardWizardGroupedDeliveryRef,
} from "./CardWizardGroupedDelivery";
import {
  CardWizardIndividualDelivery,
  CardWizardIndividualDeliveryRef,
} from "./CardWizardIndividualDelivery";
import { CardWizardMembers, CardWizardMembersRef, Member } from "./CardWizardMembers";
import { CardWizardProduct, CardWizardProductRef } from "./CardWizardProduct";
import { CardWizardSettings, CardWizardSettingsRef } from "./CardWizardSettings";
import { ErrorView } from "./ErrorView";

type CardProduct = NonNullable<GetCardProductsQuery["projectInfo"]["cardProducts"]>[number];

type StepDefault = {
  cardName?: string;
  cardProduct?: CardProduct;
  cardFormat?: CardFormat;
  spendingLimit?: SpendingLimitInput;
  eCommerce?: boolean;
  withdrawal?: boolean;
  international?: boolean;
  nonMainCurrencyTransactions?: boolean;
  memberships?: Member[];
};

type Step = StepDefault &
  (
    | { name: "CardProductType" }
    | { name: "CardProductFormat"; cardProduct: CardProduct }
    | { name: "CardProductSettings"; cardProduct: CardProduct; cardFormat: CardFormat }
    | {
        name: "CardProductMembers";
        cardProduct: CardProduct;
        cardFormat: CardFormat;
        spendingLimit: SpendingLimitInput;
        cardName?: string;
        eCommerce: boolean;
        withdrawal: boolean;
        international: boolean;
        nonMainCurrencyTransactions: boolean;
      }
    | {
        name: "CardProductDelivery";
        cardProduct: CardProduct;
        cardFormat: CardFormat;
        spendingLimit: SpendingLimitInput;
        cardName?: string;
        eCommerce: boolean;
        withdrawal: boolean;
        international: boolean;
        nonMainCurrencyTransactions: boolean;
        memberships: Member[];
      }
    | {
        name: "CardProductGroupedDelivery";
        cardProduct: CardProduct;
        cardFormat: CardFormat;
        spendingLimit: SpendingLimitInput;
        cardName?: string;
        eCommerce: boolean;
        withdrawal: boolean;
        international: boolean;
        nonMainCurrencyTransactions: boolean;
        memberships: Member[];
      }
    | {
        name: "CardProductIndividualDelivery";
        cardProduct: CardProduct;
        cardFormat: CardFormat;
        spendingLimit: SpendingLimitInput;
        cardName?: string;
        eCommerce: boolean;
        withdrawal: boolean;
        international: boolean;
        nonMainCurrencyTransactions: boolean;
        memberships: Member[];
      }
  );

const INITIAL_STEP = { name: "CardProductType" } as const;

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  header: {
    paddingVertical: spacings[12],
  },
  headerContents: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 1520,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  contents: {
    width: "100%",
    maxWidth: 1520,
    marginHorizontal: "auto",
    flexGrow: 1,
  },
  contentsContainer: {
    height: 1,
    flexGrow: 1,
  },
  contentsContents: {
    flexGrow: 1,
    alignItems: "stretch",
    justifyContent: "center",
    paddingHorizontal: spacings[96],
    paddingVertical: spacings[24],
  },
  mobileContents: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
    flexGrow: 1,
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  buttonsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    flexShrink: 0,
  },
  buttonsContents: {
    width: "100%",
    maxWidth: 1520,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  button: {
    flex: 1,
  },
  title: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    left: 0,
    right: 0,
  },
});

type Props = {
  onPressClose?: () => void;
  accountMembership: AccountMembershipFragment;
  preselectedAccountMembership?: AccountMembershipFragment;
  canOrderPhysicalCards: boolean;
};

const Title = ({ visible, children }: { visible: boolean; children: string }) => {
  return (
    <View style={styles.title}>
      <TransitionView {...animations.fadeAndSlideInFromRight}>
        {visible ? (
          <LakeHeading level={2} variant="h3">
            {children}
          </LakeHeading>
        ) : null}
      </TransitionView>
    </View>
  );
};

export const CardWizard = ({
  accountMembership,
  onPressClose,
  preselectedAccountMembership,
  canOrderPhysicalCards,
}: Props) => {
  const [{ data }] = useQuery({
    query: GetCardProductsDocument,
    variables: { accountMembershipId: accountMembership.id },
  });
  const [step, setStep] = useState<Step>(INITIAL_STEP);

  const [, addCards] = useUrqlMutation(AddCardsDocument);
  const [, addCard] = useUrqlMutation(AddCardDocument);
  const [, addCardsWithGroupDelivery] = useUrqlMutation(AddCardsWithGroupDeliveryDocument);
  const [, addSingleUseCards] = useUrqlMutation(AddSingleUseVirtualCardsDocument);
  const [, addSingleUseCard] = useUrqlMutation(AddSingleUseVirtualCardDocument);
  const [, createMultiConsent] = useUrqlMutation(CreateMultiConsentDocument);

  const addCardsWrapper = (input: AddCardsInput) => {
    setCardOrder(AsyncData.Loading());

    const card = input.cards[0];

    if (
      input.cards.length === 1 &&
      isNotNullish(card) &&
      input.cards.every(item => isNullish(item.physicalCard))
    ) {
      return addCard({
        input: {
          name: card.name,
          accountMembershipId: card.accountMembershipId,
          cardProductId: input.cardProductId,
          consentRedirectUrl: input.consentRedirectUrl,
          eCommerce: card.eCommerce,
          international: card.international,
          nonMainCurrencyTransactions: card.nonMainCurrencyTransactions,
          withdrawal: card.withdrawal,
          spendingLimit: card.spendingLimit,
        },
      })
        .mapOkToResult(({ addCard }) =>
          match(addCard)
            .with({ __typename: "AddCardSuccessPayload" }, ({ card }) => Result.Ok(card))
            .otherwise(rejection => Result.Error(rejection)),
        )
        .mapOk(({ statusInfo }) =>
          match(statusInfo)
            .with({ __typename: "CardConsentPendingStatusInfo" }, ({ consent }) =>
              Option.Some(consent.consentUrl),
            )
            .otherwise(() => Option.None()),
        )
        .tap(() => setCardOrder(AsyncData.NotAsked()))
        .tapOk(value => {
          value.match({
            Some: consentUrl => window.location.replace(consentUrl),
            None: () => {},
          });
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    } else {
      return addCards({ input })
        .mapOkToResult(({ addCards }) =>
          match(addCards)
            .with({ __typename: "AddCardsSuccessPayload" }, ({ cards }) => Result.Ok(cards))
            .otherwise(rejection => Result.Error(rejection)),
        )
        .flatMapOk(cards => generateMultiConsent(cards))
        .tap(() => setCardOrder(AsyncData.NotAsked()))
        .tapOk(value => {
          value.match({
            Some: consentUrl => window.location.replace(consentUrl),
            None: () => {},
          });
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    }
  };

  const addSingleUseCardsWrapper = (input: AddSingleUseVirtualCardsInput) => {
    setCardOrder(AsyncData.Loading());

    const card = input.cards[0];

    if (input.cards.length === 1 && card != undefined) {
      return addSingleUseCard({
        input: {
          name: card.name,
          spendingLimit: card.spendingLimit,
          accountMembershipId: card.accountMembershipId,
          cardProductId: input.cardProductId,
          consentRedirectUrl: input.consentRedirectUrl,
        },
      })
        .mapOkToResult(({ addSingleUseVirtualCard }) =>
          match(addSingleUseVirtualCard)
            .with(
              { __typename: "AddSingleUseVirtualCardSuccessForUserPayload" },
              { __typename: "AddSingleUseVirtualCardSuccessForProjectOwnerPayload" },
              ({ card }) => Result.Ok(card),
            )
            .otherwise(rejection => Result.Error(rejection)),
        )
        .mapOk(({ statusInfo }) =>
          match(statusInfo)
            .with({ __typename: "CardConsentPendingStatusInfo" }, ({ consent }) =>
              Option.Some(consent.consentUrl),
            )
            .otherwise(() => Option.None()),
        )
        .tap(() => setCardOrder(AsyncData.NotAsked()))
        .tapOk(value => {
          value.match({
            Some: consentUrl => window.location.replace(consentUrl),
            None: () => {},
          });
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    } else {
      return addSingleUseCards({ input })
        .mapOkToResult(({ addSingleUseVirtualCards }) =>
          match(addSingleUseVirtualCards)
            .with({ __typename: "AddSingleUseVirtualCardsSuccessPayload" }, ({ cards }) =>
              Result.Ok(cards),
            )
            .otherwise(rejection => Result.Error(rejection)),
        )
        .flatMapOk(cards => generateMultiConsent(cards))
        .tap(() => setCardOrder(AsyncData.NotAsked()))
        .tapOk(value => {
          value.match({
            Some: consentUrl => window.location.replace(consentUrl),
            None: () => {},
          });
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    }
  };

  const generateMultiConsent = (cards: CardFragment[]) => {
    const cardsRequiringConsent = [
      ...new Set(
        Array.filterMap(cards, card =>
          card.statusInfo.__typename === "CardConsentPendingStatusInfo"
            ? Option.Some(card.statusInfo.consent.id)
            : Option.None(),
        ),
      ),
    ].map(consentId => ({ consentId }));

    if (cardsRequiringConsent.length === 0) {
      // no need for consent, redirect immediately
      return Future.value(
        Result.Ok<Option<string>, Error>(
          Option.Some(
            window.location.origin +
              Router.AccountCardsList({
                accountMembershipId: accountMembership.id,
              }),
          ),
        ),
      );
    }

    return createMultiConsent({
      input: {
        orderedConsentIds: cardsRequiringConsent,
        redirectUrl:
          window.location.origin +
          Router.AccountCardsList({
            accountMembershipId: accountMembership.id,
          }),
      },
    }).mapOk(payload =>
      match(payload.createMultiConsent)
        .with({ __typename: "CreateMultiConsentSuccessPayload" }, ({ consent }) =>
          Option.fromNullable(consent?.consentUrl),
        )
        .otherwise(() => Option.None()),
    );
  };

  const cardWizardProductRef = useRef<CardWizardProductRef>(null);
  const cardWizardFormatRef = useRef<CardWizardFormatRef>(null);
  const cardWizardSettingsRef = useRef<CardWizardSettingsRef>(null);
  const cardWizardMembersRef = useRef<CardWizardMembersRef>(null);
  const cardWizardDeliveryRef = useRef<CardWizardDeliveryRef>(null);
  const cardWizardGroupedDeliveryRef = useRef<CardWizardGroupedDeliveryRef>(null);
  const cardWizardIndividualDeliveryRef = useRef<CardWizardIndividualDeliveryRef>(null);

  const [cardOrder, setCardOrder] = useState<AsyncData<Result<string, Error>>>(
    AsyncData.NotAsked(),
  );

  const cardProducts = data?.projectInfo.cardProducts ?? [];
  const accountId = accountMembership.account?.id;
  const [membersAfterCursor, setMembersAfterCursor] = useState<string | null>(null);

  const [{ data: members, fetching }] = useQuery({
    query: GetEligibleCardMembershipsDocument,
    // not ideal but we need to keep the hook at top-level
    variables: { accountId: accountId ?? "", first: 20, after: membersAfterCursor },
    context: useMemo(() => ({ suspense: false }), []),
  });

  const hasMoreThanOneMember =
    preselectedAccountMembership != null
      ? false
      : (members?.account?.allMemberships.totalCount ?? 0) > 1;

  const canOrderPhysicalCard = step.cardFormat === "VirtualAndPhysical";

  if (accountId == null) {
    return <ErrorView />;
  }

  if (members == null && fetching) {
    return <LoadingView color={colors.current[500]} />;
  }

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null ? (
                <>
                  <LakeButton
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                    ariaLabel={t("common.closeButton")}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              ) : null}

              <View style={styles.headerTitle}>
                <Title visible={step.name === "CardProductType"}>
                  {t("cardWizard.header.cardProduct")}
                </Title>

                <Title visible={step.name === "CardProductFormat"}>
                  {t("cardWizard.header.cardFormat")}
                </Title>

                <Title visible={step.name === "CardProductSettings"}>
                  {t("cardWizard.header.cardSettings")}
                </Title>

                <Title visible={step.name === "CardProductMembers"}>
                  {t("cardWizard.header.members")}
                </Title>

                <Title visible={step.name === "CardProductDelivery"}>
                  {t("cardWizard.header.delivery")}
                </Title>

                <Title
                  visible={
                    step.name === "CardProductGroupedDelivery" ||
                    step.name === "CardProductIndividualDelivery"
                  }
                >
                  {t("cardWizard.header.address")}
                </Title>
              </View>
            </View>
          </View>

          <Separator />

          <View style={styles.contents}>
            <ScrollView
              style={styles.contentsContainer}
              contentContainerStyle={large ? styles.contentsContents : styles.mobileContents}
            >
              {match(step)
                .with({ name: "CardProductType" }, ({ cardProduct }) => (
                  <CardWizardProduct
                    accountHolderType={
                      data?.accountMembership?.account?.holder.info.__typename ===
                      "AccountHolderCompanyInfo"
                        ? "Company"
                        : "Individual"
                    }
                    ref={cardWizardProductRef}
                    cardProducts={cardProducts}
                    initialCardProduct={cardProduct}
                    onSubmit={cardProduct => setStep({ name: "CardProductFormat", cardProduct })}
                  />
                ))
                .with({ name: "CardProductFormat" }, ({ cardProduct, cardFormat }) => (
                  <CardWizardFormat
                    ref={cardWizardFormatRef}
                    cardProduct={cardProduct}
                    initialCardFormat={cardFormat}
                    canOrderPhysicalCards={canOrderPhysicalCards}
                    onSubmit={cardFormat =>
                      setStep({ name: "CardProductSettings", cardProduct, cardFormat })
                    }
                  />
                ))
                .with(
                  { name: "CardProductSettings" },
                  ({
                    cardName,
                    cardProduct,
                    cardFormat,
                    spendingLimit,
                    eCommerce,
                    withdrawal,
                    international,
                    nonMainCurrencyTransactions,
                  }) => (
                    <CardWizardSettings
                      ref={cardWizardSettingsRef}
                      cardProduct={cardProduct}
                      cardFormat={cardFormat}
                      initialSettings={{
                        cardName,
                        spendingLimit,
                        eCommerce,
                        withdrawal,
                        international,
                        nonMainCurrencyTransactions,
                      }}
                      accountHolder={accountMembership.account?.holder}
                      onSubmit={cardSettings => {
                        if (hasMoreThanOneMember) {
                          setStep({
                            name: "CardProductMembers",
                            cardProduct,
                            cardFormat,
                            ...cardSettings,
                          });
                        } else {
                          const memberships =
                            preselectedAccountMembership != null
                              ? [preselectedAccountMembership]
                              : members?.account?.memberships.edges.map(({ node }) => node) ?? [];
                          if (canOrderPhysicalCard) {
                            setStep({
                              name: "CardProductIndividualDelivery",
                              cardProduct,
                              cardFormat,
                              memberships,
                              ...cardSettings,
                            });
                          } else {
                            if (cardFormat === "SingleUseVirtual") {
                              addSingleUseCardsWrapper({
                                cardProductId: cardProduct.id,
                                consentRedirectUrl:
                                  window.location.origin +
                                  Router.AccountCardsList({
                                    accountMembershipId: accountMembership.id,
                                  }),
                                cards: memberships.map(accountMembership => {
                                  return {
                                    name: cardSettings.cardName,
                                    accountMembershipId: accountMembership.id,
                                    spendingLimit: cardSettings.spendingLimit,
                                  };
                                }),
                              });
                            } else {
                              addCardsWrapper({
                                cardProductId: cardProduct.id,
                                consentRedirectUrl:
                                  window.location.origin +
                                  Router.AccountCardsList({
                                    accountMembershipId: accountMembership.id,
                                  }),
                                cards: memberships.map(membership => {
                                  return {
                                    accountMembershipId: membership.id,
                                    spendingLimit: cardSettings.spendingLimit,
                                    name: cardSettings.cardName,
                                    eCommerce: cardSettings.eCommerce,
                                    withdrawal: cardSettings.withdrawal,
                                    international: cardSettings.international,
                                    nonMainCurrencyTransactions:
                                      cardSettings.nonMainCurrencyTransactions,
                                  };
                                }),
                              });
                            }
                          }
                        }
                      }}
                    />
                  ),
                )
                .with(
                  { name: "CardProductMembers" },
                  ({
                    cardProduct,
                    cardFormat,
                    cardName,
                    memberships,
                    spendingLimit,
                    eCommerce,
                    withdrawal,
                    international,
                    nonMainCurrencyTransactions,
                  }) =>
                    members == null ? null : (
                      <CardWizardMembers
                        ref={cardWizardMembersRef}
                        cardProduct={cardProduct}
                        accountId={accountId}
                        initialMemberships={memberships}
                        members={members}
                        setAfter={setMembersAfterCursor}
                        onSubmit={memberships => {
                          if (canOrderPhysicalCard) {
                            if (memberships.length === 1) {
                              setStep({
                                name: "CardProductIndividualDelivery",
                                cardProduct,
                                cardFormat,
                                memberships,
                                spendingLimit,
                                eCommerce,
                                withdrawal,
                                international,
                                nonMainCurrencyTransactions,
                              });
                            } else {
                              setStep({
                                name: "CardProductDelivery",
                                cardProduct,
                                cardFormat,
                                memberships,
                                spendingLimit,
                                eCommerce,
                                withdrawal,
                                international,
                                nonMainCurrencyTransactions,
                              });
                            }
                          } else {
                            if (cardFormat === "SingleUseVirtual") {
                              addSingleUseCardsWrapper({
                                cardProductId: cardProduct.id,
                                consentRedirectUrl:
                                  window.location.origin +
                                  Router.AccountCardsList({
                                    accountMembershipId: accountMembership.id,
                                  }),

                                cards: memberships.map(member => {
                                  return {
                                    name: cardName,
                                    accountMembershipId: member.id,
                                    spendingLimit,
                                  };
                                }),
                              });
                            } else {
                              addCardsWrapper({
                                cardProductId: cardProduct.id,
                                consentRedirectUrl:
                                  window.location.origin +
                                  Router.AccountCardsList({
                                    accountMembershipId: accountMembership.id,
                                  }),
                                cards: memberships.map(member => {
                                  return {
                                    accountMembershipId: member.id,
                                    spendingLimit,
                                    name: cardName,
                                    eCommerce,
                                    withdrawal,
                                    international,
                                    nonMainCurrencyTransactions,
                                  };
                                }),
                              });
                            }
                          }
                        }}
                      />
                    ),
                )
                .with(
                  { name: "CardProductDelivery" },
                  ({
                    cardProduct,
                    cardFormat,
                    memberships,
                    spendingLimit,
                    eCommerce,
                    withdrawal,
                    international,
                    nonMainCurrencyTransactions,
                  }) => (
                    <CardWizardDelivery
                      ref={cardWizardDeliveryRef}
                      onSubmit={mode => {
                        if (mode === "Grouped") {
                          setStep({
                            name: "CardProductGroupedDelivery",
                            cardProduct,
                            cardFormat,
                            memberships,
                            spendingLimit,
                            eCommerce,
                            withdrawal,
                            international,
                            nonMainCurrencyTransactions,
                          });
                        } else {
                          setStep({
                            name: "CardProductIndividualDelivery",
                            cardProduct,
                            cardFormat,
                            memberships,
                            spendingLimit,
                            eCommerce,
                            withdrawal,
                            international,
                            nonMainCurrencyTransactions,
                          });
                        }
                      }}
                    />
                  ),
                )
                .with(
                  { name: "CardProductGroupedDelivery" },
                  ({
                    memberships,
                    cardProduct,
                    spendingLimit,
                    eCommerce,
                    cardName,
                    withdrawal,
                    international,
                    nonMainCurrencyTransactions,
                  }) => {
                    const accountMembership = data?.accountMembership;
                    if (accountMembership?.account == null || accountMembership?.user == null) {
                      return <ErrorView />;
                    }
                    return (
                      <CardWizardGroupedDelivery
                        ref={cardWizardGroupedDeliveryRef}
                        members={memberships}
                        address={{
                          addressLine1:
                            accountMembership.account.holder.residencyAddress.addressLine1 ?? "",
                          addressLine2:
                            accountMembership.account.holder.residencyAddress.addressLine2,
                          city: accountMembership.account.holder.residencyAddress.city ?? "",
                          companyName: match(accountMembership.account.holder)
                            .with(
                              { info: { __typename: "AccountHolderCompanyInfo" } },
                              ({ info: { name } }) => name,
                            )
                            .otherwise(() => undefined),
                          country: accountMembership.account.holder.residencyAddress.country ?? "",
                          firstName: accountMembership.user.firstName ?? "",
                          lastName: accountMembership.user.lastName ?? "",
                          phoneNumber: accountMembership.user.mobilePhoneNumber ?? "",
                          postalCode:
                            accountMembership.account.holder.residencyAddress.postalCode ?? "",
                          state: accountMembership.account.holder.residencyAddress.state,
                        }}
                        onSubmit={groupedDeliveryConfig => {
                          setCardOrder(AsyncData.Loading());

                          addCardsWithGroupDelivery({
                            input: {
                              cardProductId: cardProduct.id,
                              consentRedirectUrl:
                                window.location.origin +
                                Router.AccountCardsList({
                                  accountMembershipId: accountMembership.id,
                                }),
                              groupDeliveryAddress: groupedDeliveryConfig.address,
                              cards: groupedDeliveryConfig.members.map(membership => ({
                                accountMembershipId: membership.id,
                                spendingLimit,
                                eCommerce,
                                withdrawal,
                                name: cardName,
                                international,
                                nonMainCurrencyTransactions,
                                printPhysicalCard: true,
                              })),
                            },
                          })
                            .mapOkToResult(({ addCardsWithGroupDelivery }) =>
                              match(addCardsWithGroupDelivery)
                                .with(
                                  { __typename: "AddCardsWithGroupDeliverySuccessPayload" },
                                  ({ cards }) => Result.Ok(cards),
                                )
                                .otherwise(rejection => Result.Error(rejection)),
                            )
                            .flatMapOk(cards => generateMultiConsent(cards))
                            .tap(() => setCardOrder(AsyncData.NotAsked()))
                            .tapOk(value => {
                              value.match({
                                Some: consentUrl => window.location.replace(consentUrl),
                                None: () => {},
                              });
                            })
                            .tapError(() => {
                              showToast({ variant: "error", title: t("error.generic") });
                            });
                        }}
                      />
                    );
                  },
                )
                .with(
                  { name: "CardProductIndividualDelivery" },
                  ({
                    memberships,
                    cardProduct,
                    spendingLimit,
                    eCommerce,
                    cardName,
                    withdrawal,
                    international,
                    nonMainCurrencyTransactions,
                  }) => {
                    const accountMembership = data?.accountMembership;
                    if (accountMembership?.account == null || accountMembership?.user == null) {
                      return <ErrorView />;
                    }
                    return (
                      <CardWizardIndividualDelivery
                        ref={cardWizardIndividualDeliveryRef}
                        members={memberships}
                        address={{
                          addressLine1:
                            accountMembership.account.holder.residencyAddress.addressLine1 ?? "",
                          addressLine2:
                            accountMembership.account.holder.residencyAddress.addressLine2,
                          city: accountMembership.account.holder.residencyAddress.city ?? "",
                          companyName: match(accountMembership.account.holder)
                            .with(
                              { info: { __typename: "AccountHolderCompanyInfo" } },
                              ({ info: { name } }) => name,
                            )
                            .otherwise(() => undefined),
                          country: accountMembership.account.holder.residencyAddress.country ?? "",
                          firstName: accountMembership.user.firstName ?? "",
                          lastName: accountMembership.user.lastName ?? "",
                          phoneNumber: accountMembership.user.mobilePhoneNumber ?? "",
                          postalCode:
                            accountMembership.account.holder.residencyAddress.postalCode ?? "",
                          state: accountMembership.account.holder.residencyAddress.state,
                        }}
                        onSubmit={individualDeliveryConfig => {
                          addCardsWrapper({
                            cardProductId: cardProduct.id,
                            consentRedirectUrl:
                              window.location.origin +
                              Router.AccountCardsList({
                                accountMembershipId: accountMembership.id,
                              }),
                            cards: individualDeliveryConfig.map(
                              ({
                                member,
                                address: {
                                  firstName,
                                  lastName,
                                  companyName,
                                  phoneNumber,
                                  ...address
                                },
                              }) => ({
                                accountMembershipId: member.id,
                                spendingLimit,
                                eCommerce,
                                name: cardName,
                                withdrawal,
                                international,
                                nonMainCurrencyTransactions,
                                physicalCard: {
                                  deliveryAddress: address,
                                },
                              }),
                            ),
                          });
                        }}
                      />
                    );
                  },
                )
                .exhaustive()}
            </ScrollView>
          </View>

          <View style={styles.buttonsContainer}>
            <View style={[styles.buttonsContents, !large && styles.mobileZonePadding]}>
              <LakeButtonGroup>
                <LakeButton
                  mode="secondary"
                  style={styles.button}
                  onPress={() =>
                    match(step)
                      .with({ name: "CardProductType" }, () => onPressClose?.())
                      .with({ name: "CardProductFormat" }, ({ name, ...rest }) =>
                        cardProducts.length <= 1
                          ? onPressClose?.()
                          : setStep({ name: "CardProductType", ...rest }),
                      )
                      .with({ name: "CardProductSettings" }, ({ cardProduct, name, ...rest }) =>
                        setStep({ name: "CardProductFormat", cardProduct, ...rest }),
                      )
                      .with({ name: "CardProductMembers" }, ({ name, ...rest }) =>
                        setStep({ name: "CardProductSettings", ...rest }),
                      )
                      .with({ name: "CardProductDelivery" }, ({ name, ...rest }) =>
                        setStep({ name: "CardProductMembers", ...rest }),
                      )
                      .with(
                        { name: "CardProductGroupedDelivery" },
                        { name: "CardProductIndividualDelivery" },
                        ({ name, ...rest }) =>
                          setStep(
                            rest.memberships.length === 1
                              ? hasMoreThanOneMember
                                ? { name: "CardProductMembers", ...rest }
                                : { name: "CardProductSettings", ...rest }
                              : { name: "CardProductDelivery", ...rest },
                          ),
                      )
                      .otherwise(() => {})
                  }
                >
                  {match(step.name)
                    .with("CardProductType", () => t("common.cancel"))
                    .with("CardProductFormat", () =>
                      cardProducts.length <= 1 ? t("common.cancel") : t("common.previous"),
                    )
                    .with("CardProductSettings", () => t("common.previous"))
                    .with("CardProductMembers", () => t("common.previous"))
                    .with("CardProductDelivery", () => t("common.previous"))
                    .otherwise(() => t("common.previous"))}
                </LakeButton>

                <LakeButton
                  mode="primary"
                  color="current"
                  style={styles.button}
                  loading={cardOrder.isLoading()}
                  onPress={() =>
                    match(step.name)
                      .with("CardProductType", () => {
                        cardWizardProductRef.current?.submit();
                      })
                      .with("CardProductFormat", () => {
                        cardWizardFormatRef.current?.submit();
                      })
                      .with("CardProductSettings", () => {
                        cardWizardSettingsRef.current?.submit();
                      })
                      .with("CardProductMembers", () => {
                        cardWizardMembersRef.current?.submit();
                      })
                      .with("CardProductDelivery", () => {
                        cardWizardDeliveryRef.current?.submit();
                      })
                      .with("CardProductGroupedDelivery", () => {
                        cardWizardGroupedDeliveryRef.current?.submit();
                      })
                      .with("CardProductIndividualDelivery", () => {
                        cardWizardIndividualDeliveryRef.current?.submit();
                      })
                      .otherwise(() => {})
                  }
                >
                  {t("common.next")}
                </LakeButton>
              </LakeButtonGroup>
            </View>
          </View>
        </View>
      )}
    </ResponsiveContainer>
  );
};
