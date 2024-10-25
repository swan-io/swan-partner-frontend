import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AccountMembershipFragment, UpdateAccountMembershipDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { MembershipCancelConfirmationModal } from "./MembershipCancelConfirmationModal";

const styles = StyleSheet.create({
  columns: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  column: {
    width: "50%",
  },
});

type AccountMembershipWithBindingUserError = AccountMembershipFragment & {
  statusInfo: { __typename: "AccountMembershipBindingUserErrorStatusInfo" };
  user: { __typename: "User" };
};

type Props = {
  currentUserAccountMembershipId: string;
  editingAccountMembershipId: string;
  accountMembership: AccountMembershipWithBindingUserError;
  onAction: () => void;
};

export const MembershipConflictResolutionEditor = ({
  currentUserAccountMembershipId,
  editingAccountMembershipId,
  accountMembership,
  onAction,
}: Props) => {
  const [updateMembership, membershipUpdate] = useMutation(UpdateAccountMembershipDocument);
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);

  const acceptMembership = () => {
    updateMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
        restrictedTo: {
          firstName: accountMembership.user.firstName,
          lastName: accountMembership.user.lastName,
          birthDate: accountMembership.user.birthDate,
          phoneNumber: accountMembership.user.mobilePhoneNumber,
        },
        consentRedirectUrl:
          window.location.origin +
          Router.AccountMembersList({
            accountMembershipId: currentUserAccountMembershipId,
          }),
      },
    })
      .mapOk(data => data.updateAccountMembership)
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
      <ScrollView>
        <View style={styles.columns}>
          <View style={styles.column}>
            <LakeHeading level={3} variant="h4">
              {t("membershipDetail.bindingUserError.fromYou")}
            </LakeHeading>

            <Space height={24} />

            <ReadOnlyFieldList>
              <LakeLabel
                label={t("membershipDetail.bindingUserError.firstName")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {accountMembership.statusInfo.restrictedTo.firstName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.lastName")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {accountMembership.statusInfo.restrictedTo.lastName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.birthDate")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {dayjs(accountMembership.statusInfo.restrictedTo.birthDate).format("L")}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.phoneNumber")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {accountMembership.statusInfo.restrictedTo.phoneNumber}
                  </LakeText>
                )}
              />
            </ReadOnlyFieldList>
          </View>

          <View style={styles.column}>
            <LakeHeading level={3} variant="h4">
              {t("membershipDetail.bindingUserError.fromUser")}
            </LakeHeading>

            <Space height={24} />

            <ReadOnlyFieldList>
              <LakeLabel
                label={t("membershipDetail.bindingUserError.firstName")}
                readOnly={true}
                readOnlyColor={
                  accountMembership.user.firstName !==
                  accountMembership.statusInfo.restrictedTo.firstName
                    ? colors.negative[500]
                    : colors.gray[500]
                }
                render={() => (
                  <LakeText
                    variant={
                      accountMembership.user.firstName !==
                      accountMembership.statusInfo.restrictedTo.firstName
                        ? "semibold"
                        : "regular"
                    }
                    color={
                      accountMembership.user.firstName !==
                      accountMembership.statusInfo.restrictedTo.firstName
                        ? colors.negative[500]
                        : colors.gray[900]
                    }
                  >
                    {accountMembership.user.firstName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.lastName")}
                readOnly={true}
                readOnlyColor={
                  accountMembership.user.lastName !==
                  accountMembership.statusInfo.restrictedTo.lastName
                    ? colors.negative[500]
                    : colors.gray[500]
                }
                render={() => (
                  <LakeText
                    variant={
                      accountMembership.user.lastName !==
                      accountMembership.statusInfo.restrictedTo.lastName
                        ? "semibold"
                        : "regular"
                    }
                    color={
                      accountMembership.user.lastName !==
                      accountMembership.statusInfo.restrictedTo.lastName
                        ? colors.negative[500]
                        : colors.gray[900]
                    }
                  >
                    {accountMembership.user.lastName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.birthDate")}
                readOnly={true}
                readOnlyColor={
                  accountMembership.user.birthDate !==
                  accountMembership.statusInfo.restrictedTo.birthDate
                    ? colors.negative[500]
                    : colors.gray[500]
                }
                render={() => (
                  <LakeText
                    variant={
                      accountMembership.user.birthDate !==
                      accountMembership.statusInfo.restrictedTo.birthDate
                        ? "semibold"
                        : "regular"
                    }
                    color={
                      accountMembership.user.birthDate !==
                      accountMembership.statusInfo.restrictedTo.birthDate
                        ? colors.negative[500]
                        : colors.gray[900]
                    }
                  >
                    {dayjs(accountMembership.user.birthDate).format("L")}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.phoneNumber")}
                readOnly={true}
                readOnlyColor={
                  accountMembership.user.mobilePhoneNumber !==
                  accountMembership.statusInfo.restrictedTo.phoneNumber
                    ? colors.negative[500]
                    : colors.gray[500]
                }
                render={() => (
                  <LakeText
                    variant={
                      accountMembership.user.mobilePhoneNumber !==
                      accountMembership.statusInfo.restrictedTo.phoneNumber
                        ? "semibold"
                        : "regular"
                    }
                    color={
                      accountMembership.user.mobilePhoneNumber !==
                      accountMembership.statusInfo.restrictedTo.phoneNumber
                        ? colors.negative[500]
                        : colors.gray[900]
                    }
                  >
                    {accountMembership.user.mobilePhoneNumber}
                  </LakeText>
                )}
              />
            </ReadOnlyFieldList>
          </View>
        </View>
      </ScrollView>

      <LakeButtonGroup>
        <LakeButton
          color="current"
          onPress={acceptMembership}
          loading={membershipUpdate.isLoading()}
        >
          {t("membershipDetail.bindingUserError.accept")}
        </LakeButton>

        <LakeButton
          color="negative"
          mode="secondary"
          icon="subtract-circle-regular"
          onPress={() => setIsCancelConfirmationModalOpen(true)}
        >
          {t("membershipDetail.bindingUserError.blockPermanently")}
        </LakeButton>
      </LakeButtonGroup>

      <MembershipCancelConfirmationModal
        visible={isCancelConfirmationModalOpen}
        onPressClose={() => setIsCancelConfirmationModalOpen(false)}
        accountMembershipId={editingAccountMembershipId}
        onSuccess={() => {
          Router.push("AccountMembersList", {
            accountMembershipId: currentUserAccountMembershipId,
          });
          onAction();
        }}
      />
    </>
  );
};
