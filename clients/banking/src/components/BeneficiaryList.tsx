import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useForwardPagination, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { BeneficiariesListPageDocument, BeneficiariesListPageQuery } from "../graphql/partner";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const NUM_TO_RENDER = 20;

const styles = StyleSheet.create({});

type Account = NonNullable<BeneficiariesListPageQuery["account"]>;
type Beneficiaries = NonNullable<Account["trustedBeneficiaries"]>;

const BeneficiaryListImpl = ({
  accountMembershipId,
  beneficiaries,
  large,
}: {
  accountMembershipId: string;
  beneficiaries: Beneficiaries;
  large: boolean;
}) => {
  const { edges, pageInfo } = useForwardPagination(beneficiaries);
  const isEmpty = edges.length === 0;

  const AddButton = (
    <LakeButton
      // grow={!large}
      icon="add-circle-filled"
      size="small"
      color="current"
      onPress={() => Router.push("AccountPaymentsBeneficiariesNew", { accountMembershipId })}
    >
      Add
    </LakeButton>
  );

  return (
    <>
      {!isEmpty && (
        <Box
          direction="row"
          alignItems="center"
          style={[
            {
              paddingHorizontal: spacings[24],
            },
            large && {
              paddingHorizontal: spacings[40],
            },
          ]}
        >
          {AddButton}
        </Box>
      )}

      <PlainListView
        data={edges}
        keyExtractor={item => item.cursor}
        headerHeight={0}
        rowHeight={0}
        groupHeaderHeight={0}
        extraInfo={undefined}
        columns={[]}
        renderEmptyList={() => (
          <FixedListViewEmpty
            borderedIcon={true}
            icon="lake-person-arrow-swap"
            title="You haven't added any beneficiaries yet"
            subtitle="Once you do, they'll be displayed here"
            borderedIconPadding={16}
          >
            <Space height={24} />

            {AddButton}
          </FixedListViewEmpty>
        )}
      />
    </>
  );
};

export const BeneficiaryList = ({
  accountId,
  accountMembershipId,
}: {
  accountId: string;
  accountMembershipId: string;
}) => {
  const [data] = useQuery(BeneficiariesListPageDocument, {
    accountId,
    first: NUM_TO_RENDER, // incorrect typing
  });

  const beneficiaries = data.mapOkToResult(data =>
    Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
  );

  return (
    <ResponsiveContainer
      breakpoint={breakpoints.large}
      style={{
        ...commonStyles.fill,
      }}
    >
      {({ large }) =>
        match(beneficiaries)
          .with(AsyncData.P.NotAsked, () => null)
          .with(AsyncData.P.Loading, () => (
            <PlainListViewPlaceholder
              count={NUM_TO_RENDER}
              headerHeight={48}
              paddingHorizontal={24}
              rowHeight={56}
              rowVerticalSpacing={0}
            />
          ))
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiaries => (
            <BeneficiaryListImpl
              accountMembershipId={accountMembershipId}
              beneficiaries={beneficiaries}
              large={large}
            />
          ))
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .exhaustive()
      }
    </ResponsiveContainer>
  );
};
