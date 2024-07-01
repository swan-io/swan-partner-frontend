import { AsyncData, Lazy, Option, Result } from "@swan-io/boxed";
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
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
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
import { locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const NUM_TO_RENDER = 20;

const currencyResolver = Lazy(() =>
  "Intl" in window && "DisplayNames" in window.Intl
    ? new Intl.DisplayNames([locale.language], { type: "currency" })
    : undefined,
);

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  header: {
    paddingHorizontal: spacings[24],
  },
  hedaerLarge: {
    paddingHorizontal: spacings[40],
  },
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
    title: t("beneficiaries.name.title"),
    width: "grow",
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
    title: t("beneficiaries.accountIdentifier.title"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const [text, value] = match(item)
        .returnType<[string, string]>()
        .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) => [
          t("beneficiaries.accountIdentifier.accountId"),
          accountId,
        ])
        .with({ __typename: "TrustedInternationalBeneficiary" }, () => ["TODO", "TODO"])
        .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) => [
          t("beneficiaries.accountIdentifier.iban"),
          printFormat(iban),
        ])
        .otherwise(() => ["", ""]);

      return (
        <Cell>
          <LakeText variant="smallRegular" color={colors.gray[400]} numberOfLines={1}>
            {text}:{" "}
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
    title: t("beneficiaries.currency.title"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const currency = match(item)
        .with({ __typename: "TrustedInternationalBeneficiary" }, ({ currency }) => currency)
        .otherwise(() => "EUR");

      const resolver = currencyResolver.get();

      return (
        <Cell>
          <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
            {currency}

            {isNotNullish(resolver) && (
              <>
                {" "}
                <LakeText variant="smallRegular" color={colors.gray[400]}>
                  ({resolver.of(currency)})
                </LakeText>
              </>
            )}
          </LakeText>
        </Cell>
      );
    },
  },
  {
    id: "type",
    title: t("beneficiaries.type.title"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
          {match(item.__typename)
            .with("TrustedInternalBeneficiary", () => t("beneficiaries.type.internal"))
            .with("TrustedInternationalBeneficiary", () => t("beneficiaries.type.international"))
            .with("TrustedSepaBeneficiary", () => t("beneficiaries.type.sepa"))
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

  const AddButton = (
    <LakeButton
      grow={!large}
      icon="add-circle-filled"
      size="small"
      color="current"
      onPress={() => Router.push("AccountPaymentsBeneficiariesNew", { accountMembershipId })}
    >
      {t("common.add")}
    </LakeButton>
  );

  return (
    <>
      {nodes.length > 0 && (
        <Box
          alignItems="center"
          direction="row"
          style={[styles.header, large && styles.hedaerLarge]}
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
            icon="lake-person-arrow-swap"
            borderedIcon={true}
            borderedIconPadding={16}
            title={t("beneficiaries.empty.title")}
            subtitle={t("beneficiaries.empty.subtitle")}
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
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
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
