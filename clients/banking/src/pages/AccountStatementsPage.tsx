import { Box } from "@swan-io/lake/src/components/Box";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { match } from "ts-pattern";
import { useQuery } from "urql";
import { BorderedRow } from "../components/BorderedRow";
import { EmptyList } from "../components/EmptyList";
import { ErrorView } from "../components/ErrorView";
import { Main } from "../components/Main";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";
import {
  AccountStatementsPageDocument,
  AccountStatementsPageQueryVariables,
} from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  headerDesktop: {
    paddingTop: 56,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
  },

  loader: {
    height: 60,
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
};

export const AccountStatementsPage = ({ accountId }: Props) => {
  const accentColor = useLegacyAccentColor();
  const { desktop, media } = useResponsive();

  const [variables, setVariables] = useState<AccountStatementsPageQueryVariables>({
    accountId,
    first: NUM_TO_RENDER,
  });

  const [{ fetching, data, error }] = useQuery({
    query: AccountStatementsPageDocument,
    variables,
    context: useMemo(() => ({ suspense: false }), []),
  });

  const account = data?.account;

  const hasBeenFetchedOnce = Boolean(data ?? error);
  const initialFetching = fetching && !hasBeenFetchedOnce;
  const additionalFetching = fetching && hasBeenFetchedOnce;

  const accountStatements = useMemo(
    () =>
      account?.statements?.edges
        .map(({ node }) => ({
          ...node,
          // At the moment, we display only account statements with a pdf available
          type: node.type.filter(
            type => type?.__typename === "PdfStatement" && isNotNullish(type.url),
          ),
        }))
        .filter(({ type }) => isNotNullish(type[0]?.url)) ?? [],
    [account],
  );

  if (initialFetching) {
    return <LoadingView color={accentColor} />;
  }

  if (error || !account) {
    return <ErrorView error={error} />;
  }

  const hasNextPage = Boolean(account.statements?.pageInfo.hasNextPage);
  const endCursor = account.statements?.pageInfo.endCursor;

  return (
    <Main.FlatList
      noTopPadding={true}
      keyExtractor={item => item.id}
      data={accountStatements}
      initialNumToRender={NUM_TO_RENDER}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        setVariables(
          (prevVariables): AccountStatementsPageQueryVariables =>
            prevVariables.after === endCursor || !hasNextPage
              ? prevVariables
              : { ...prevVariables, after: endCursor },
        );
      }}
      ListHeaderComponent={
        <>
          <Box style={desktop && styles.headerDesktop}>
            <Heading level={1} size={media({ mobile: 24, desktop: 32 })}>
              {t("accountStatements.title")}
            </Heading>

            <Space height={16} />
            <Text style={styles.subtitle}>{t("accountStatements.subtitle")}</Text>
          </Box>

          <Space height={media({ mobile: 24, desktop: 40 })} />
        </>
      }
      ListFooterComponent={additionalFetching ? <LoadingView style={styles.loader} /> : null}
      ListEmptyComponent={<EmptyList text={t("accountStatements.empty")} />}
      ItemSeparatorComponent={() => <Space height={16} />}
      renderItem={({ item: { openingDate, closingDate, status, type } }) => {
        // Even if we filter account statements without pdf, we keep this for type safety
        const pdfUrl = type[0]?.url;
        const isAvailable = status === "Available";

        if (isNullish(pdfUrl)) {
          return null;
        }

        return (
          <BorderedRow
            title={
              desktop
                ? t("accountStatements.item.title.desktop", {
                    holderName: account.holder.info.name,
                    openingDate: dayjs(openingDate).format("LL"),
                    closingDate: dayjs(closingDate).format("LL"),
                  })
                : account.holder.info.name
            }
            disabled={!isAvailable}
            subtitle={`${account.name} - ${account.number}`}
            details={
              !desktop
                ? t("accountStatements.item.title.mobile", {
                    openingDate: dayjs(openingDate).format("L"),
                    closingDate: dayjs(closingDate).format("L"),
                  })
                : undefined
            }
            icon={isAvailable ? "arrow-download-filled" : undefined}
            to={isAvailable ? pdfUrl : undefined}
            target="blank"
          >
            {match(status)
              .with("Failed", () => (
                <Tag color="negative">{t("accountStatements.item.failed")}</Tag>
              ))
              .with("Pending", () => (
                <Tag color="warning">{t("accountStatements.item.pending")}</Tag>
              ))
              .with("Available", () => null)
              .exhaustive()}
          </BorderedRow>
        );
      }}
    />
  );
};
