import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useForwardPagination, useQuery } from "@swan-io/graphql-client";
import { Box, BoxProps } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { SimpleHeaderCell } from "@swan-io/lake/src/components/FixedListViewCells";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { printFormat } from "iban";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  BeneficiariesListPageDocument,
  BeneficiariesListPageQuery,
  BeneficiariesListPageQueryVariables,
} from "../graphql/partner";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const NUM_TO_RENDER = 20;

const styles = StyleSheet.create({
  cell: {
    paddingHorizontal: spacings[16],
  },
});

type Account = NonNullable<BeneficiariesListPageQuery["account"]>;
type Beneficiaries = NonNullable<Account["trustedBeneficiaries"]>;

const Cell = (props: BoxProps) => (
  <Box
    direction="row"
    alignItems="center"
    grow={1}
    shrink={1}
    {...props}
    style={[styles.cell, props.style]}
  />
);

const columns: ColumnConfig<GetNode<Beneficiaries>, undefined>[] = [
  {
    id: "name",
    width: "grow",
    title: "Name",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <Tag
          color="gray"
          icon={match(item.type)
            .returnType<IconName>()
            .with("International", () => "earth-regular")
            .otherwise(() => "person-regular")}
        />

        <Space width={24} />

        <LakeText variant="medium" color={colors.gray[900]} numberOfLines={1}>
          {item.label || item.name}
        </LakeText>
      </Cell>
    ),
  },
  {
    id: "identifier",
    width: "grow",
    title: "Account identifier",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const [text, value] = match(item)
        .returnType<[string, string]>()
        .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) => [
          "Account ID",
          accountId,
        ])
        .with({ __typename: "TrustedInternationalBeneficiary" }, () => ["TODO", "TODO"])
        .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) => ["IBAN", printFormat(iban)])
        .otherwise(() => ["", ""]);

      return (
        <Cell>
          <LakeText variant="smallRegular" color={colors.gray[400]} numberOfLines={1}>
            {`${text}: `}

            <LakeText variant="smallMedium" color={colors.gray[700]}>
              {value}
            </LakeText>
          </LakeText>
        </Cell>
      );
    },
  },
  {
    id: "currency",
    width: 200,
    title: "Currency",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
          {match(item)
            .with({ __typename: "TrustedInternationalBeneficiary" }, ({ currency }) => currency)
            .otherwise(() => "EUR") + " "}

          <LakeText variant="smallRegular" color={colors.gray[400]}>
            (Euro)
          </LakeText>
        </LakeText>
      </Cell>
    ),
  },
  {
    id: "type",
    width: 200,
    title: "Type",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
          {match(item.__typename)
            .with("TrustedInternalBeneficiary", () => "Internal")
            .with("TrustedInternationalBeneficiary", () => "International")
            .with("TrustedSepaBeneficiary", () => "SEPA")
            .otherwise(() => "")}
        </LakeText>
      </Cell>
    ),
  },
  // {
  //   id: "actions",
  //   width: 48,
  //   title: "",
  //   renderTitle: () => null,
  //   renderCell: ({ isHovered }) => (
  //     <EndAlignedCell>
  //       <CellAction>
  //         <Icon
  //           name="chevron-right-filled"
  //           color={isHovered ? colors.gray[900] : colors.gray[500]}
  //           size={16}
  //         />
  //       </CellAction>
  //     </EndAlignedCell>
  //   ),
  // },
];

const BeneficiaryListImpl = ({
  large,
  accountMembershipId,
  beneficiaries,
  isLoading,
  setVariables,
}: {
  large: boolean;
  accountMembershipId: string;
  beneficiaries: Beneficiaries;
  isLoading: boolean;
  setVariables: (variables: Partial<BeneficiariesListPageQueryVariables>) => void;
}) => {
  const { edges, pageInfo } = useForwardPagination(beneficiaries);
  const nodes = useMemo(() => edges.map(edge => edge.node), [edges]);
  const isEmpty = nodes.length === 0;

  const AddButton = (
    <LakeButton
      grow={!large}
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

      <Space height={24} />

      <PlainListView
        data={nodes}
        keyExtractor={item => item.id}
        rowHeight={56}
        groupHeaderHeight={0}
        extraInfo={undefined}
        columns={columns}
        headerHeight={48}
        loading={{
          isLoading,
          count: 2,
        }}
        onEndReached={() => {
          if (pageInfo.hasNextPage ?? false) {
            setVariables({ after: pageInfo.endCursor ?? undefined });
          }
        }}
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
  const [data, { isLoading, setVariables }] = useQuery(BeneficiariesListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
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
              large={large}
              accountMembershipId={accountMembershipId}
              beneficiaries={beneficiaries}
              isLoading={isLoading}
              setVariables={setVariables}
            />
          ))
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .exhaustive()
      }
    </ResponsiveContainer>
  );
};
