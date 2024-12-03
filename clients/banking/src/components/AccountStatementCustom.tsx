import { Array, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { combineValidators, useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Rifm } from "rifm";
import { P, isMatching } from "ts-pattern";
import {
  AccountLanguage,
  AccountStatementsPageDocument,
  AccountStatementsPageQuery,
  GenerateAccountStatementDocument,
  StatementType,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { accountLanguages, languages, locale, rifmDateProps, t } from "../utils/i18n";
import { validateDate, validateRequired } from "../utils/validations";
import { Connection } from "./Connection";
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
  id: accountLanguages.P,
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
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { openingDate, closingDate } }) => {
      const openingDateStatement = dayjs.utc(openingDate).add(1, "hour").format("MMM, DD YYYY");
      const closingDateStatement = dayjs.utc(closingDate).add(1, "hour").format("MMM, DD YYYY");
      return (
        <TextCell variant="medium" text={`${openingDateStatement} - ${closingDateStatement}`} />
      );
    },
  },
  {
    title: t("accountStatements.generated"),
    width: 150,
    id: "generated",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { createdAt, status } }) => {
      return status === "Available" ? (
        <TextCell variant="smallMedium" text={dayjs(createdAt).format("MMM, DD YYYY")} />
      ) : null;
    },
  },
  {
    title: "notReady",
    width: 180,
    id: "notReady",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? null : (
        <TextCell
          align="right"
          color={colors.gray[300]}
          variant="smallMedium"
          text={t("accountStatements.notReady")}
        />
      );
    },
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return status === "Available" ? (
        <Cell align="center">
          <Icon name="open-regular" size={16} color={colors.gray[300]} />
        </Cell>
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
      return (
        <TextCell variant="medium" text={`${openingDateStatement} - ${closingDateStatement}`} />
      );
    },
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item: { status } }) => {
      return (
        <Cell align="right">
          {status === "Available" ? (
            <Icon name="open-regular" size={16} color={colors.gray[300]} />
          ) : (
            <BorderedIcon
              name="clock-regular"
              padding={4}
              size={24}
              color="warning"
              borderRadius={4}
            />
          )}
        </Cell>
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
      validate: (value, { getFieldValue }) => {
        const openingDate = dayjs.utc(value, locale.dateFormat).subtract(1, "hour");

        const closingDate = dayjs
          .utc(getFieldValue("closingDate"), locale.dateFormat)
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
      validate: (value, { getFieldValue }) => {
        // account statements use UTC+1
        const openingDate = dayjs
          .utc(getFieldValue("startDate"), locale.dateFormat)
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

  const [generateStatement, statement] = useMutation(GenerateAccountStatementDocument);

  const languageOptions: Item<AccountLanguage>[] = useMemo(
    () =>
      languages.filter(isCountryAccountLanguage).map(country => ({
        name: country.native,
        value: country.id,
      })),
    [],
  );

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isSome()) {
          const { startDate, closingDate, format, language } = option.get();

          return generateStatement({
            input: {
              accountId,
              openingDate: dayjs
                .utc(startDate, locale.dateFormat)
                .format("YYYY-MM-DDT00:00:00.000+01:00"),
              closingDate: dayjs
                .utc(closingDate, locale.dateFormat)
                .format("YYYY-MM-DDT23:59:59.999+01:00"),
              statementType: format,
              language,
            },
          })
            .mapOk(data => data.generateAccountStatement)
            .mapOkToResult(({ __typename }) =>
              __typename === "Statement" ? Result.Ok(undefined) : Result.Error(__typename),
            )
            .tapOk(() => {
              setOpenNewStatement(false);
              reload();
            })
            .tapError(error => {
              showToast({ variant: "error", error, title: translateError(error) });
            });
        }
      },
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

  const { canGenerateAccountStatement } = usePermissions();

  const [displayedView, setDisplayedView] = useState<"list" | "new">("list");
  const [data, { isLoading, reload, setVariables }] = useQuery(AccountStatementsPageDocument, {
    first: PER_PAGE,
    accountId,
    filters: {
      period: "Custom",
    },
  });

  return (
    <>
      {data.match({
        NotAsked: () => null,
        Loading: () => <PlainListViewPlaceholder count={20} headerHeight={48} rowHeight={48} />,
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
                          onSuccess={() => {
                            reload();
                          }}
                        />
                      ) : null}
                    </TransitionView>

                    <TransitionView
                      style={styles.fill}
                      {...(newWasOpened ? animations.fadeAndSlideInFromLeft : {})}
                    >
                      {displayedView === "list" ? (
                        <>
                          {canGenerateAccountStatement &&
                            isNotNullish(account) &&
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

                          <Connection connection={account?.statements}>
                            {statements => (
                              <PlainListView
                                headerStyle={styles.columnHeaders}
                                rowStyle={() =>
                                  large ? styles.containerRowLarge : styles.containerRow
                                }
                                breakpoint={breakpoints.medium}
                                data={statements?.edges?.map(({ node }) => node) ?? []}
                                keyExtractor={item => item.id}
                                headerHeight={48}
                                rowHeight={48}
                                groupHeaderHeight={48}
                                extraInfo={{ large }}
                                columns={columns}
                                getRowLink={({ item }) => {
                                  const availableItem =
                                    item.status === "Available" ? Option.Some(item) : Option.None();
                                  return availableItem
                                    .flatMap(item =>
                                      Array.findMap(item.type, item =>
                                        Option.fromNullable(item?.url),
                                      ),
                                    )
                                    .map(url => <Link to={url} target="_blank" />)
                                    .getOr(<View />);
                                }}
                                loading={{
                                  isLoading,
                                  count: NUM_TO_RENDER,
                                }}
                                onEndReached={() => {
                                  if (statements?.pageInfo.hasNextPage ?? false) {
                                    setVariables({
                                      after: statements?.pageInfo.endCursor ?? undefined,
                                    });
                                  }
                                }}
                                renderEmptyList={() => (
                                  <EmptyView
                                    borderedIcon={true}
                                    icon="lake-inbox-empty"
                                    title={t("accountStatements.empty.title")}
                                    subtitle={t("accountStatements.empty.subtitle")}
                                  >
                                    {canGenerateAccountStatement ? (
                                      <>
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
                                      </>
                                    ) : null}
                                  </EmptyView>
                                )}
                                smallColumns={smallColumns}
                              />
                            )}
                          </Connection>
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
