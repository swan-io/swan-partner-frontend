import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantProfileDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantProfileSettings } from "./MerchantProfileSettings";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
});

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
  merchantProfileCardVisible: boolean;
  merchantProfileSepaDirectDebitCoreVisible: boolean;
  merchantProfileSepaDirectDebitB2BVisible: boolean;
  merchantProfileInternalDirectDebitCoreVisible: boolean;
  merchantProfileInternalDirectDebitB2BVisible: boolean;
  merchantProfileCheckVisible: boolean;
};

export const AccountMerchantsProfileArea = ({
  accountMembershipId,
  merchantProfileId,
  merchantProfileCardVisible,
  merchantProfileSepaDirectDebitCoreVisible,
  merchantProfileSepaDirectDebitB2BVisible,
  merchantProfileInternalDirectDebitCoreVisible,
  merchantProfileInternalDirectDebitB2BVisible,
  merchantProfileCheckVisible,
}: Props) => {
  const route = Router.useRoute(["AccountMerchantsProfileSettings"]);

  const [merchantProfile, { refresh }] = useQuery(MerchantProfileDocument, { merchantProfileId });

  useCrumb(
    useMemo(() => {
      return merchantProfile
        .toOption()
        .flatMap(result => result.toOption())
        .flatMap(merchantProfile => Option.fromNullable(merchantProfile.merchantProfile))
        .map(merchantProfile => ({
          label: merchantProfile.merchantName,
          link: Router.AccountMerchantsProfileSettings({ accountMembershipId, merchantProfileId }),
        }))
        .toUndefined();
    }, [merchantProfile, accountMembershipId, merchantProfileId]),
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
      {({ large }) =>
        match(merchantProfile)
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .with(AsyncData.P.Done(Result.P.Ok({ merchantProfile: P.nullish })), () => (
            <NotFoundPage />
          ))
          .with(
            AsyncData.P.Done(Result.P.Ok({ merchantProfile: P.select(P.nonNullable) })),
            merchantProfile =>
              match(route)
                .with({ name: "AccountMerchantsProfileSettings" }, ({ params }) => (
                  <MerchantProfileSettings
                    params={params}
                    merchantProfile={merchantProfile}
                    large={large}
                    merchantProfileCardVisible={merchantProfileCardVisible}
                    merchantProfileSepaDirectDebitCoreVisible={
                      merchantProfileSepaDirectDebitCoreVisible
                    }
                    merchantProfileSepaDirectDebitB2BVisible={
                      merchantProfileSepaDirectDebitB2BVisible
                    }
                    merchantProfileInternalDirectDebitCoreVisible={
                      merchantProfileInternalDirectDebitCoreVisible
                    }
                    merchantProfileInternalDirectDebitB2BVisible={
                      merchantProfileInternalDirectDebitB2BVisible
                    }
                    merchantProfileCheckVisible={merchantProfileCheckVisible}
                    onUpdate={() => {
                      refresh();
                    }}
                  />
                ))
                .with(P.nullish, () => <NotFoundPage />)
                .exhaustive(),
          )
          .exhaustive()
      }
    </ResponsiveContainer>
  );
};
