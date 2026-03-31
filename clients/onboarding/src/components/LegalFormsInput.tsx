import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useEffect, useMemo } from "react";
import { TextInput } from "react-native";
import { P, match } from "ts-pattern";
import { GetLegalFormsDocument, LegalForm } from "../graphql/partner";
import { t } from "../utils/i18n";

type Props = {
  ref?: Ref<TextInput>;
  id?: string;
  value?: string;
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

  const data = useMemo(
    () =>
      queryData
        .mapOk(data => data.legalForms)
        .toOption()
        .flatMap(result => result.toOption())
        .getOr([])
        .map(form => ({
          name: isNotNullishOrEmpty(form.localAbbreviation)
            ? `${form.localName} - ${form.localAbbreviation}`
            : form.localName,
          value: form.code,
          searchTerms: [form.code],
        })),
    [queryData],
  );

  return (
    <LakeSelect
      id={id}
      ref={ref}
      placeholder={placeholder ?? t("companyInput.placeholder")}
      value={value}
      onValueChange={onValueChange}
      items={data}
      hasSearch={true}
      error={error}
      disabled={disabled}
    />
  );
};
