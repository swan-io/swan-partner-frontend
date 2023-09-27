import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  CenteredCell,
  EndAlignedCell,
  SimpleHeaderCell,
  SimpleRegularTextCell,
  SimpleTitleCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { P, isMatching, match } from "ts-pattern";
import {
  AccountLanguage,
  AccountStatementsPageDocument,
  AccountStatementsPageQuery,
  GenerateAccountStatementDocument,
  StatementType,
} from "../graphql/partner";
import { languages, locale, rifmDateProps, t } from "../utils/i18n";
import { validateDate, validateRequired } from "../utils/validations";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  containerRowLarge: {
    paddingHorizontal: spacings[32],
  },
  containerRow: {
    paddingHorizontal: spacings[8],
  },
  columnHeaders: {
    paddingHorizontal: spacings[32],
  },
  buttonLarge: {
    paddingHorizontal: spacings[48],
  },
  button: {
    paddingHorizontal: spacings[24],
  },
  fieldLarge: {
    flexBasis: "50%",
    flexShrink: 1,
    alignSelf: "stretch",
  },
  field: {
    alignSelf: "stretch",
  },

  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    paddingHorizontal: spacings[24],
  },
  formContainerLarge: {
    paddingHorizontal: spacings[48],
  },
});

const isCountryAccountLanguage = isMatching({
  id: P.union(
    "de" as const,
    "en" as const,
    "es" as const,
    "fr" as const,
    "it" as const,
    "nl" as const,
  ),
  name: P.string,
  native: P.string,
  cca3: P.string,
  flag: P.string,
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  large: boolean;
};

type ExtraInfo = { large: boolean };
type Statement = GetNode<
  NonNullable<NonNullable<AccountStatementsPageQuery["account"]>["statements"]>
>;
type NewStatementType = {
  large: boolean;
  accountId: string;
  onCancel: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
};

const columns: ColumnConfig<Statement, ExtraInfo>[] = [
  {
    title: t("accountStatements.period"),
    width: "grow",
    id: "period",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { openingDate, closingDate } }) => {
      const openingDateStatement = dayjs.utc(openingDate).add(1, "hour").format("MMM, DD YYYY");
      const closingDateStatement = dayjs.utc(closingDate).add(1, "hour").format("MMM, DD YYYY");
      return <SimpleTitleCell text={`${openingDateStatement} - ${closingDateStatement}`} />;
    },
  },
  {
    title: t("accountStatements.generated"),
    width: 150,
    id: "generated",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { createdAt, status } }) => {
      return status === "Available" ? (
        <SimpleRegularTextCell
          textAlign="left"
          variant="smallMedium"
          text={dayjs(createdAt).format("MMM, DD YYYY")}
        />
      ) : null;
    },
  },
  {
    title: "notReady",
    width: "grow",
    id: "notReady",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? null : (
        <SimpleRegularTextCell
          textAlign="right"
          variant="smallMedium"
          text={t("accountStatements.notReady")}
        />
      );
    },
  },
  {
    title: t("accountStatements.action"),
    width: 70,
    id: "action",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="center" />,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? (
        <CenteredCell>
          <Icon name="open-regular" size={16} color={colors.gray[300]} />
        </CenteredCell>
      ) : null;
    },
  },
];

const smallColumns: ColumnConfig<Statement, ExtraInfo>[] = [
  {
    title: t("accountStatements.period"),
    width: "grow",
    id: "period",
    renderTitle: () => null,
    renderCell: ({ item: { openingDate, closingDate } }) => {
      const openingDateStatement = dayjs.utc(openingDate).add(1, "hour").format("MMM, DD YYYY");
      const closingDateStatement = dayjs.utc(closingDate).add(1, "hour").format("MMM, DD YYYY");
      return <SimpleTitleCell text={`${openingDateStatement} - ${closingDateStatement}`} />;
    },
  },

  {
    title: t("accountStatements.action"),
    width: 50,
    id: "actions",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? (
        <EndAlignedCell>
          <CellAction>
            <Icon name="open-regular" size={16} color={colors.gray[300]} />
          </CellAction>
        </EndAlignedCell>
      ) : (
        <EndAlignedCell>
          <CellAction>
            <BorderedIcon
              name="clock-regular"
              padding={4}
              size={24}
              color="warning"
              borderRadius={4}
            />
          </CellAction>
        </EndAlignedCell>
      );
    },
  },
];

const PER_PAGE = 20;

const statementTypeList: StatementType[] = ["PDF", "CSV"];

const NewStatementForm = ({
  large,
  accountId,
  onCancel: setOpenNewStatement,
  onSuccess: reload,
}: NewStatementType) => {
  const { Field, submitForm } = useForm<{
    startDate: string;
    closingDate: string;
    format: StatementType;
    language: AccountLanguage;
  }>({
    startDate: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        const openingDate = dayjs.utc(value, locale.dateFormat).subtract(1, "hour");

        const closingDate = dayjs
          .utc(getFieldState("closingDate").value, locale.dateFormat)
          .subtract(1, "hour");

        //check if statements are longer than 3 months
        if (dayjs(closingDate).isAfter(dayjs(openingDate).add(3, "months"))) {
          return t("newStatement.dateRangeLonger");
        }

        if (openingDate.isAfter(dayjs())) {
          return t("newStatement.dateInTheFuture");
        }
        return combineValidators(validateRequired, validateDate)(value);
      },
    },
    closingDate: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        // account statements use UTC+1
        const openingDate = dayjs
          .utc(getFieldState("startDate").value, locale.dateFormat)
          .subtract(1, "hour");
        const closingDate = dayjs.utc(value, locale.dateFormat).subtract(1, "hour");

        //check if statements are longer than 3 months
        if (dayjs(closingDate).isAfter(dayjs(openingDate).add(3, "months"))) {
          return t("newStatement.dateRangeLonger");
        }

        if (closingDate.isAfter(dayjs())) {
          return t("newStatement.dateInTheFuture");
        }

        if (closingDate.isBefore(openingDate)) {
          return t("newStatement.closingIsBeforeOpening");
        }

        return combineValidators(validateRequired, validateDate)(value);
      },
    },
    format: {
      initialValue: "PDF",
      validate: validateRequired,
    },
    language: {
      initialValue: "en",
      validate: validateRequired,
    },
  });

  const [statement, generateStatement] = useUrqlMutation(GenerateAccountStatementDocument);

  const languageOptions: Item<AccountLanguage>[] = useMemo(
    () =>
      languages.filter(isCountryAccountLanguage).map(country => ({
        name: country.native,
        value: country.id,
      })),
    [],
  );

  const onPressSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["startDate", "closingDate", "format", "language"])) {
        const now = dayjs();
        const closingDate = dayjs(values.closingDate, locale.dateFormat);
        return generateStatement({
          input: {
            accountId,
            openingDate: dayjs(values.startDate, locale.dateFormat).endOf("day").toISOString(),
            closingDate: closingDate.isSame(now, "day")
              ? closingDate
                  .set("hour", now.hour())
                  .set("minute", now.minute())
                  .set("second", now.second())
                  .toISOString()
              : closingDate.endOf("day").toISOString(),
            statementType: values.format,
            language: values.language,
          },
        }).onResolve(result =>
          result.match({
            Error: () => {
              showToast({ variant: "error", title: t("error.generic") });
            },
            Ok: ({ generateAccountStatement: data }) => {
              match(data)
                .with({ __typename: "Statement" }, () => {
                  setOpenNewStatement(false);
                  reload();
                })
                .otherwise(() => showToast({ variant: "error", title: t("error.generic") }));
            },
          }),
        );
      }
    });
  };

  return (
    <LakeScrollView style={large ? styles.formContainerLarge : styles.formContainer}>
      <Space height={24} />

      <Box direction={large ? "row" : "column"} alignItems="start">
        <View style={large ? styles.fieldLarge : styles.field}>
          <Field name="startDate">
            {({ value, onChange, onBlur, error, ref }) => (
              <LakeLabel
                label={t("newStatement.startDate")}
                render={id => (
                  <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                    {({ value, onChange }) => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        placeholder={locale.datePlaceholder}
                        onChange={e =>
                          onChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
                        }
                        onBlur={onBlur}
                        error={error}
                      />
                    )}
                  </Rifm>
                )}
              />
            )}
          </Field>
        </View>

        <Space width={16} />

        <View style={large ? styles.fieldLarge : styles.field}>
          <Field name="closingDate">
            {({ value, onChange, onBlur, error, ref }) => (
              <LakeLabel
                label={t("newStatement.endDate")}
                render={id => (
                  <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                    {({ value, onChange }) => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        placeholder={locale.datePlaceholder}
                        onChange={e =>
                          onChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
                        }
                        onBlur={onBlur}
                        error={error}
                      />
                    )}
                  </Rifm>
                )}
              />
            )}
          </Field>
        </View>
      </Box>

      <Box direction="column">
        <Field name="format">
          {({ value, onChange, ref }) => (
            <LakeLabel
              label={t("newStatement.format")}
              render={id => (
                <LakeSelect
                  id={id}
                  ref={ref}
                  value={value}
                  items={statementTypeList.map(type => ({ name: type, value: type }))}
                  onValueChange={onChange}
                />
              )}
            />
          )}
        </Field>

        <Field name="language">
          {({ value, onChange, ref }) => (
            <LakeLabel
              label={t("newStatement.language")}
              render={id => (
                <LakeSelect
                  id={id}
                  ref={ref}
                  value={value}
                  items={languageOptions}
                  onValueChange={onChange}
                />
              )}
            />
          )}
        </Field>
      </Box>

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton mode="secondary" grow={true} onPress={() => setOpenNewStatement(false)}>
          {t("common.cancel")}
        </LakeButton>

        <LakeButton
          color="current"
          grow={true}
          onPress={onPressSubmit}
          loading={statement.isLoading()}
        >
          {t("newStatement.generate")}
        </LakeButton>
      </LakeButtonGroup>
    </LakeScrollView>
  );
};

export const AccountStatementCustom = ({ accountId, large }: Props) => {
  // we enable animation in list view only if new form was opened at least once
  // it avoid to animate the first time the list is displayed
  const [newWasOpened, setNewWasOpened] = useState(false);

  const [displayedView, setDisplayedView] = useState<"list" | "new">("list");
  const { data, nextData, setAfter, reload } = useUrqlPaginatedQuery(
    {
      query: AccountStatementsPageDocument,
      variables: {
        first: PER_PAGE,
        accountId,
        filters: {
          period: "Custom",
        },
      },
    },
    [accountId],
  );

  return (
    <>
      {data.match({
        NotAsked: () => null,
        Loading: () => (
          <PlainListViewPlaceholder
            count={20}
            rowVerticalSpacing={0}
            headerHeight={0}
            rowHeight={48}
          />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: ({ account }) => (
              <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
                {() => (
                  <>
                    <TransitionView style={styles.fill} {...animations.fadeAndSlideInFromRight}>
                      {displayedView === "new" ? (
                        <NewStatementForm
                          large={large}
                          accountId={accountId}
                          onCancel={() => setDisplayedView("list")}
                          onSuccess={reload}
                        />
                      ) : null}
                    </TransitionView>

                    <TransitionView
                      style={styles.fill}
                      {...(newWasOpened ? animations.fadeAndSlideInFromLeft : {})}
                    >
                      {displayedView === "list" ? (
                        <>
                          {isNotNullish(account) &&
                            isNotNullish(account.statements) &&
                            account.statements.totalCount > 0 && (
                              <>
                                <Space height={24} />

                                <Box
                                  direction="row"
                                  style={large ? styles.buttonLarge : styles.button}
                                >
                                  <LakeButton
                                    size="small"
                                    icon="add-circle-filled"
                                    onPress={() => {
                                      setNewWasOpened(true);
                                      setDisplayedView("new");
                                    }}
                                    color="current"
                                  >
                                    {t("common.new")}
                                  </LakeButton>
                                </Box>

                                <Space height={12} />
                              </>
                            )}

                          <PlainListView
                            headerStyle={styles.columnHeaders}
                            rowStyle={() =>
                              large ? styles.containerRowLarge : styles.containerRow
                            }
                            breakpoint={breakpoints.tiny}
                            data={account?.statements?.edges?.map(({ node }) => node) ?? []}
                            keyExtractor={item => item.id}
                            headerHeight={48}
                            rowHeight={48}
                            groupHeaderHeight={48}
                            extraInfo={{ large }}
                            columns={columns}
                            getRowLink={({ item }) =>
                              Array.findMap(item.type, item => Option.fromNullable(item?.url))
                                .map(url => <Link to={url} target="_blank" />)
                                .getWithDefault(<View />)
                            }
                            loading={{
                              isLoading: nextData.isLoading(),
                              count: NUM_TO_RENDER,
                            }}
                            onEndReached={() => {
                              if (account?.statements?.pageInfo.hasNextPage ?? false) {
                                setAfter(account?.statements?.pageInfo.endCursor ?? undefined);
                              }
                            }}
                            renderEmptyList={() => (
                              <FixedListViewEmpty
                                borderedIcon={true}
                                icon="lake-inbox-empty"
                                title={t("accountStatements.empty.title")}
                                subtitle={t("accountStatements.empty.subtitle")}
                              >
                                <Space height={24} />

                                <LakeButton
                                  size="small"
                                  icon="add-circle-filled"
                                  onPress={() => {
                                    setNewWasOpened(true);
                                    setDisplayedView("new");
                                  }}
                                  color="current"
                                >
                                  {t("common.new")}
                                </LakeButton>
                              </FixedListViewEmpty>
                            )}
                            smallColumns={smallColumns}
                          />
                        </>
                      ) : null}
                    </TransitionView>
                  </>
                )}
              </ResponsiveContainer>
            ),
          }),
      })}
    </>
  );
};
