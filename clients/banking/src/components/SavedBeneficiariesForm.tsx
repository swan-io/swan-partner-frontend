import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useForwardAsyncDataPagination, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeRadio } from "@swan-io/lake/src/components/LakeRadio";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { animations, colors, spacings } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { printFormat } from "iban";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { BeneficiariesListDocument, TrustedBeneficiaryFiltersInput } from "../graphql/partner";
import { Currency, isSupportedCurrency, t } from "../utils/i18n";
import { concatSepaBeneficiaryAddress } from "./BeneficiaryDetail";
import { InternationalBeneficiary } from "./BeneficiaryInternationalWizardForm";
import { getBeneficiaryIdentifier } from "./BeneficiaryList";
import { SepaBeneficiary } from "./BeneficiarySepaWizardForm";
import { ErrorView } from "./ErrorView";

const NUM_TO_RENDER = 20;

const styles = StyleSheet.create({
  tile: {
    ...animations.fadeAndSlideInFromBottom.enter,
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
  },
  tileLarge: {
    paddingHorizontal: spacings[32],
  },
  beneficiary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[16],
    opacity: 1,
  },
  benificiaryPress: {
    opacity: 0.7,
    transitionDuration: "150ms",
    transitionProperty: "opacity",
  },
  loadingOrError: {
    justifyContent: "flex-start",
    paddingVertical: spacings[48],
  },
  emptyContent: {
    paddingTop: spacings[48],
    paddingBottom: spacings[32],
  },
});

type Props = {
  accountId: string;
} & (
  | {
      type: "Sepa";
      onPressSubmit: (beneficiary: SepaBeneficiary) => void;
    }
  | {
      type: "International";
      currency: Currency;
      onPressSubmit: (beneficiary: InternationalBeneficiary) => void;
    }
);

export const SavedBeneficiariesForm = (props: Props) => {
  const { accountId } = props;
  const currency = props.type === "International" ? props.currency : undefined;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>();

  const defaultFilters = useMemo<TrustedBeneficiaryFiltersInput>(
    () => ({
      type: [props.type],
      currency,
      status: ["Enabled"],
    }),
    [props.type, currency],
  );

  const [data, { isLoading, setVariables }] = useQuery(BeneficiariesListDocument, {
    accountId,
    filters: defaultFilters,
    first: NUM_TO_RENDER,
  });

  const beneficiaries = useForwardAsyncDataPagination(
    data.mapOkToResult(data =>
      Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
    ),
  );

  const onSearchChange = useCallback(
    (text: string) => {
      setSearch(text);

      const trimmed = text.trim();

      setVariables({
        after: null,
        filters: {
          ...defaultFilters,
          label: trimmed.length >= 3 ? trimmed : "",
        },
      });
    },
    [defaultFilters, setVariables],
  );

  return match(beneficiaries)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <LoadingView style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
      <ErrorView error={error} style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ edges, pageInfo, totalCount }) => {
      const selectedBeneficiary = Array.findMap(edges, ({ node }) => {
        if (node.id !== selected) {
          return Option.None();
        }

        return match(node)
          .returnType<Option<SepaBeneficiary | InternationalBeneficiary>>()
          .with({ __typename: "TrustedSepaBeneficiary" }, ({ id, name, iban }) =>
            Option.Some({ kind: "saved", id, name, iban }),
          )
          .with(
            {
              __typename: "TrustedInternationalBeneficiary",
              route: P.not("Unknown"),
              currency: P.when(isSupportedCurrency),
            },
            ({ id, name, currency, route, details }) => {
              const values = details.map(({ key, value }) => ({ key, value })); // remove typenames
              return Option.Some({ kind: "saved", id, name, currency, route, values });
            },
          )
          .otherwise(() => Option.None());
      });

      return (
        <ResponsiveContainer breakpoint={800}>
          {({ small, large }) => (
            <>
              <Tile style={[styles.tile, large && styles.tileLarge]}>
                <Box>
                  <LakeTextInput
                    icon="search-filled"
                    placeholder={t("common.search")}
                    value={search}
                    onChangeText={onSearchChange}
                    hideErrors={true}
                    renderEnd={() =>
                      isLoading ? (
                        <ActivityIndicator color={colors.partner[500]} size={18} />
                      ) : (
                        <Tag>{totalCount}</Tag>
                      )
                    }
                  />
                </Box>

                <FlatList
                  role="radiogroup"
                  keyExtractor={({ node }) => node.id}
                  data={edges}
                  ListHeaderComponent={<Space height={8} />}
                  ItemSeparatorComponent={<Separator />}
                  contentContainerStyle={edges.length === 0 && styles.emptyContent}
                  ListEmptyComponent={
                    <EmptyView
                      icon="lake-person-arrow-swap"
                      borderedIcon={true}
                      borderedIconPadding={16}
                      title={t("common.list.noResults")}
                      subtitle={t("common.list.noResultsSuggestion")}
                    />
                  }
                  renderItem={({ item: { node } }) => (
                    <Pressable
                      role="radio"
                      onPress={() => setSelected(node.id)}
                      style={({ pressed }) => [
                        styles.beneficiary,
                        pressed && styles.benificiaryPress,
                      ]}
                    >
                      <LakeRadio value={node.id === selected} />
                      <Space width={small ? 16 : 24} />

                      <Box shrink={1}>
                        <LakeText variant="medium" color={colors.gray[900]} numberOfLines={1}>
                          {node.label}
                        </LakeText>

                        <Space height={4} />

                        {match(node)
                          .with({ __typename: "TrustedSepaBeneficiary" }, ({ address, iban }) => (
                            <>
                              <LakeText numberOfLines={1}>{printFormat(iban)}</LakeText>

                              {match(concatSepaBeneficiaryAddress(address))
                                .with(P.nonNullable, address => (
                                  <>
                                    <Space height={4} />
                                    <LakeText numberOfLines={1}>{address}</LakeText>
                                  </>
                                ))
                                .otherwise(() => null)}
                            </>
                          ))
                          .with({ __typename: "TrustedInternationalBeneficiary" }, beneficiary =>
                            match(getBeneficiaryIdentifier(beneficiary))
                              .with(Option.P.Some(P.select()), ({ label, text }) => (
                                <LakeText numberOfLines={1}>
                                  {label}: {text}
                                </LakeText>
                              ))
                              .otherwise(() => null),
                          )
                          .otherwise(() => null)}
                      </Box>
                    </Pressable>
                  )}
                  onEndReached={() => {
                    if (pageInfo.hasNextPage ?? false) {
                      setVariables({ after: pageInfo.endCursor });
                    }
                  }}
                />
              </Tile>

              <Space height={16} />

              <LakeButtonGroup>
                <LakeButton
                  color="current"
                  grow={small}
                  loading={false}
                  disabled={selectedBeneficiary.isNone()}
                  onPress={() => {
                    if (selectedBeneficiary.isSome()) {
                      match({ props, value: selectedBeneficiary.get() })
                        .with(
                          {
                            props: { type: "Sepa" },
                            value: { iban: P.nonNullable },
                          },
                          ({ props: { onPressSubmit }, value }) => {
                            onPressSubmit(value);
                          },
                        )
                        .with(
                          {
                            props: { type: "International" },
                            value: { currency: P.nonNullable },
                          },
                          ({ props: { onPressSubmit }, value }) => {
                            onPressSubmit(value);
                          },
                        )
                        .otherwise(noop);
                    }
                  }}
                >
                  {t("common.continue")}
                </LakeButton>
              </LakeButtonGroup>
            </>
          )}
        </ResponsiveContainer>
      );
    })
    .exhaustive();
};
