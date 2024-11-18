import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { BeneficiaryList } from "../components/BeneficiaryList";
import { ErrorView } from "../components/ErrorView";
import { RecurringTransferList } from "../components/RecurringTransferList";
import { TransferList } from "../components/TransferList";
import { AccountCountry } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router, paymentRoutes } from "../utils/routes";
import { BeneficiaryTypePicker } from "./BeneficiaryTypePicker";
import { Redirect } from "./Redirect";
import { TransferTypePicker } from "./TransferTypePicker";

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  containerDesktop: {
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

type Props = {
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  transferConsent: Option<{ kind: "transfer" | "standingOrder" | "beneficiary"; status: string }>;
};

export const TransferArea = ({
  accountCountry,
  accountId,
  accountMembershipId,
  transferConsent,
}: Props) => {
  const route = Router.useRoute(paymentRoutes);
  const {
    canInitiateCreditTransfer,
    canReadCreditTransfer,
    canCreateTrustedBeneficiary,
    canReadStandingOrder,
    canReadTrustedBeneficiary,
  } = usePermissions();

  useTransferToastWithRedirect(transferConsent, () => {
    match(route?.name)
      .with("AccountPaymentsBeneficiariesList", "AccountPaymentsRecurringTransferList", name => {
        Router.replace(name, { accountMembershipId });
      })
      .otherwise(() => {
        Router.replace("AccountPaymentsRoot", { accountMembershipId });
      });
  });

  const rootLevelCrumbs = useMemo(() => {
    return [
      {
        label: t("transfer.transfer"),
        link: Router.AccountPaymentsRoot({ accountMembershipId }),
      },
    ];
  }, [accountMembershipId]);

  if (
    canReadCreditTransfer === false &&
    canInitiateCreditTransfer &&
    route?.name !== "AccountPaymentsNew"
  ) {
    return <Redirect to={Router.AccountPaymentsNew({ accountMembershipId })} />;
  }

  return (
    <BreadcrumbsRoot rootLevelCrumbs={rootLevelCrumbs}>
      <View role="main" style={commonStyles.fill}>
        {match(route)
          .with(
            { name: "AccountPaymentsRoot" },
            { name: "AccountPaymentsRecurringTransferList" },
            { name: "AccountPaymentsRecurringTransferDetailsArea" },
            { name: "AccountPaymentsBeneficiariesList" },
            { name: "AccountPaymentsBeneficiariesDetails" },
            () => (
              <ResponsiveContainer breakpoint={breakpoints.large} style={commonStyles.fill}>
                {({ small, large }) => (
                  <>
                    {canInitiateCreditTransfer ? (
                      <Box direction="row">
                        <ResponsiveContainer
                          breakpoint={breakpoints.small}
                          style={[
                            styles.buttonContainer,
                            commonStyles.fill,
                            small ? styles.container : styles.containerDesktop,
                          ]}
                        >
                          {({ small }) => (
                            <LakeButton
                              grow={small}
                              onPress={() =>
                                Router.push("AccountPaymentsNew", { accountMembershipId })
                              }
                              icon="add-circle-filled"
                              size="small"
                              color="current"
                            >
                              {t("transfer.newTransfer")}
                            </LakeButton>
                          )}
                        </ResponsiveContainer>
                      </Box>
                    ) : null}

                    <Space height={24} />

                    <TabView
                      padding={small ? 24 : 40}
                      sticky={true}
                      otherLabel={t("common.tabs.other")}
                      tabs={[
                        {
                          label: t("transfer.tabs.transfers"),
                          url: Router.AccountPaymentsRoot({ accountMembershipId }),
                        },
                        ...(canReadStandingOrder
                          ? [
                              {
                                label: t("transfer.tabs.recurringTransfer"),
                                url: Router.AccountPaymentsRecurringTransferList({
                                  accountMembershipId,
                                }),
                              },
                            ]
                          : []),
                        ...(canReadTrustedBeneficiary
                          ? [
                              {
                                label: t("transfer.tabs.beneficiaries"),
                                url: Router.AccountPaymentsBeneficiariesList({
                                  accountMembershipId,
                                }),
                              },
                            ]
                          : []),
                      ]}
                    />

                    <Space height={24} />

                    {match(route)
                      .with({ name: "AccountPaymentsRoot" }, ({ params }) => (
                        <TransferList
                          accountId={accountId}
                          accountMembershipId={accountMembershipId}
                          params={params}
                        />
                      ))
                      .with(
                        { name: "AccountPaymentsRecurringTransferList" },
                        { name: "AccountPaymentsRecurringTransferDetailsArea" },
                        () =>
                          canReadStandingOrder ? (
                            <RecurringTransferList
                              accountId={accountId}
                              accountMembershipId={accountMembershipId}
                              large={large}
                            />
                          ) : (
                            <NotFoundPage />
                          ),
                      )
                      .with(
                        { name: "AccountPaymentsBeneficiariesList" },
                        { name: "AccountPaymentsBeneficiariesDetails" },
                        ({ params }) =>
                          canReadTrustedBeneficiary ? (
                            <BeneficiaryList
                              accountId={accountId}
                              accountCountry={accountCountry}
                              params={params}
                            />
                          ) : (
                            <NotFoundPage />
                          ),
                      )
                      .otherwise(() => (
                        <ErrorView />
                      ))}
                  </>
                )}
              </ResponsiveContainer>
            ),
          )
          .with({ name: "AccountPaymentsNew" }, ({ params }) =>
            canInitiateCreditTransfer ? (
              <TransferTypePicker
                accountCountry={accountCountry}
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                params={params}
              />
            ) : (
              <NotFoundPage />
            ),
          )
          .with({ name: "AccountPaymentsBeneficiariesNew" }, ({ params }) =>
            canCreateTrustedBeneficiary ? (
              <BeneficiaryTypePicker
                accountCountry={accountCountry}
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                params={params}
              />
            ) : (
              <NotFoundPage />
            ),
          )
          .otherwise(() => (
            <NotFoundPage />
          ))}
      </View>
    </BreadcrumbsRoot>
  );
};
