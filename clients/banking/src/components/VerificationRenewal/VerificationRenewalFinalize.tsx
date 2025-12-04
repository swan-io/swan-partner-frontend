import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { FinalizeVerificationRenewalDocument } from "../../graphql/partner";
import { t } from "../../utils/i18n";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const VerificationRenewalFinalizeSuccess = () => {
  return (
    <View style={styles.container}>
      <BorderedIcon padding={24} name="lake-check" size={100} />

      <Space height={32} />
      <LakeHeading variant="h4" level={1}>
        {t("verificationRenewal.finalize.title")}
      </LakeHeading>

      <Space height={16} />
      <LakeText align="center">{t("verificationRenewal.finalize.subtitle")}</LakeText>

      <Space height={16} />
    </View>
  );
};

const VerificationRenewalFinalizeError = ({ verificationRenewalId }: Props) => {
  const [finalizeVerificationRenewal, finalization] = useMutation(
    FinalizeVerificationRenewalDocument,
  );

  const retry = () => {
    finalizeVerificationRenewal({
      input: {
        verificationRenewalId,
      },
    })
      .mapOk(data => data.finalizeVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({
          variant: "error",
          title: translateError(error),
        });
      });
  };

  return (
    <View style={styles.container}>
      <BorderedIcon padding={24} name="lake-error" size={100} />

      <Space height={32} />
      <LakeHeading variant="h4" level={1}>
        {t("verificationRenewal.finalize.error.title")}
      </LakeHeading>

      <Space height={16} />
      <LakeText align="center">{t("verificationRenewal.finalize.error.subtitle")}</LakeText>

      <Space height={16} />
      <LakeButton color="partner" loading={finalization.isLoading()} onPress={retry}>
        {t("verificationRenewal.finalize.error.button")}
      </LakeButton>
    </View>
  );
};

type Props = {
  verificationRenewalId: string;
};

export const VerificationRenewalFinalize = ({ verificationRenewalId }: Props) => {
  const [finalizeVerificationRenewal, finalization] = useMutation(
    FinalizeVerificationRenewalDocument,
  );

  useEffect(() => {
    finalizeVerificationRenewal({
      input: {
        verificationRenewalId,
      },
    })
      .mapOk(data => data.finalizeVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult);
  }, [verificationRenewalId, finalizeVerificationRenewal]);

  return finalization.match({
    NotAsked: () => null,
    Loading: () => <LoadingView />,
    Done: result =>
      result.match({
        Ok: () => <VerificationRenewalFinalizeSuccess />,
        Error: () => (
          <VerificationRenewalFinalizeError verificationRenewalId={verificationRenewalId} />
        ),
      }),
  });
};
