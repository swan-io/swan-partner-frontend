import { Array, Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeRadio } from "@swan-io/lake/src/components/LakeRadio";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Popover } from "@swan-io/lake/src/components/Popover";
import { Pressable, PressableText } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii, spacings, texts } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import {
  emptyToUndefined,
  isNotNullishOrEmpty,
  isNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import {
  DatePickerDate,
  DatePickerModal,
} from "@swan-io/shared-business/src/components/DatePicker";
import { ValidatorResult } from "@swan-io/use-form";
import dayjs from "dayjs";
import { ReactNode, Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { match } from "ts-pattern";
import { Simplify } from "type-fest";
import { formatCurrency, locale, t } from "../utils/i18n";

const styles = StyleSheet.create({
  inert: {
    pointerEvents: "none",
  },
  toggle: {
    marginRight: spacings[8],
    marginVertical: spacings[4],
  },
  filterButton: {
    alignItems: "center",
    borderColor: colors.gray[200],
    borderRadius: radii[8],
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    height: 28,
    marginRight: spacings[8],
    marginVertical: spacings[4],
    paddingLeft: spacings[4],
    paddingRight: spacings[8],
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  filterButtonHovered: {
    backgroundColor: colors.gray[50],
  },
  filterButtonPressed: {
    backgroundColor: colors.gray[100],
  },
  filterButtonWithValue: {
    borderStyle: "solid",
  },
  filterButtonIcon: {
    padding: spacings[4],
    transitionProperty: "transform",
    transitionDuration: "300ms",
  },
  filterButtonIconWithValue: {
    transform: "rotate(45deg)",
  },
  filterButtonLabel: {
    ...texts.smallMedium,
    color: colors.gray[700],
    userSelect: "none",
  },
  filterButtonSeparator: {
    backgroundColor: colors.gray[100],
    height: 16,
    marginHorizontal: spacings[8],
    width: 1,
  },
  filterButtonValue: {
    ...texts.smallMedium,
    color: colors.current[500],
    maxWidth: 150,
    userSelect: "none",
  },
  inputPopover: {
    padding: spacings[20],
  },
  list: {
    minWidth: 200,
  },
  listContent: {
    paddingVertical: spacings[12],
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    height: spacings[32],
    paddingHorizontal: spacings[20],
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  listItemHovered: {
    backgroundColor: colors.gray[50],
  },
  listItemText: {
    ...texts.smallRegular,
    color: colors.gray[900],
    userSelect: "none",
  },
  clearButton: {
    ...texts.smallSemibold,
    borderRadius: radii[8],
    color: colors.gray[600],
    lineHeight: 28,
    marginVertical: spacings[4],
    marginRight: spacings[8],
    paddingHorizontal: spacings[8],
    transitionDuration: "250ms",
    transitionProperty: "background-color",
    userSelect: "none",
  },
  clearButtonHovered: {
    backgroundColor: colors.gray[50],
  },
  clearButtonPressed: {
    backgroundColor: colors.gray[100],
  },
});

type Item<T extends string> = {
  label: string;
  value: T;
};

type FilterCheckboxDefinition<T extends string> = {
  type: "checkbox";
  isInMoreFiltersByDefault: boolean;
  label: string;
  items: Item<T>[];
};

type FilterDateDefinition<Values = unknown> = {
  type: "date";
  isInMoreFiltersByDefault: boolean;
  label: string;
  isSelectable?: (date: DatePickerDate, filters: Values) => boolean;
  validate?: (value: string, filters: Values) => ValidatorResult;
};

type FilterInputDefinition = {
  type: "input";
  isInMoreFiltersByDefault: boolean;
  label: string;
  format?: "currency";
  validate?: (value: string) => ValidatorResult;
};

type FilterRadioDefinition<T extends string> = {
  type: "radio";
  isInMoreFiltersByDefault: boolean;
  label: string;
  items: Item<T>[];
};

type FilterDefinition<T extends string> =
  | FilterCheckboxDefinition<T>
  | FilterDateDefinition
  | FilterInputDefinition
  | FilterRadioDefinition<T>;

type FiltersDefinition = Record<string, FilterDefinition<string>>;

type FilterProps<Definition extends FilterDefinition<string>, Value> = {
  definition: Definition;
  value: Value | undefined;
  visible: boolean;
  onChange: (value: Value | undefined) => void;
  onOpen: () => void;
  onClose: () => void;
};

type ExtractValue<T extends FilterDefinition<string>> = T extends { type: "checkbox" }
  ? T["items"][number]["value"][] | undefined
  : T extends { type: "radio" }
    ? T["items"][number]["value"] | undefined
    : string | undefined;

export type FiltersState<T extends FiltersDefinition> = Simplify<{
  [K in keyof T]: Simplify<ExtractValue<T[K]>>;
}>;

export const filter = {
  checkbox: <T extends string>(config: {
    isInMoreFiltersByDefault?: boolean;
    label: string;
    items: Item<T>[];
  }): FilterCheckboxDefinition<T> => ({
    type: "checkbox",
    isInMoreFiltersByDefault: config.isInMoreFiltersByDefault ?? false,
    label: config.label,
    items: config.items,
  }),

  date: (config: {
    isInMoreFiltersByDefault?: boolean;
    label: string;
    isSelectable?: (date: DatePickerDate, filters: unknown) => boolean;
    validate?: (value: string, filters: unknown) => ValidatorResult;
  }): FilterDateDefinition => ({
    type: "date",
    isInMoreFiltersByDefault: config.isInMoreFiltersByDefault ?? false,
    label: config.label,
    isSelectable: config.isSelectable,
    validate: config.validate,
  }),

  input: (config: {
    isInMoreFiltersByDefault?: boolean;
    label: string;
    format?: "currency";
    validate?: (value: string) => ValidatorResult;
  }): FilterInputDefinition => ({
    type: "input",
    isInMoreFiltersByDefault: config.isInMoreFiltersByDefault ?? false,
    label: config.label,
    format: config.format,
    validate: config.validate,
  }),

  radio: <T extends string>(config: {
    isInMoreFiltersByDefault?: boolean;
    label: string;
    items: Item<T>[];
  }): FilterRadioDefinition<T> => ({
    type: "radio",
    isInMoreFiltersByDefault: config.isInMoreFiltersByDefault ?? false,
    label: config.label,
    items: config.items,
  }),
} as const;

type FilterButtonProps = {
  ref: Ref<View>;
  label: string;
  value: string | undefined;
  onPress: () => void;
  onClear: () => void;
};

const FilterButton = ({ ref, label, value, onPress, onClear }: FilterButtonProps) => {
  const hasValue = isNotNullishOrEmpty(value);

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.filterButton,
        hovered && styles.filterButtonHovered,
        pressed && styles.filterButtonPressed,
        hasValue && styles.filterButtonWithValue,
      ]}
    >
      <Pressable
        role="button"
        aria-label={t("common.filters.clear")}
        onPress={onClear}
        disabled={!hasValue}
        style={!hasValue && styles.inert}
      >
        <Icon
          name="add-circle-regular"
          color={colors.gray[600]}
          size={16}
          style={[styles.filterButtonIcon, hasValue && styles.filterButtonIconWithValue]}
        />
      </Pressable>

      <Text style={styles.filterButtonLabel}>{label}</Text>

      {hasValue && (
        <>
          <View role="separator" style={styles.filterButtonSeparator} />

          <Text numberOfLines={1} style={styles.filterButtonValue}>
            {value}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const EMPTY_ARRAY: string[] = [];

const FilterCheckbox = ({
  definition: { label, items },
  value = EMPTY_ARRAY,
  visible,
  onChange,
  onOpen,
  onClose,
}: FilterProps<FilterCheckboxDefinition<string>, string[]>) => {
  const filterButtonRef = useRef<View>(null);
  const checkedSet = useMemo(() => new Set(value), [value]);

  const filterButtonText = useMemo(() => {
    return Array.filterMap(items, item =>
      checkedSet.has(item.value) ? Option.Some(item.label) : Option.None(),
    ).join(", ");
  }, [checkedSet, items]);

  const onClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <>
      <FilterButton
        ref={filterButtonRef}
        label={label}
        value={filterButtonText}
        onPress={onOpen}
        onClear={onClear}
      />

      <Popover
        placement="left"
        role="combobox"
        referenceRef={filterButtonRef}
        returnFocus={false}
        visible={visible}
        onDismiss={onClose}
      >
        <FlatList
          role="list"
          data={items}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(_, index) => `filter-item-${index}`}
          renderItem={({ item }) => {
            const checked = checkedSet.has(item.value);

            const handleOnPress = () => {
              const nextValue = checked
                ? value.filter(valueItem => valueItem !== item.value)
                : [...value, item.value];

              onChange(nextValue.length > 0 ? nextValue : undefined);
            };

            return (
              <Pressable
                aria-checked={checked}
                role="checkbox"
                style={({ hovered }) => [styles.listItem, hovered && styles.listItemHovered]}
                onPress={handleOnPress}
              >
                <LakeCheckbox value={checked} />
                <Space width={12} />

                <Text numberOfLines={1} style={styles.listItemText}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </Popover>
    </>
  );
};

const FilterDate = ({
  definition: { label, isSelectable, validate },
  value,
  visible,
  onChange,
  onOpen,
  onClose,

  values,
}: FilterProps<FilterDateDefinition, string> & {
  values: unknown;
}) => {
  const filterButtonRef = useRef<View>(null);

  const filterButtonText = useMemo(
    () => (isNotNullishOrEmpty(value) ? dayjs(value).format(locale.dateFormat) : undefined),
    [value],
  );

  const onClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <>
      <FilterButton
        ref={filterButtonRef}
        label={label}
        value={filterButtonText}
        onPress={onOpen}
        onClear={onClear}
      />

      <DatePickerModal
        visible={visible}
        format={locale.dateFormat}
        firstWeekDay="monday"
        label={label}
        cancelLabel={t("common.filters.cancel")}
        confirmLabel={t("common.filters.apply")}
        value={value != null ? dayjs(value).format(locale.dateFormat) : undefined}
        isSelectable={isSelectable ? date => isSelectable(date, values) : undefined}
        validate={validate ? value => validate(value, values) : undefined}
        onChange={value => onChange(dayjs(value, locale.dateFormat, true).toJSON())}
        onDismiss={onClose}
      />
    </>
  );
};

const FilterInput = ({
  definition: { label, format, validate },
  value,
  visible,
  onChange,
  onOpen,
  onClose,
}: FilterProps<FilterInputDefinition, string>) => {
  const filterButtonRef = useRef<View>(null);
  const [text, setText] = useState<string>(value ?? "");
  const [error, setError] = useState<string | undefined>(undefined);

  const onChangeText = useCallback((text: string) => {
    setText(text);
    setError(undefined);
  }, []);

  const onSubmit = useCallback(() => {
    const value = emptyToUndefined(text.trim());

    if (isNullishOrEmpty(value)) {
      onChange(undefined);
      return onClose();
    }

    const error = validate?.(value) ?? undefined;

    if (isNullishOrEmpty(error)) {
      onChange(value);
      return onClose();
    }

    return setError(error);
  }, [text, onClose, validate, onChange]);

  const onClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  useEffect(() => {
    // reset internal state on popover visible
    if (visible) {
      setText(value ?? "");
      setError(undefined);
    }
  }, [visible, value]);

  return (
    <>
      <FilterButton
        ref={filterButtonRef}
        label={label}
        onPress={onOpen}
        onClear={onClear}
        value={
          value != null
            ? format === "currency"
              ? formatCurrency(Number(value), "EUR")
              : value
            : undefined
        }
      />

      <Popover
        placement="left"
        role="combobox"
        referenceRef={filterButtonRef}
        returnFocus={false}
        visible={visible}
        onDismiss={onClose}
      >
        <View style={styles.inputPopover}>
          <LakeTextInput
            hideErrors={true}
            error={error}
            placeholder={label}
            value={text}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            unit={format === "currency" ? "€" : undefined}
          />

          <Space height={8} />

          <LakeButton color="current" size="small" onPress={onSubmit}>
            {t("common.filters.apply")}
          </LakeButton>
        </View>
      </Popover>
    </>
  );
};

const FilterRadio = ({
  definition: { label, items },
  value,
  visible,
  onChange,
  onOpen,
  onClose,
}: FilterProps<FilterRadioDefinition<string>, string>) => {
  const filterButtonRef = useRef<View>(null);

  const filterButtonText = useMemo(() => {
    return items.find(item => item.value === value)?.label;
  }, [value, items]);

  const onClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <>
      <FilterButton
        ref={filterButtonRef}
        label={label}
        value={filterButtonText}
        onPress={onOpen}
        onClear={onClear}
      />

      <Popover
        placement="left"
        role="combobox"
        referenceRef={filterButtonRef}
        returnFocus={false}
        visible={visible}
        onDismiss={onClose}
      >
        <FlatList
          role="list"
          data={items}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(_, index) => `filter-item-${index}`}
          renderItem={({ item }) => {
            const selected = value === item.value;

            return (
              <Pressable
                aria-selected={selected}
                role="radio"
                style={({ hovered }) => [styles.listItem, hovered && styles.listItemHovered]}
                onPress={() => {
                  onChange(item.value);
                  onClose();
                }}
              >
                <LakeRadio value={selected} />
                <Space width={12} />

                <Text numberOfLines={1} style={styles.listItemText}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </Popover>
    </>
  );
};

export const Filters = <
  Values extends Record<string, string | string[] | undefined>,
  Definition extends FiltersDefinition,
  State extends FiltersState<Definition>,
>({
  definition: definitionObject,
  values,
  toggle,
  onChange,
}: {
  definition: Definition;
  values: Values;
  toggle?: ReactNode;
  onChange: (values: State) => void;
}) => {
  const moreFiltersButtonRef = useRef<View>(null);

  const [active, setActive] = useState<
    { type: "none" } | { type: "filter"; name: string } | { type: "more" }
  >({ type: "none" });

  const onMore = useCallback(() => setActive({ type: "more" }), []);
  const onClose = useCallback(() => setActive({ type: "none" }), []);

  const entries = useMemo(() => {
    return Object.entries(definitionObject).map(([name, definition]) => {
      const onOpen = () => setActive({ type: "filter", name });
      return { definition, name, onOpen };
    });
  }, [definitionObject]);

  const isClearButtonVisible = useMemo(() => {
    return entries.some(({ name }) => values[name] != null);
  }, [entries, values]);

  const isMoreButtonVisible = useMemo(() => {
    return entries.some(
      ({ definition, name }) => definition.isInMoreFiltersByDefault && values[name] == null,
    );
  }, [entries, values]);

  return (
    <Box direction="row" wrap="wrap" grow={1} shrink={1}>
      {toggle != null && <View style={styles.toggle}>{toggle}</View>}

      {entries.map(({ definition, name, onOpen }) => {
        const value = values[name];
        const visible = active.type === "filter" && active.name === name;

        if (definition.isInMoreFiltersByDefault && value == null && !visible) {
          return null;
        }

        const handleOnChange = (value: unknown) => {
          // @ts-expect-error
          onChange({ ...values, [name]: value });
        };

        return match(definition)
          .with({ type: "checkbox" }, definition => (
            <FilterCheckbox
              key={`filter-${name}`}
              definition={definition}
              value={value as string[] | undefined}
              visible={visible}
              onChange={handleOnChange}
              onOpen={onOpen}
              onClose={onClose}
            />
          ))
          .with({ type: "date" }, definition => (
            <FilterDate
              key={`filter-${name}`}
              definition={definition}
              value={value as string | undefined}
              visible={visible}
              onChange={handleOnChange}
              onOpen={onOpen}
              onClose={onClose}
              values={values}
            />
          ))
          .with({ type: "input" }, definition => (
            <FilterInput
              key={`filter-${name}`}
              definition={definition}
              value={value as string | undefined}
              visible={visible}
              onChange={handleOnChange}
              onOpen={onOpen}
              onClose={onClose}
            />
          ))
          .with({ type: "radio" }, definition => (
            <FilterRadio
              key={`filter-${name}`}
              definition={definition}
              value={value as string | undefined}
              visible={visible}
              onChange={handleOnChange}
              onOpen={onOpen}
              onClose={onClose}
            />
          ))
          .exhaustive();
      })}

      {isMoreButtonVisible && (
        <>
          <FilterButton
            ref={moreFiltersButtonRef}
            label={t("common.filters.more")}
            value={undefined}
            onClear={noop}
            onPress={onMore}
          />

          <Popover
            placement="left"
            role="combobox"
            referenceRef={moreFiltersButtonRef}
            returnFocus={false}
            visible={active.type === "more"}
            onDismiss={onClose}
          >
            <FlatList
              role="list"
              data={entries}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyExtractor={(_, index) => `more-filters-item-${index}`}
              renderItem={({ item: { definition, name, onOpen } }) => {
                if (!definition.isInMoreFiltersByDefault || values[name] != null) {
                  return null;
                }

                return (
                  <Pressable
                    role="button"
                    style={({ hovered }) => [styles.listItem, hovered && styles.listItemHovered]}
                    onPress={onOpen}
                  >
                    <Text numberOfLines={1} style={styles.listItemText}>
                      {definition.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Popover>
        </>
      )}

      {isClearButtonVisible && (
        <PressableText
          role="button"
          onPress={() => {
            onChange(
              // @ts-expect-error
              Object.fromEntries(entries.map(({ name }) => [name, undefined])),
            );
          }}
          style={({ hovered, pressed }) => [
            styles.clearButton,
            hovered && styles.clearButtonHovered,
            pressed && styles.clearButtonPressed,
          ]}
        >
          {t("common.filters.clearAll")}
        </PressableText>
      )}
    </Box>
  );
};
