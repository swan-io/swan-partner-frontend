import { Dict, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor, colors } from "@swan-io/lake/src/constants/design";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, isMatching, match } from "ts-pattern";
import {
  AccountMembershipFragment,
  ResumeAccountMembershipDocument,
  SuspendAccountMembershipDocument,
  UpdateAccountMembershipDocument,
  UpdateAccountMembershipInput,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
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
  requiresIdentityVerification: boolean;
  editingAccountMembership: AccountMembershipFragment & {
    statusInfo: {
      __typename: AllowedStatuses;
    };
  };
  editingAccountMembershipId: string;
  onRefreshRequest: () => void;
  large: boolean;
};

type FormValues = {
  canViewAccount?: boolean;
  canInitiatePayments?: boolean;
  canManageBeneficiaries?: boolean;
  canManageAccountMembership?: boolean;
  canManageCards?: boolean;
};

const validateMustBeFalse = (value: boolean) => {
  if (value === true) {
    return "MustBeFalse";
  }
};

export const MembershipDetailRights = ({
  editingAccountMembership,
  editingAccountMembershipId,
  currentUserAccountMembership,
  currentUserAccountMembershipId,
  requiresIdentityVerification,
  onRefreshRequest,
  large,
}: Props) => {
  const { canUpdateAccountMembership } = usePermissions();

  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);
  const [valuesToConfirm, setValuesToConfirm] = useState<Option<FormValues>>(Option.None());

  const [updateMembership, membershipUpdate] = useMutation(UpdateAccountMembershipDocument);
  const [suspendMembership, membershipSuspension] = useMutation(SuspendAccountMembershipDocument);
  const [unsuspendMembership, membershipUnsuspension] = useMutation(
    ResumeAccountMembershipDocument,
  );

  const validateSensitivePermission = match(editingAccountMembership)
    .with(
      {
        statusInfo: {
          __typename: P.union(
            "AccountMembershipBindingUserErrorStatusInfo",
            "AccountMembershipInvitationSentStatusInfo",
          ),
          restrictedTo: { phoneNumber: P.nullish },
        },
      },
      () => validateMustBeFalse,
    )
    .otherwise(() => undefined);

  const { Field, FieldsListener, submitForm } = useForm({
    canViewAccount: {
      initialValue: editingAccountMembership.canViewAccount,
    },
    canInitiatePayments: {
      initialValue: editingAccountMembership.canInitiatePayments,
      validate: validateSensitivePermission,
    },
    canManageBeneficiaries: {
      initialValue: editingAccountMembership.canManageBeneficiaries,
      validate: validateSensitivePermission,
    },
    canManageAccountMembership: {
      initialValue: editingAccountMembership.canManageAccountMembership,
      validate: validateSensitivePermission,
    },
    canManageCards: {
      initialValue: editingAccountMembership.canManageCards,
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

  const sendUpdate = (rights: FormValues) => {
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
      .mapOk(data => data.updateAccountMembership)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        type FieldName = keyof UpdateAccountMembershipInput;

        showToast({
          variant: "error",
          error,
          title: match(error)
            .with(
              {
                __typename: "ValidationRejection",
                fields: P.when(value =>
                  value.some(
                    ({ path: [root] }) =>
                      root === identity<FieldName>("residencyAddress") ||
                      root === identity<FieldName>("taxIdentificationNumber"),
                  ),
                ),
              },
              () => t("error.missingAddressOrTaxNumberError"),
            )
            .otherwise(() => translateError(error)),
        });
      });
  };

  const onPressSave = () => {
    submitForm({
      onSuccess: values => {
        Option.allFromDict(values).map(rights => {
          const hasAtLeastOneRight = Dict.values(rights).some(right => right === true);

          if (requiresIdentityVerification && hasAtLeastOneRight) {
            setValuesToConfirm(Option.Some(rights));
            return;
          }

          sendUpdate(rights);
        });
      },
    });
  };

  const onPressSuspend = () => {
    suspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
      },
    })
      .mapOk(data => data.suspendAccountMembership)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        onRefreshRequest();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
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
      .mapOk(data => data.resumeAccountMembership)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <>
      <Space height={32} />

      <Field name="canViewAccount">
        {({ value, onChange }) => (
          <LakeLabelledCheckbox
            disabled={
              !canUpdateAccountMembership ||
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
        {({ value, onChange, error }) => (
          <LakeLabelledCheckbox
            disabled={
              !canUpdateAccountMembership ||
              currentUserAccountMembership.canInitiatePayments === false ||
              accountMemberHasBirthDate === false ||
              hasEditableStatus === false ||
              isEditingCurrentUserAccountMembership === true ||
              editingAccountMembership.legalRepresentative === true
            }
            label={t("membershipDetail.edit.canInitiatePayments")}
            value={value}
            onValueChange={onChange}
            isError={error != null}
          />
        )}
      </Field>

      <Space height={12} />

      <Field name="canManageBeneficiaries">
        {({ value, onChange, error }) => (
          <LakeLabelledCheckbox
            disabled={
              !canUpdateAccountMembership ||
              currentUserAccountMembership.canManageBeneficiaries === false ||
              accountMemberHasBirthDate === false ||
              hasEditableStatus === false ||
              isEditingCurrentUserAccountMembership === true ||
              editingAccountMembership.legalRepresentative === true
            }
            label={t("membershipDetail.edit.canManageBeneficiaries")}
            value={value}
            onValueChange={onChange}
            isError={error != null}
          />
        )}
      </Field>

      <Space height={12} />

      <Field name="canManageAccountMembership">
        {({ value, onChange, error }) => (
          <LakeLabelledCheckbox
            disabled={
              !canUpdateAccountMembership ||
              currentUserAccountMembership.canManageAccountMembership === false ||
              accountMemberHasBirthDate === false ||
              hasEditableStatus === false ||
              isEditingCurrentUserAccountMembership === true ||
              editingAccountMembership.legalRepresentative === true
            }
            label={t("membershipDetail.edit.canManageAccountMembership")}
            value={value}
            onValueChange={onChange}
            isError={error != null}
          />
        )}
      </Field>

      <Space height={12} />

      <Field name="canManageCards">
        {({ value, onChange }) => (
          <LakeLabelledCheckbox
            disabled={
              !canUpdateAccountMembership ||
              currentUserAccountMembership.canManageCards === false ||
              accountMemberHasBirthDate === false ||
              hasEditableStatus === false ||
              isEditingCurrentUserAccountMembership === true ||
              editingAccountMembership.legalRepresentative === true
            }
            label={t("membershipDetail.edit.canManageCards")}
            value={value}
            onValueChange={onChange}
          />
        )}
      </Field>

      <FieldsListener
        names={["canInitiatePayments", "canManageAccountMembership", "canManageBeneficiaries"]}
      >
        {({ canInitiatePayments, canManageAccountMembership, canManageBeneficiaries }) =>
          canInitiatePayments.error != null ||
          canManageAccountMembership.error != null ||
          canManageBeneficiaries.error != null ? (
            <>
              <Space height={16} />

              <LakeText color={colors.negative[500]}>
                {t("membershipDetail.edit.sensitivePermissionsRequirePhoneNumber")}
              </LakeText>
            </>
          ) : null
        }
      </FieldsListener>

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
              () =>
                canUpdateAccountMembership && !isEditingCurrentUserAccountMembership ? (
                  <LakeButton
                    color="current"
                    loading={membershipUpdate.isLoading() && valuesToConfirm.isNone()}
                    disabled={isEditingCurrentUserAccountMembership}
                    onPress={onPressSave}
                  >
                    {t("common.save")}
                  </LakeButton>
                ) : null,
            )
            .otherwise(() => null)}

          {match({
            isEditingCurrentUserAccountMembership,
            editingAccountMembership,
            canUpdateAccountMembership,
          })
            .with(
              // Can't suspend yourself
              { isEditingCurrentUserAccountMembership: true },
              // Can't suspend the account legal representative
              {
                editingAccountMembership: { legalRepresentative: true },
              },
              { canUpdateAccountMembership: false },
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

      <ConfirmModal
        visible={valuesToConfirm.isSome()}
        icon="warning-regular"
        title={t("membershipDetail.requiresVerificationConfirmation.title")}
        message={t("membershipDetail.requiresVerificationConfirmation.description")}
        confirmText={t("membershipDetail.requiresVerificationConfirmation.confirm")}
        loading={membershipUpdate.isLoading()}
        onCancel={() => setValuesToConfirm(Option.None())}
        onConfirm={() => {
          if (valuesToConfirm.isSome()) {
            sendUpdate(valuesToConfirm.value);
            // no need to close after update because the user is redirected to consent-app
          }
        }}
      />

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
