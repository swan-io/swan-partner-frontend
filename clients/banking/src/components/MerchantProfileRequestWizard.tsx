import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef } from "react";
import { AddMerchantProfileDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  MerchantProfileEditor,
  MerchantProfileEditorRef,
  MerchantProfileEditorState,
} from "./MerchantProfileEditor";
import { WizardLayout } from "./WizardLayout";

const MerchantProfileRequestEditor = ({
  accountId,
  accountMembershipId,
}: {
  accountId: string;
  accountMembershipId: string;
}) => {
  const [addMerchantProfile, merchantProfileAddition] = useMutation(AddMerchantProfileDocument);
  const editorRef = useRef<MerchantProfileEditorRef>(null);

  const onSubmit = (input: MerchantProfileEditorState) => {
    addMerchantProfile({
      input: {
        accountId,
        ...input,
      },
    })
      .mapOkToResult(data => Option.fromNullable(data.addMerchantProfile).toResult("No response"))
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      })
      .tapOk(payload => {
        Router.push("AccountMerchantsProfileSettings", {
          accountMembershipId,
          merchantProfileId: payload.merchantProfile.id,
        });
      });
  };

  const onPressSubmit = () => {
    if (editorRef.current != null) {
      editorRef.current.submit();
    }
  };

  return (
    <>
      <Tile>
        <MerchantProfileEditor ref={editorRef} onSubmit={onSubmit} />
      </Tile>

      <Space height={16} />

      <LakeButtonGroup paddingBottom={32}>
        <LakeButton
          onPress={onPressSubmit}
          color="current"
          icon="add-circle-filled"
          loading={merchantProfileAddition.isLoading()}
        >
          {t("merchantProfile.request.requestProfile")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type Props = {
  onPressClose?: () => void;
  accountId: string;
  accountMembershipId: string;
};

export const MerchantProfileRequestWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
}: Props) => {
  return (
    <WizardLayout title={t("merchantProfile.request.title")} onPressClose={onPressClose}>
      <MerchantProfileRequestEditor
        accountId={accountId}
        accountMembershipId={accountMembershipId}
      />
    </WizardLayout>
  );
};
