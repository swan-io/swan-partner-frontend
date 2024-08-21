import { Array, AsyncData, Future, Option, Result } from "@swan-io/boxed";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { FileInput } from "@swan-io/shared-business/src/components/FileInput";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { isValid } from "iban";
import { useEffect, useState } from "react";
import { P, match } from "ts-pattern";
import { CreditTransferInput } from "../graphql/partner";
import { t } from "../utils/i18n";
import { validateBeneficiaryName, validateTransferReference } from "../utils/validations";

type Props = {
  onSave: (creditTransfers: CreditTransferInput[]) => void;
};

type ParsingError =
  | { type: "MissingFile" }
  | { type: "InvalidFile" }
  | { type: "TooManyTransfers"; count: number }
  | { type: "InvalidBeneficiaryName"; line: number }
  | { type: "InvalidAmount"; line: number }
  | { type: "InvalidIban"; line: number }
  | { type: "InvalidCurency"; line: number }
  | { type: "InvalidLine"; line: number }
  | { type: "InvalidReference"; line: number };

const parseCsv = (text: string): Result<CreditTransferInput[], ParsingError[]> => {
  const [header, ...lines] = text.trim().split(/\r?\n|\r|\n/g);
  if (lines.length > 1000) {
    return Result.Error([{ type: "TooManyTransfers", count: lines.length }]);
  }
  const rows = header?.split(",");
  return match(rows)
    .with(["beneficiary_name", "iban", "amount", "currency", "label", "reference"], () => {
      const results = lines.map<Result<CreditTransferInput, ParsingError>>((line, index) => {
        return match(line.split(","))
          .with(
            [
              P.select("beneficiary_name", P.string),
              P.select("iban", P.string),
              P.select("amount", P.string),
              P.select("currency", P.string),
              P.select("label", P.string),
              P.select("reference", P.string),
            ],
            ({ beneficiary_name, iban, amount, currency, label, reference }) => {
              const value = Number(amount.trim());
              if (validateBeneficiaryName(beneficiary_name.trim()) != null) {
                return Result.Error({ type: "InvalidBeneficiaryName", line: index + 1 } as const);
              }
              if (Number.isNaN(value) || value <= 0) {
                return Result.Error({ type: "InvalidAmount", line: index + 1 } as const);
              }
              if (!isValid(iban.trim())) {
                return Result.Error({ type: "InvalidIban", line: index + 1 } as const);
              }
              if (currency.trim() !== "EUR") {
                return Result.Error({ type: "InvalidCurency", line: index + 1 } as const);
              }
              if (
                reference != null &&
                reference.trim() != "" &&
                validateTransferReference(reference.trim()) != null
              ) {
                return Result.Error({ type: "InvalidReference", line: index + 1 } as const);
              }
              return Result.Ok({
                sepaBeneficiary: {
                  iban: iban.trim(),
                  name: beneficiary_name.trim(),
                  isMyOwnIban: false,
                  save: false,
                },
                amount: {
                  value: String(value),
                  currency: currency.trim(),
                },
                reference: isNullishOrEmpty(reference.trim()) ? undefined : reference.trim(),
                label: isNullishOrEmpty(label.trim()) ? undefined : label.trim(),
              });
            },
          )
          .otherwise(() => Result.Error({ type: "InvalidLine", line: index + 1 } as const));
      });

      return Result.all(results).mapError(() =>
        Array.filterMap(results, item =>
          match(item)
            .with(Result.P.Error(P.select()), error => Option.Some(error))
            .otherwise(() => Option.None()),
        ),
      );
    })
    .otherwise(() => Result.Error([{ type: "InvalidFile" }] as const));
};

export const TransferBulkUpload = ({ onSave }: Props) => {
  const [file, setFile] = useState<Option<File>>(Option.None());
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [status, setStatus] = useState<AsyncData<Result<CreditTransferInput[], ParsingError[]>>>(
    AsyncData.NotAsked(),
  );

  useEffect(() => {
    if (file.isSome()) {
      setStatus(AsyncData.Loading());
      Future.make<string>(resolve => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          resolve(reader.result as string);
        });
        reader.readAsText(file.get());
      })
        .map(text => parseCsv(text))
        .tap(result => {
          setStatus(AsyncData.Done(result));
        })
        .tapOk(inputs => onSave(inputs));
    }
  }, [file, onSave]);

  const onPressSubmit = () => {
    if (file.isNone()) {
      setStatus(AsyncData.Done(Result.Error([{ type: "MissingFile" }])));
      return;
    }
    match(status)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), creditTransferInputs => {
        onSave(creditTransferInputs);
      })
      .otherwise(() => {});
  };

  const fileError = match(status)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), errors =>
      errors
        .map(item =>
          match(item)
            .with({ type: "MissingFile" }, () => t("common.form.required"))
            .with({ type: "TooManyTransfers" }, ({ count }) =>
              t("common.form.invalidBulkTooManyTransfers", { count, max: 1000 }),
            )
            .with({ type: "InvalidFile" }, () => t("common.form.invalidFile"))
            .with({ type: "InvalidAmount" }, ({ line }) =>
              t("common.form.invalidBulkAmount", { line }),
            )
            .with({ type: "InvalidBeneficiaryName" }, ({ line }) =>
              t("common.form.invalidBulkBeneficiaryName", { line }),
            )
            .with({ type: "InvalidIban" }, ({ line }) => t("common.form.invalidBulkIban", { line }))
            .with({ type: "InvalidCurency" }, ({ line }) =>
              t("common.form.invalidBulkCurrency", { line }),
            )
            .with({ type: "InvalidLine" }, ({ line }) => t("common.form.invalidFileLine", { line }))
            .with({ type: "InvalidReference" }, ({ line }) =>
              t("common.form.invalidBulkReference", { line }),
            )
            .exhaustive(),
        )

        .join("\n"),
    )
    .otherwise(() => undefined);

  return (
    <>
      <Tile
        footer={
          fileError != null && fileError !== t("common.form.required") ? (
            <LakeAlert anchored={true} variant="error" title={fileError} />
          ) : undefined
        }
      >
        <LakeLabel
          label={t("transfer.bulk.file")}
          help={
            <LakeButton
              mode="tertiary"
              size="small"
              color="gray"
              icon="question-circle-regular"
              onPress={() => setIsHelpModalOpen(true)}
              ariaLabel={t("common.help.whatIsThis")}
            >
              {t("common.help.whatIsThis")}
            </LakeButton>
          }
          render={() => (
            <FileInput
              error={fileError}
              icon="document-regular"
              accept={["text/csv"]}
              value={file.toUndefined()}
              onFiles={files => {
                const file = files[0];
                setFile(Option.fromNullable(file));
              }}
            />
          )}
        />
      </Tile>

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton
              color="current"
              onPress={onPressSubmit}
              grow={small}
              loading={status.isLoading()}
            >
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>

      <LakeModal
        icon="lake-document-csv"
        visible={isHelpModalOpen}
        onPressClose={() => setIsHelpModalOpen(false)}
        title={t("transfer.bulk.help.title")}
      >
        <LakeText>{t("transfer.bulk.help.description")}</LakeText>

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            grow={true}
            color="current"
            hrefAttrs={{ download: true }}
            href="/bulk-transfer-csv-template/bulk-transfer.csv"
          >
            {t("transfer.bulk.help.downloadTemplate")}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};
