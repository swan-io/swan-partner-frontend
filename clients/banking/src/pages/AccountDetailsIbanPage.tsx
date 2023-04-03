import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Link } from "@swan-io/lake/src/components/Link";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { getCountryNameByCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { LakeCopyTextLine } from "../components/LakeCopyTextLine";
import { AccountDetailsIbanPageDocument } from "../graphql/partner";
import { formatNestedMessage, t } from "../utils/i18n";
import { printIbanFormat } from "../utils/iban";
import { useQueryWithErrorBoundary } from "../utils/urql";
import { NotFoundPage } from "./NotFoundPage";

const styles = StyleSheet.create({
  italic: {
    fontStyle: "italic",
  },
  partnerColor: {
    color: colors.partner.primary,
  },
});

const UNAVAILABLE_VALUE = <LakeText style={styles.italic}>{t("common.unavailable")}</LakeText>;
const UNKNOWN_VALUE = <LakeText style={styles.italic}>{t("common.unknown")}</LakeText>;

const joinNonEmpty = (array: (string | null | undefined)[], separator: string) =>
  array.filter(isNotNullishOrEmpty).join(separator);

const IBANCopyLine = ({ IBAN }: { IBAN: string }) => (
  <LakeCopyTextLine
    label={t("accountDetails.iban.ibanLabel")}
    text={useMemo(() => printIbanFormat(IBAN), [IBAN])}
  />
);

type Props = {
  accountId: string;
  accountMembershipId: string;
  idVerified: boolean;
  userStatusIsProcessing: boolean;
};

export const AccountDetailsIbanPage = ({
  // accountMembershipId,
  // idVerified,
  // userStatusIsProcessing,
  accountId,
}: Props) => {
  const [
    {
      data: { account },
    },
  ] = useQueryWithErrorBoundary({
    query: AccountDetailsIbanPageDocument,
    variables: { accountId },
  });

  if (!account) {
    return <NotFoundPage />;
  }

  const { BIC, IBAN, holder, statusInfo } = account;
  const { residencyAddress: address, verificationStatus } = holder;
  const accountClosed = statusInfo.status === "Closing" || statusInfo.status === "Closed";

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

      <Tile
        paddingVertical={24}
        footer={
          isNullishOrEmpty(IBAN) &&
          !accountClosed &&
          match(verificationStatus)
            .with("NotStarted", () => (
              <LakeAlert
                variant="warning"
                anchored={true}
                title={t("accountDetails.iban.verificationNotStartedTitle")}
                // callToAction={
                //   <LakeButton
                //     mode="tertiary"
                //     size="small"
                //     icon="arrow-right-filled"
                //     color="warning"
                //     onPress={() => {
                //       Router.push("AccountActivation", { accountMembershipId });
                //     }}
                //   >
                //     Go to
                //   </LakeButton>
                // }
              >
                {t("accountDetails.iban.verificationNotStartedText")}
              </LakeAlert>
            ))
            .with("Pending", () => (
              <LakeAlert
                variant="info"
                anchored={true}
                title={t("accountDetails.iban.verificationPendingTitle")}
              >
                {t("accountDetails.iban.verificationPendingText")}
              </LakeAlert>
            ))
            .otherwise(() => null)
        }
      >
        {!accountClosed && (
          <>
            {isNotNullishOrEmpty(IBAN) ? (
              <IBANCopyLine IBAN={IBAN} />
            ) : (
              <LakeLabel
                label={t("accountDetails.iban.ibanLabel")}
                render={() => UNAVAILABLE_VALUE}
                actions={
                  <LakeTooltip
                    content={t("accountDetails.iban.ibanUnavailableTooltip")}
                    placement="top"
                    togglableOnFocus={true}
                    hideArrow={true}
                  >
                    <Icon name="error-circle-regular" size={20} tabIndex={0} />
                  </LakeTooltip>
                }
              />
            )}

            <Separator space={12} />
          </>
        )}

        {isNotNullishOrEmpty(IBAN) ? (
          <LakeCopyTextLine label={t("accountDetails.iban.bicLabel")} text={BIC} />
        ) : (
          <LakeLabel
            label={t("accountDetails.iban.bicLabel")}
            render={() => UNAVAILABLE_VALUE}
            actions={
              <LakeTooltip
                content={t("accountDetails.iban.bicUnavailableTooltip")}
                placement="top"
                togglableOnFocus={true}
                hideArrow={true}
              >
                <Icon name="error-circle-regular" size={20} tabIndex={0} />
              </LakeTooltip>
            }
          />
        )}

        <Separator space={12} />

        <LakeLabel
          label={t("accountDetails.iban.holderLabel")}
          render={() => <LakeText color={colors.gray[900]}>{holder.info.name}</LakeText>}
        />
      </Tile>

      <Space height={32} />

      <LakeHeading level={2} variant="h4">
        {t("accountDetails.title.address")}
      </LakeHeading>

      <Space height={12} />

      <Tile paddingVertical={24}>
        <LakeText>
          {formatNestedMessage("accountDetails.updateEmailMention", {
            emailAddress: (
              <Link to="mailto:support@swan.io" style={styles.partnerColor}>
                support@swan.io
              </Link>
            ),
          })}
        </LakeText>

        <Space height={12} />

        <LakeLabel
          label={t("accountDetails.iban.addressLabel")}
          render={() => (
            <LakeText color={colors.gray[900]}>
              {joinNonEmpty([address.addressLine1, address.addressLine2], "\r\n")}
            </LakeText>
          )}
        />

        <Separator space={12} />

        <LakeLabel
          label={t("accountDetails.iban.cityLabel")}
          render={() => <LakeText color={colors.gray[900]}>{address.city ?? ""}</LakeText>}
        />

        <Separator space={12} />

        <LakeLabel
          label={t("accountDetails.zipcodeLabel")}
          render={() => <LakeText color={colors.gray[900]}>{address.postalCode ?? ""}</LakeText>}
        />

        <Separator space={12} />

        <LakeLabel
          label={t("accountDetails.iban.countryLabel")}
          render={() => (
            <LakeText color={colors.gray[900]}>
              {getCountryNameByCCA3(address.country ?? "") ?? UNKNOWN_VALUE}
            </LakeText>
          )}
        />
      </Tile>
    </View>
  );
};
