import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { AddMerchantProfileDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  MerchantProfileEditor,
  MerchantProfileEditorRef,
  MerchantProfileEditorState,
} from "./MerchantProfileEditor";

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
    paddingVertical: spacings[24],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
    paddingVertical: spacings[24],
  },
});

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
                  {t("merchantProfile.request.title")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            <MerchantProfileRequestEditor
              accountId={accountId}
              accountMembershipId={accountMembershipId}
            />
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
