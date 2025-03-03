import { Box } from "@swan-io/lake/src/components/Box";
import { FlatList } from "@swan-io/lake/src/components/FlatList";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, texts } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { deburr } from "@swan-io/lake/src/utils/string";
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import {
  Country,
  CountryCCA3,
  countries as allCountries,
} from "@swan-io/shared-business/src/constants/countries";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

const ROW_HEIGHT = 48;

const styles = StyleSheet.create({
  list: { height: 230 },
  icon: { position: "absolute", left: 16 },
  input: {
    ...texts.regular,
    color: colors.gray[700],
    flexGrow: 1,
    height: ROW_HEIGHT,
    outlineStyle: "none",
    paddingLeft: 44,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW_HEIGHT,
    paddingHorizontal: 16,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  rowHovered: { backgroundColor: colors.gray[50] },
  rowPressed: { backgroundColor: colors.gray[100] },
  rowName: { flexGrow: 1 },
});

type Props = { country: Country; onChange: (country: Country) => void };

export const CountryList = ({ country, onChange }: Props) => {
  const inputRef = useRef<TextInput>(null);

  const countries = useMemo(() => {
    const blockedCountries: CountryCCA3[] = ["CUB", "SYR", "IRN", "PRK", "RUS"];
    return allCountries.filter(({ cca3 }) => !blockedCountries.includes(cca3));
  }, []);

  const [filteredCountries, setFilteredCountries] = useState(countries);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 250);
  }, []);

  const handleOnChangeText = useDebounce(
    useCallback(
      (text: string) => {
        const cleaned = deburr(text.trim().toLowerCase());

        const filtered = countries.filter(
          country =>
            country.deburr.includes(cleaned) ||
            country.idd.includes(cleaned) ||
            `+${country.idd}`.includes(cleaned),
        );

        setFilteredCountries(filtered);
      },
      [countries],
    ),
    200,
  );

  return (
    <View style={styles.list}>
      <Box direction="row" alignItems="center">
        <Icon color={colors.gray[300]} name="search-filled" size={18} style={styles.icon} />

        <TextInput
          ref={inputRef}
          inputMode="search"
          style={styles.input}
          onChangeText={handleOnChangeText}
          onSubmitEditing={() => {
            if (isNotNullish(filteredCountries[0])) {
              onChange(filteredCountries[0]);
            }
          }}
        />
      </Box>

      <Separator />

      <FlatList
        data={filteredCountries}
        ItemSeparatorComponent={<Separator />}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <Pressable
            role="button"
            aria-label={item.name}
            style={({ hovered, pressed }) => [
              styles.row,
              hovered && styles.rowHovered,
              pressed && styles.rowPressed,
            ]}
            onPress={() => {
              onChange(item);
            }}
          >
            <Flag code={item.cca2} width={16} />
            <Space width={12} />

            <LakeText
              numberOfLines={1}
              style={styles.rowName}
              userSelect="none"
              variant="smallRegular"
            >
              {item.name}
            </LakeText>

            {item.uid === country.uid && (
              <>
                <Space width={12} />
                <Icon name="checkmark-filled" color={colors.positive[500]} size={16} />
              </>
            )}

            <Space width={12} />

            <LakeText userSelect="none" variant="smallRegular">
              +{item.idd}
            </LakeText>
          </Pressable>
        )}
      />
    </View>
  );
};
