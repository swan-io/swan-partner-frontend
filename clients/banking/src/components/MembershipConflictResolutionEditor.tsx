import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
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
import { usePermissions } from "../hooks/usePermissions";
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
  const { canUpdateAccountMembership } = usePermissions();
  const [updateMembership, membershipUpdate] = useMutation(UpdateAccountMembershipDocument);
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);

  const { statusInfo, user } = accountMembership;
  const { restrictedTo } = statusInfo;

  const firstNamesMismatch = user.firstName !== restrictedTo.firstName;
  const birthDatesMismatch = user.birthDate !== restrictedTo.birthDate;
  const phoneNumbersMismatch =
    restrictedTo.phoneNumber != null && user.mobilePhoneNumber !== restrictedTo.phoneNumber;

  const lastNamesMismatch =
    user.lastName !== restrictedTo.lastName && user.birthLastName !== restrictedTo.lastName;

  const [selectedVerifiedEmail, setSelectedVerifiedEmail] = useState<string | undefined>(
    accountMembership.user.verifiedEmails[0],
  );

  const acceptMembership = () => {
    updateMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
        email: selectedVerifiedEmail,
        restrictedTo: {
          firstName: user.firstName,
          lastName: user.preferredLastName,
          birthDate: user.birthDate,
          phoneNumber: user.mobilePhoneNumber,
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
                    {restrictedTo.firstName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.lastName")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {restrictedTo.lastName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.birthDate")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {dayjs(restrictedTo.birthDate).format("L")}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.phoneNumber")}
                readOnly={true}
                readOnlyColor={colors.gray[500]}
                render={() =>
                  restrictedTo.phoneNumber != null ? (
                    <LakeText variant="regular" color={colors.gray[900]}>
                      {restrictedTo.phoneNumber}
                    </LakeText>
                  ) : (
                    <LakeText>{"—"}</LakeText>
                  )
                }
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.email")}
                readOnly={true}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {accountMembership.email}
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
                readOnlyColor={firstNamesMismatch ? colors.negative[500] : colors.gray[500]}
                render={() => (
                  <LakeText
                    variant={firstNamesMismatch ? "semibold" : "regular"}
                    color={firstNamesMismatch ? colors.negative[500] : colors.gray[900]}
                  >
                    {user.firstName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.lastName")}
                readOnly={true}
                readOnlyColor={lastNamesMismatch ? colors.negative[500] : colors.gray[500]}
                render={() => (
                  <LakeText
                    variant={lastNamesMismatch ? "semibold" : "regular"}
                    color={lastNamesMismatch ? colors.negative[500] : colors.gray[900]}
                  >
                    {user.preferredLastName}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.birthDate")}
                readOnly={true}
                readOnlyColor={birthDatesMismatch ? colors.negative[500] : colors.gray[500]}
                render={() => (
                  <LakeText
                    variant={birthDatesMismatch ? "semibold" : "regular"}
                    color={birthDatesMismatch ? colors.negative[500] : colors.gray[900]}
                  >
                    {dayjs(user.birthDate).format("L")}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.phoneNumber")}
                readOnly={true}
                readOnlyColor={phoneNumbersMismatch ? colors.negative[500] : colors.gray[500]}
                render={() => (
                  <LakeText
                    variant={phoneNumbersMismatch ? "semibold" : "regular"}
                    color={phoneNumbersMismatch ? colors.negative[500] : colors.gray[900]}
                  >
                    {user.mobilePhoneNumber}
                  </LakeText>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.bindingUserError.email")}
                readOnly={true}
                readOnlyColor={
                  !accountMembership.user.verifiedEmails.includes(accountMembership.email)
                    ? colors.negative[500]
                    : colors.gray[500]
                }
                render={() => (
                  <LakeText
                    variant={
                      !accountMembership.user.verifiedEmails.includes(accountMembership.email)
                        ? "semibold"
                        : "regular"
                    }
                    color={
                      !accountMembership.user.verifiedEmails.includes(accountMembership.email)
                        ? colors.negative[500]
                        : colors.gray[900]
                    }
                  >
                    {accountMembership.user.verifiedEmails.length === 1 ? (
                      accountMembership.user.verifiedEmails[0]
                    ) : (
                      <LakeSelect
                        disabled={!canUpdateAccountMembership}
                        value={selectedVerifiedEmail}
                        items={accountMembership.user.verifiedEmails.map(value => ({
                          value,
                          name: value,
                        }))}
                        onValueChange={verifiedEmail => setSelectedVerifiedEmail(verifiedEmail)}
                      />
                    )}
                  </LakeText>
                )}
              />
            </ReadOnlyFieldList>
          </View>
        </View>
      </ScrollView>

      {canUpdateAccountMembership ? (
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
      ) : null}

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
