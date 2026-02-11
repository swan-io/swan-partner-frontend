import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LakeCombobox } from "@swan-io/lake/src/components/LakeCombobox";
import { texts } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, RefObject, useEffect, useMemo } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { P, match } from "ts-pattern";
import { GetLegalFormsDocument, LegalForm } from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  itemTitle: {
    ...texts.regular,
    lineHeight: texts.h1.lineHeight,
    userSelect: "none",
  },
});

type Props = {
  ref?: Ref<TextInput>;
  id?: string;
  value: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  country?: CountryCCA3;
  onValueChange: (value: string) => void;
  onSuggestion?: (suggestion: LegalForm) => void;
  onLoadError: (error: unknown) => void;
};

export const LegalFormsInput = ({
  ref,
  id,
  value,
  country = "FRA",
  placeholder,
  disabled,
  error,
  onValueChange,
  onSuggestion,
  onLoadError,
}: Props) => {
  const [queryData] = useQuery(GetLegalFormsDocument, { country });

  useEffect(() => {
    match(queryData)
      .with(AsyncData.P.Done(Result.P.Error(P.select())), error => {
        onLoadError(error);
      })
      .otherwise(noop);
  }, [queryData, onLoadError]);

  const filteredData = useMemo(() => {
    return queryData.mapOk(data => {
      const legalForms = data.legalForms;
      const searchValue = value.toLowerCase().trim();

      if (searchValue.length === 0) {
        return legalForms;
      }

      return legalForms.filter(
        form =>
          form.code.toLowerCase().includes(searchValue) ||
          form.localName.toLowerCase().includes(searchValue),
      );
    });
  }, [queryData, value]);

  const selectLegalForm = (suggestion: LegalForm) => {
    onSuggestion?.(suggestion);
  };

  return (
    <LakeCombobox
      id={id}
      inputRef={ref as RefObject<unknown>}
      placeholder={placeholder ?? t("companyInput.placeholder")}
      value={value}
      items={filteredData}
      keyExtractor={item => item.code}
      icon="search-filled"
      emptyResultText={t("common.noResult")}
      disabled={disabled}
      error={error}
      onValueChange={onValueChange}
      onSelectItem={selectLegalForm}
      renderItem={item => (
        <Text numberOfLines={1} style={styles.itemTitle}>
          {item.code} - {item.localName}
        </Text>
      )}
    />
  );
};
