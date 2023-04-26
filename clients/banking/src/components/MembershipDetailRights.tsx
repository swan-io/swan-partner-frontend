import { Result } from "@swan-io/boxed";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useForm } from "react-ux-form";
import { P, isMatching, match } from "ts-pattern";
import {
  AccountMembershipFragment,
  ResumeAccountMembershipDocument,
  SuspendAccountMembershipDocument,
  UpdateAccountMembershipDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { MembershipCancelConfirmationModal } from "./MembershipCancelConfirmationModal";

const styles = StyleSheet.create({
  buttonGroup: {
    backgroundColor: backgroundColor.default,
    position: "sticky",
    bottom: 0,
  },
});

type AllowedStatuses =
  | "AccountMembershipConsentPendingStatusInfo"
  | "AccountMembershipDisabledStatusInfo"
  | "AccountMembershipEnabledStatusInfo"
  | "AccountMembershipInvitationSentStatusInfo"
  | "AccountMembershipSuspendedStatusInfo"
  | "AccountMembershipBindingUserErrorStatusInfo";

type Props = {
  accountCountry: CountryCCA3;
  currentUserAccountMembership: AccountMembershipFragment;
  currentUserAccountMembershipId: string;
  editingAccountMembership: AccountMembershipFragment & {
    statusInfo: {
      __typename: AllowedStatuses;
    };
  };
  editingAccountMembershipId: string;
  onRefreshRequest: () => void;
  large: boolean;
};

export const MembershipDetailRights = ({
  editingAccountMembership,
  editingAccountMembershipId,
  currentUserAccountMembership,
  currentUserAccountMembershipId,
  onRefreshRequest,
  large,
}: Props) => {
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);

  const [membershipUpdate, updateMembership] = useUrqlMutation(UpdateAccountMembershipDocument);

  const [membershipSuspension, suspendMembership] = useUrqlMutation(
    SuspendAccountMembershipDocument,
  );
  const [membershipUnsuspension, unsuspendMembership] = useUrqlMutation(
    ResumeAccountMembershipDocument,
  );

  const { Field, submitForm } = useForm({
    canViewAccount: {
      initialValue: editingAccountMembership.canViewAccount,
    },
    canInitiatePayments: {
      initialValue: editingAccountMembership.canInitiatePayments,
    },
    canManageBeneficiaries: {
      initialValue: editingAccountMembership.canManageBeneficiaries,
    },
    canManageAccountMembership: {
      initialValue: editingAccountMembership.canManageAccountMembership,
    },
  });

  const hasEditableStatus = isMatching(
    {
      statusInfo: {
        __typename: P.union(
          "AccountMembershipInvitationSentStatusInfo",
          "AccountMembershipEnabledStatusInfo",
          "AccountMembershipBindingUserErrorStatusInfo",
        ),
      },
    },
    editingAccountMembership,
  );

  const accountMemberHasBirthDate = isMatching(
    P.union(
      {
        statusInfo: {
          __typename: P.union(
            "AccountMembershipInvitationSentStatusInfo",
            "AccountMembershipBindingUserErrorStatusInfo",
          ),
          restrictedTo: { birthDate: P.string },
        },
      },
      {
        statusInfo: {
          __typename: "AccountMembershipEnabledStatusInfo",
        },
        user: {
          birthDate: P.string,
        },
      },
    ),
    editingAccountMembership,
  );

  const isEditingCurrentUserAccountMembership =
    currentUserAccountMembership.id === editingAccountMembership.id;

  const onPressSave = () => {
    submitForm(rights => {
      updateMembership({
        input: {
          accountMembershipId: editingAccountMembershipId,
          consentRedirectUrl:
            window.location.origin +
            Router.AccountMembersDetailsRights({
              accountMembershipId: currentUserAccountMembershipId,
              editingAccountMembershipId,
            }),
          ...rights,
        },
      })
        .mapOkToResult(({ updateAccountMembership }) => {
          return match(updateAccountMembership)
            .with(
              { __typename: "UpdateAccountMembershipSuccessPayload" },
              ({ consent: { consentUrl } }) => Result.Ok(consentUrl),
            )
            .otherwise(error => Result.Error(error));
        })
        .tapOk(consentUrl => {
          window.location.replace(consentUrl);
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    });
  };

  const onPressSuspend = () => {
    suspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
      },
    })
      .mapOkToResult(({ suspendAccountMembership }) => {
        return match(suspendAccountMembership)
          .with({ __typename: "SuspendAccountMembershipSuccessPayload" }, () =>
            Result.Ok(undefined),
          )
          .otherwise(error => Result.Error(error));
      })
      .tapOk(() => {
        onRefreshRequest();
      })
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  const onPressUnsuspend = () => {
    unsuspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountMembersDetailsRoot({
            accountMembershipId: currentUserAccountMembershipId,
            editingAccountMembershipId,
          }),
      },
    })
      .mapOkToResult(({ resumeAccountMembership }) => {
        return match(resumeAccountMembership)
          .with(
            { __typename: "ResumeAccountMembershipSuccessPayload" },
            ({ consent: { consentUrl } }) => Result.Ok(consentUrl),
          )
          .otherwise(error => Result.Error(error));
      })
      .tapOk(consentUrl => {
        window.location.replace(consentUrl);
      })
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  return (
    <>
      <Space height={24} />

      <LakeLabel
        label={t("membershipDetail.edit.rights")}
        render={() => (
          <>
            <Space height={8} />

            <Field name="canViewAccount">
              {({ value, onChange }) => (
                <LakeLabelledCheckbox
                  disabled={
                    currentUserAccountMembership.canViewAccount === false ||
                    accountMemberHasBirthDate === false ||
                    hasEditableStatus === false ||
                    isEditingCurrentUserAccountMembership === true ||
                    editingAccountMembership.legalRepresentative === true
                  }
                  label={t("membershipDetail.edit.canViewAccount")}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            </Field>

            <Space height={12} />

            <Field name="canInitiatePayments">
              {({ value, onChange }) => (
                <LakeLabelledCheckbox
                  disabled={
                    currentUserAccountMembership.canInitiatePayments === false ||
                    accountMemberHasBirthDate === false ||
                    hasEditableStatus === false ||
                    isEditingCurrentUserAccountMembership === true ||
                    editingAccountMembership.legalRepresentative === true
                  }
                  label={t("membershipDetail.edit.canInitiatePayments")}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            </Field>

            <Space height={12} />

            <Field name="canManageBeneficiaries">
              {({ value, onChange }) => (
                <LakeLabelledCheckbox
                  disabled={
                    currentUserAccountMembership.canManageBeneficiaries === false ||
                    accountMemberHasBirthDate === false ||
                    hasEditableStatus === false ||
                    isEditingCurrentUserAccountMembership === true ||
                    editingAccountMembership.legalRepresentative === true
                  }
                  label={t("membershipDetail.edit.canManageBeneficiaries")}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            </Field>

            <Space height={12} />

            <Field name="canManageAccountMembership">
              {({ value, onChange }) => (
                <LakeLabelledCheckbox
                  disabled={
                    currentUserAccountMembership.canManageAccountMembership === false ||
                    accountMemberHasBirthDate === false ||
                    hasEditableStatus === false ||
                    isEditingCurrentUserAccountMembership === true ||
                    editingAccountMembership.legalRepresentative === true
                  }
                  label={t("membershipDetail.edit.canManageAccountMembership")}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            </Field>
          </>
        )}
      />

      <Fill minHeight={24} />

      <View style={styles.buttonGroup}>
        <LakeButtonGroup paddingBottom={0}>
          {match(editingAccountMembership)
            .with(
              {
                statusInfo: {
                  __typename: P.union(
                    "AccountMembershipEnabledStatusInfo",
                    "AccountMembershipInvitationSentStatusInfo",
                    "AccountMembershipBindingUserErrorStatusInfo",
                  ),
                },
              },
              () => (
                <LakeButton
                  color="current"
                  loading={membershipUpdate.isLoading()}
                  disabled={isEditingCurrentUserAccountMembership}
                  onPress={onPressSave}
                >
                  {t("common.save")}
                </LakeButton>
              ),
            )
            .otherwise(() => null)}

          {match({ isEditingCurrentUserAccountMembership, editingAccountMembership })
            .with(
              // Can't suspend yourself
              { isEditingCurrentUserAccountMembership: true },
              // Can't suspend the account legal representative
              {
                editingAccountMembership: { legalRepresentative: true },
              },
              () => null,
            )
            .with(
              {
                editingAccountMembership: {
                  statusInfo: {
                    __typename: "AccountMembershipEnabledStatusInfo",
                  },
                },
              },
              () => (
                <LakeButton
                  mode="secondary"
                  icon="lock-closed-regular"
                  loading={membershipSuspension.isLoading()}
                  onPress={onPressSuspend}
                  ariaLabel={t("membershipDetail.suspend")}
                >
                  {large ? t("membershipDetail.suspend") : null}
                </LakeButton>
              ),
            )
            .with(
              {
                editingAccountMembership: {
                  statusInfo: { __typename: "AccountMembershipSuspendedStatusInfo" },
                },
              },
              () => (
                <LakeButton
                  mode="primary"
                  icon="lock-open-filled"
                  loading={membershipUnsuspension.isLoading()}
                  onPress={onPressUnsuspend}
                  color="warning"
                  ariaLabel={t("membershipDetail.unsuspend")}
                >
                  {large ? t("membershipDetail.unsuspend") : null}
                </LakeButton>
              ),
            )
            .otherwise(() => null)}

          {match({ isEditingCurrentUserAccountMembership, editingAccountMembership })
            .with(
              // Can't remove yourself
              { isEditingCurrentUserAccountMembership: true },
              // Can't remove the account legal representative
              {
                editingAccountMembership: { legalRepresentative: true },
              },
              () => null,
            )
            .otherwise(() => (
              <LakeButton
                mode="secondary"
                icon="subtract-circle-regular"
                color="negative"
                onPress={() => setIsCancelConfirmationModalOpen(true)}
                ariaLabel={t("membershipDetail.permanentlyBlock")}
              >
                {large ? t("membershipDetail.permanentlyBlock") : null}
              </LakeButton>
            ))}
        </LakeButtonGroup>
      </View>

      <MembershipCancelConfirmationModal
        visible={isCancelConfirmationModalOpen}
        onPressClose={() => setIsCancelConfirmationModalOpen(false)}
        accountMembershipId={editingAccountMembershipId}
        onSuccess={() => {
          Router.push("AccountMembersList", {
            accountMembershipId: currentUserAccountMembershipId,
          });
          onRefreshRequest();
        }}
      />
    </>
  );
};
