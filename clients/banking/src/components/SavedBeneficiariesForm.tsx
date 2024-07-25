import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
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
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { BeneficiariesListDocument, TrustedBeneficiaryFiltersInput } from "../graphql/partner";
import { t } from "../utils/i18n";
import { concatSepaBeneficiaryAddress } from "./BeneficiaryDetail";
import { Beneficiary } from "./BeneficiarySepaWizardForm";
import { Connection } from "./Connection";
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

const defaultFilters: TrustedBeneficiaryFiltersInput = {
  type: ["Sepa"],
  status: ["Enabled"],
};

type Props = {
  accountId: string;
  onPressSubmit: (beneficiary: Beneficiary) => void;
};

export const SavedBeneficiariesForm = ({ accountId, onPressSubmit }: Props) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>();

  const [data, { isLoading, setVariables }] = useQuery(BeneficiariesListDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: defaultFilters,
  });

  const beneficiaries = data.mapOkToResult(data =>
    Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
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
    [setVariables],
  );

  useEffect(() => {
    match(beneficiaries)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ edges }) => {
        setSelected(prevSelected =>
          edges.find(edge => edge.node.id === prevSelected) != null
            ? prevSelected
            : edges[0]?.node.id,
        );
      })
      .otherwise(noop);
  }, [beneficiaries]);

  return match(beneficiaries)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <LoadingView style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
      <ErrorView error={error} style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiaries => {
      const selectedBeneficiary: Option<Beneficiary> = Array.findMap(
        beneficiaries.edges,
        ({ node }) => {
          if (node.__typename !== "TrustedSepaBeneficiary" || node.id !== selected) {
            return Option.None();
          }

          return Option.Some({
            type: "saved",
            id: node.id,
            name: node.name,
            iban: node.iban,
          });
        },
      );

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
                        <Tag>{beneficiaries.totalCount}</Tag>
                      )
                    }
                  />
                </Box>

                <Connection connection={beneficiaries}>
                  {({ edges, pageInfo }) => (
                    <FlatList
                      role="radiogroup"
                      keyExtractor={({ node }) => node.id}
                      data={edges}
                      ListHeaderComponent={<Space height={8} />}
                      ItemSeparatorComponent={<Separator />}
                      contentContainerStyle={edges.length === 0 && styles.emptyContent}
                      ListEmptyComponent={
                        <FixedListViewEmpty
                          icon="lake-person-arrow-swap"
                          borderedIcon={true}
                          borderedIconPadding={16}
                          title={t("common.list.noResults")}
                          subtitle={t("common.list.noResultsSuggestion")}
                        />
                      }
                      renderItem={({ item: { node } }) => {
                        if (node.__typename !== "TrustedSepaBeneficiary") {
                          return null; // Could not happen with type: ["Sepa"] filter
                        }

                        return (
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
                              <LakeText numberOfLines={1}>{printFormat(node.iban)}</LakeText>

                              {match(concatSepaBeneficiaryAddress(node.address))
                                .with(P.nonNullable, address => (
                                  <>
                                    <Space height={4} />
                                    <LakeText numberOfLines={1}>{address}</LakeText>
                                  </>
                                ))
                                .otherwise(() => null)}
                            </Box>
                          </Pressable>
                        );
                      }}
                      onEndReached={() => {
                        if (pageInfo.hasNextPage ?? false) {
                          setVariables({ after: pageInfo.endCursor });
                        }
                      }}
                    />
                  )}
                </Connection>
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
                      onPressSubmit(selectedBeneficiary.get());
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
