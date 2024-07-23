import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeRadio } from "@swan-io/lake/src/components/LakeRadio";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  BeneficiariesListPageDocument,
  InitiateSepaCreditTransfersDocument,
} from "../graphql/partner";
import { encodeDateTime } from "../utils/date";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { concatSepaBeneficiaryAddress } from "./BeneficiaryDetail";
import { getBeneficiaryIdentifier } from "./BeneficiaryList";
import {
  Beneficiary,
  BeneficiarySepaWizardForm,
  TransferWizardBeneficiarySummary,
} from "./BeneficiarySepaWizardForm";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import {
  Details,
  TransferRegularWizardDetails,
  TransferRegularWizardDetailsSummary,
} from "./TransferRegularWizardDetails";
import { Schedule, TransferRegularWizardSchedule } from "./TransferRegularWizardSchedule";

const NUM_TO_RENDER = 20;

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
    maxWidth: 1336,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1172,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
  tile: {
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[32],
    paddingVertical: spacings[24],
  },
  beneficiary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[16],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});

const SavedBeneficiaries = ({ accountId }: { accountId: string }) => {
  const [selected, setSelected] = useState<string>();
  const [search, setSearch] = useState("");

  const [data, { setVariables }] = useQuery(BeneficiariesListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      status: ["Enabled"],
      label: search.length >= 3 ? search : undefined,
    },
  });

  const beneficiaries = data.mapOkToResult(data =>
    Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
  );

  useEffect(() => {
    match(beneficiaries)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ edges }) => {
        setSelected(prevSelected =>
          edges.find(edge => edge.node.id === prevSelected) != null
            ? prevSelected
            : edges[0]?.node.id,
        );
      })
      .otherwise(noop);
  }, [beneficiaries]);

  return (
    <Tile style={[styles.tile, animations.fadeAndSlideInFromBottom.enter]}>
      <Box>
        <LakeTextInput
          icon="search-filled"
          placeholder={t("common.search")}
          hideErrors={true}
          value={search}
          onChangeText={setSearch}
        />
      </Box>

      {match(beneficiaries)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
          <LoadingView color={colors.partner[500]} />
        ))
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiaries => {
          return (
            <Connection connection={beneficiaries}>
              {({ edges, pageInfo }) => (
                <FlatList
                  role="radiogroup"
                  keyExtractor={({ node }) => node.id}
                  data={edges}
                  ListHeaderComponent={<Space height={8} />}
                  ItemSeparatorComponent={<Separator />}
                  contentContainerStyle={edges.length === 0 && styles.emptyContent}
                  ListEmptyComponent={
                    <FixedListViewEmpty
                      icon="lake-person-arrow-swap"
                      borderedIcon={true}
                      borderedIconPadding={16}
                      title={t("common.list.noResults")}
                      subtitle={t("common.list.noResultsSuggestion")}
                    />
                  }
                  renderItem={({ item: { node } }) => {
                    const identifier = getBeneficiaryIdentifier(node);

                    return (
                      <Pressable
                        role="radio"
                        style={() => [styles.beneficiary]}
                        onPress={() => setSelected(node.id)}
                      >
                        <LakeRadio value={node.id === selected} />
                        <Space width={24} />

                        <View>
                          <LakeText variant="medium" color={colors.gray[900]}>
                            {node.label}
                          </LakeText>

                          {match(identifier)
                            .with(Option.P.Some(P.select()), ({ text }) => (
                              <>
                                <Space height={4} />
                                <LakeText variant="smallRegular">{text}</LakeText>
                              </>
                            ))
                            .otherwise(() => null)}

                          {node.__typename === "TrustedSepaBeneficiary" &&
                            match(concatSepaBeneficiaryAddress(node.address))
                              .with(P.nonNullable, address => (
                                <>
                                  <Space height={4} />
                                  <LakeText>{address}</LakeText>
                                </>
                              ))
                              .otherwise(() => null)}
                        </View>
                      </Pressable>
                    );
                  }}
                  onEndReached={() => {
                    if (pageInfo.hasNextPage ?? false) {
                      setVariables({ after: pageInfo.endCursor });
                    }
                  }}
                />
              )}
            </Connection>
          );
        })
        .exhaustive()}
    </Tile>
  );
};

type BeneficiaryTab = "new" | "saved";

const BeneficiaryStep = ({
  accountCountry,
  accountId,
  beneficiary,
  onPressSubmit,
}: {
  accountCountry: AccountCountry;
  accountId: string;
  beneficiary: Beneficiary | undefined;
  onPressSubmit: (beneficiary: Beneficiary) => void;
}) => {
  const [activeTab, setActiveTab] = useState<BeneficiaryTab>("new");

  return (
    <>
      <LakeHeading level={2} variant="h3">
        {t("transfer.new.beneficiary.title")}
      </LakeHeading>

      <Space height={24} />

      <TabView
        activeTabId={activeTab}
        onChange={tab => setActiveTab(tab as BeneficiaryTab)}
        otherLabel={t("common.tabs.other")}
        tabs={
          [
            { id: "new", label: t("transfer.new.beneficiary.new") },
            { id: "saved", label: t("transfer.new.beneficiary.saved") },
          ] satisfies { id: BeneficiaryTab; label: string }[]
        }
      />

      <Space height={32} />

      {match(activeTab)
        .with("new", () => (
          <BeneficiarySepaWizardForm
            mode="continue"
            accountCountry={accountCountry}
            accountId={accountId}
            initialBeneficiary={beneficiary}
            onPressSubmit={onPressSubmit}
          />
        ))
        .with("saved", () => <SavedBeneficiaries accountId={accountId} />)
        .exhaustive()}
    </>
  );
};

type Step =
  | {
      name: "Beneficiary";
      beneficiary?: Beneficiary;
    }
  | {
      name: "Details";
      beneficiary: Beneficiary;
      details?: Details;
    }
  | {
      name: "Schedule";
      beneficiary: Beneficiary;
      details: Details;
    };

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  canViewAccount: boolean;
};

export const TransferRegularWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
  canViewAccount,
}: Props) => {
  const [initiateTransfers, transfer] = useMutation(InitiateSepaCreditTransfersDocument);
  const [step, setStep] = useState<Step>({ name: "Beneficiary" });

  const initiateTransfer = ({
    beneficiary,
    details,
    schedule,
  }: {
    beneficiary: Beneficiary;
    details: Details;
    schedule: Schedule;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        consentRedirectUrl:
          window.location.origin +
          (canViewAccount
            ? Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" })
            : Router.AccountPaymentsRoot({ accountMembershipId, kind: "transfer" })),
        creditTransfers: [
          {
            amount: details.amount,
            label: details.label,
            reference: details.reference,
            ...match(schedule)
              .with({ isScheduled: true }, ({ scheduledDate, scheduledTime }) => ({
                requestedExecutionAt: encodeDateTime(scheduledDate, `${scheduledTime}:00`),
              }))
              .otherwise(({ isInstant }) => ({
                mode: isInstant ? "InstantWithFallback" : "Regular",
              })),
            sepaBeneficiary: {
              name: beneficiary.name,
              save: false,
              iban: beneficiary.iban,
              isMyOwnIban: false, // TODO
            },
          },
        ],
      },
    })
      .mapOk(data => data.initiateCreditTransfers)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ payment }) => {
        const status = payment.statusInfo;
        const params = { paymentId: payment.id, accountMembershipId };

        return match(status)
          .with({ __typename: "PaymentInitiated" }, () => {
            showToast({
              variant: "success",
              title: t("transfer.consent.success.title"),
              description: t("transfer.consent.success.description"),
              autoClose: false,
            });
            Router.replace("AccountTransactionsListRoot", params);
          })
          .with({ __typename: "PaymentRejected" }, () =>
            showToast({
              variant: "error",
              title: t("transfer.consent.error.rejected.title"),
              description: t("transfer.consent.error.rejected.description"),
            }),
          )
          .with({ __typename: "PaymentConsentPending" }, ({ consent }) => {
            window.location.assign(consent.consentUrl);
          })
          .exhaustive();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null && (
                <>
                  <LakeButton
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                    ariaLabel={t("common.closeButton")}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              )}

              <View style={styles.headerTitle}>
                <LakeHeading level={2} variant="h3">
                  {t("transfer.newTransfer")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            {match(step)
              .with({ name: "Beneficiary" }, ({ beneficiary }) => (
                <BeneficiaryStep
                  accountCountry={accountCountry}
                  accountId={accountId}
                  beneficiary={beneficiary}
                  onPressSubmit={beneficiary => {
                    setStep({ name: "Details", beneficiary });
                  }}
                />
              ))
              .with({ name: "Details" }, ({ beneficiary, details }) => {
                return (
                  <>
                    <TransferWizardBeneficiarySummary
                      isMobile={!large}
                      beneficiary={beneficiary}
                      onPressEdit={() => setStep({ name: "Beneficiary", beneficiary })}
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.details.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRegularWizardDetails
                      accountMembershipId={accountMembershipId}
                      initialDetails={details}
                      onPressPrevious={() => setStep({ name: "Beneficiary", beneficiary })}
                      onSave={details => setStep({ name: "Schedule", beneficiary, details })}
                    />

                    <Space height={32} />
                  </>
                );
              })
              .with({ name: "Schedule" }, ({ beneficiary, details }) => {
                return (
                  <>
                    <TransferWizardBeneficiarySummary
                      isMobile={!large}
                      beneficiary={beneficiary}
                      onPressEdit={() => setStep({ name: "Beneficiary", beneficiary })}
                    />

                    <Space height={32} />

                    <TransferRegularWizardDetailsSummary
                      isMobile={!large}
                      details={details}
                      onPressEdit={() => setStep({ name: "Details", beneficiary, details })}
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.schedule.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRegularWizardSchedule
                      beneficiary={beneficiary}
                      loading={transfer.isLoading()}
                      onPressPrevious={() => setStep({ name: "Details", beneficiary, details })}
                      onSave={schedule => initiateTransfer({ beneficiary, details, schedule })}
                    />
                  </>
                );
              })
              .otherwise(() => null)}
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
