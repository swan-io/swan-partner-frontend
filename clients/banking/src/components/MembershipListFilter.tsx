import { AsyncData, Future, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { identity } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useState } from "react";
import { match, P } from "ts-pattern";
import { AccountMembershipStatus } from "../graphql/partner";
import { t } from "../utils/i18n";
import { filter, Filters, FiltersState } from "./Filters";
import { SearchInput } from "./SearchInput";

type BooleanParam = "true" | "false";

const booleanParamItems = [
  { value: "true" as const, label: t("common.true") },
  { value: "false" as const, label: t("common.false") },
];

const filtersDefinition = {
  statuses: filter.checkbox<AccountMembershipStatus>({
    label: t("membershipList.status"),
    items: [
      { value: "Enabled", label: t("memberships.status.active") },
      { value: "InvitationSent", label: t("memberships.status.invitationSent") },
      { value: "Suspended", label: t("memberships.status.temporarilyBlocked") },
      { value: "BindingUserError", label: t("memberships.status.conflictAndLimitedAccess") },
    ],
  }),
  canInitiatePayments: filter.radio({
    isInMoreFiltersByDefault: true,
    label: t("membershipList.canInitiatePayments"),
    items: booleanParamItems,
  }),
  canManageAccountMembership: filter.radio({
    isInMoreFiltersByDefault: true,
    label: t("membershipList.canManageAccountMembership"),
    items: booleanParamItems,
  }),
  canManageBeneficiaries: filter.radio({
    isInMoreFiltersByDefault: true,
    label: t("membershipList.canManageBeneficiaries"),
    items: booleanParamItems,
  }),
  canViewAccount: filter.radio({
    isInMoreFiltersByDefault: true,
    label: t("membershipList.canViewAccount"),
    items: booleanParamItems,
  }),
  canManageCards: filter.radio({
    isInMoreFiltersByDefault: true,
    label: t("membershipList.canManageCards"),
    items: booleanParamItems,
  }),
};

export type MembershipFilters = FiltersState<typeof filtersDefinition>;

export const parseBooleanParam = (value: string | undefined) =>
  match(value)
    .returnType<BooleanParam | undefined>()
    .with("true", "false", identity)
    .otherwise(() => undefined);

export const booleanParamToBoolean = (value: BooleanParam | undefined) =>
  match(value)
    .returnType<boolean | undefined>()
    .with("true", () => true)
    .with("false", () => false)
    .otherwise(() => undefined);

type MembershipListFilterProps = {
  available?: readonly (keyof MembershipFilters)[];
  children?: ReactNode;
  large?: boolean;
  filters: MembershipFilters;
  search: string | undefined;
  totalCount: AsyncData<Result<number, unknown>>;
  onChangeFilters: (filters: Partial<MembershipFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
};

export const MembershipListFilter = ({
  children,
  large = true,
  filters,
  search,
  totalCount,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
}: MembershipListFilterProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null ? (
          <>
            {children}

            <Separator horizontal={true} space={16} />
          </>
        ) : null}

        <Filters definition={filtersDefinition} values={filters} onChange={onChangeFilters} />
        <Fill minWidth={16} />

        {large ? (
          <>
            <LakeButton
              ariaLabel={t("common.refresh")}
              mode="secondary"
              size="small"
              icon="arrow-counterclockwise-filled"
              loading={isRefreshing}
              onPress={() => {
                setIsRefreshing(true);
                onRefresh().tap(() => setIsRefreshing(false));
              }}
            />

            <Space width={8} />
          </>
        ) : null}

        <SearchInput
          initialValue={search ?? ""}
          collapsed={!large}
          onChangeText={text => onChangeSearch(emptyToUndefined(text))}
          renderEnd={() =>
            match(totalCount)
              .with(AsyncData.P.Done(Result.P.Ok(P.select())), totalCount => (
                <Tag>{totalCount}</Tag>
              ))
              .otherwise(() => null)
          }
        />
      </Box>

      <Space height={12} />
    </>
  );
};
