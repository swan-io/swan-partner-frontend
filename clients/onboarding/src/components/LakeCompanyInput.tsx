import { AsyncData, Result } from "@swan-io/boxed";
import { LakeCombobox } from "@swan-io/lake/src/components/LakeCombobox";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { CompanySuggestion, queryCompanies } from "../utils/Pappers";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  itemTitle: {
    ...typography.bodyLarge,
    lineHeight: typography.lineHeights.title,
    userSelect: "none",
  },
  itemSubtitle: {
    ...typography.bodySmall,
    color: colors.gray[400],
    userSelect: "none",
  },
});

type Props = {
  id?: string;
  value: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSuggestion?: (suggestion: CompanySuggestion) => void;
  onLoadError: (error: unknown) => void;
};

type State = AsyncData<Result<CompanySuggestion[], unknown>>;

export const LakeCompanyInput = ({
  id,
  value,
  placeholder,
  disabled,
  error,
  onValueChange,
  onSuggestion,
  onLoadError,
}: Props) => {
  const [state, setState] = useState<State>(AsyncData.NotAsked());

  const selectCompany = (suggestion: CompanySuggestion) => {
    onSuggestion?.(suggestion);
  };

  useEffect(() => {
    if (value.length <= 3) {
      return setState(AsyncData.NotAsked());
    }

    setState(AsyncData.Loading());

    const request = queryCompanies(value);

    request.tapError(onLoadError).onResolve(value => setState(AsyncData.Done(value)));

    return () => request.cancel();
  }, [value, onLoadError]);

  return (
    <LakeCombobox
      id={id}
      placeholder={placeholder ?? t("companyInput.placeholder")}
      value={value}
      items={state}
      keyExtractor={item => item.siren}
      icon="search-filled"
      emptyResultText={t("common.noResult")}
      disabled={disabled}
      error={error}
      onValueChange={onValueChange}
      onSelectItem={selectCompany}
      renderItem={item => (
        <>
          <Text numberOfLines={1} style={styles.itemTitle}>
            {item.siren} - {item.name}
          </Text>

          <Text numberOfLines={1} style={styles.itemSubtitle}>
            {item.city}
          </Text>
        </>
      )}
    />
  );
};
