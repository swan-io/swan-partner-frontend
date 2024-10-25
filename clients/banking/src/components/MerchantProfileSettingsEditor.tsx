import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef } from "react";
import { MerchantProfileFragment, RequestMerchantProfileUpdateDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  MerchantProfileEditor,
  MerchantProfileEditorRef,
  MerchantProfileEditorState,
} from "./MerchantProfileEditor";

type Props = {
  merchantProfile: MerchantProfileFragment;
  onCancel: () => void;
  onSuccess: () => void;
};

export const MerchantProfileSettingsEditor = ({ merchantProfile, onSuccess, onCancel }: Props) => {
  const [requestMerchantProfileUpdate, merchantProfileUpdateRequest] = useMutation(
    RequestMerchantProfileUpdateDocument,
  );

  const editorRef = useRef<MerchantProfileEditorRef>(null);

  const onPressSubmit = () => {
    if (editorRef.current != null) {
      editorRef.current.submit();
    }
  };

  const onSubmit = (input: MerchantProfileEditorState) => {
    requestMerchantProfileUpdate({
      input: {
        merchantProfileId: merchantProfile.id,
        ...input,
      },
    })
      .mapOkToResult(data =>
        Option.fromNullable(data.requestMerchantProfileUpdate).toResult("No data"),
      )
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        onSuccess();
      })
      .tapError(error => {
        showToast({ variant: "error", title: translateError(error), error });
      });
  };

  return (
    <>
      <Space height={32} />

      {merchantProfile.requestMerchantProfileUpdate != null ? (
        <>
          <LakeAlert
            variant="info"
            title={t("merchantProfile.settings.update.requestInProgress")}
          />

          <Space height={32} />
        </>
      ) : null}

      <MerchantProfileEditor
        ref={editorRef}
        merchantProfile={merchantProfile}
        onSubmit={onSubmit}
      />

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton grow={true} mode="secondary" onPress={onCancel}>
          {t("common.cancel")}
        </LakeButton>

        <LakeButton
          grow={true}
          mode="primary"
          color="current"
          onPress={onPressSubmit}
          loading={merchantProfileUpdateRequest.isLoading()}
        >
          {t("common.save")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};
