import { AsyncData, Future, Option, Result } from "@swan-io/boxed";
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

type Props = {
  onSave: (creditTransfers: CreditTransferInput[]) => void;
};

const parseCsv = (
  text: string,
): Result<
  CreditTransferInput[],
  { type: "InvalidFile" } | { type: "InvalidLine"; line: number }
> => {
  const [header, ...lines] = text.trim().split(/\r?\n|\r|\n/g);
  const rows = header?.split(",");
  return match(rows)
    .with(["beneficiary_name", "iban", "amount", "currency", "label", "reference"], () => {
      return lines.reduce<
        Result<
          CreditTransferInput[],
          { type: "InvalidFile" } | { type: "InvalidLine"; line: number }
        >
      >((acc, line, index) => {
        return acc.flatMap(items => {
          return match(line.split(","))
            .with(
              [
                P.select("beneficiary_name", P.string),
                P.select("iban", P.string),
                P.select("amount", P.string),
                P.select("currency", "EUR"),
                P.select("label", P.string),
                P.select("reference", P.string),
              ],
              ({ beneficiary_name, iban, amount, currency, label, reference }) => {
                const value = Number(amount);
                if (Number.isNaN(value) || value === 0) {
                  return Result.Error({ type: "InvalidLine", line: index + 1 } as const);
                }
                if (!isValid(iban)) {
                  return Result.Error({ type: "InvalidLine", line: index + 1 } as const);
                }
                return Result.Ok([
                  ...items,
                  {
                    sepaBeneficiary: {
                      iban,
                      name: beneficiary_name,
                      isMyOwnIban: false,
                      save: false,
                    },
                    amount: {
                      value: String(value),
                      currency,
                    },
                    reference: isNullishOrEmpty(reference) ? null : reference,
                    label: isNullishOrEmpty(label) ? null : label,
                  },
                ]);
              },
            )
            .otherwise(() => Result.Error({ type: "InvalidLine", line: index + 1 } as const));
        });
      }, Result.Ok([]));
    })
    .otherwise(() => Result.Error({ type: "InvalidFile" } as const));
};

export const TransferBulkUpload = ({ onSave }: Props) => {
  const [file, setFile] = useState<Option<File>>(Option.None());
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [status, setStatus] = useState<
    AsyncData<
      Result<CreditTransferInput[], { type: "InvalidFile" } | { type: "InvalidLine"; line: number }>
    >
  >(AsyncData.NotAsked());

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
        });
    }
  }, [file]);

  const onPressSubmit = () => {
    match(status)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), creditTransferInputs => {
        onSave(creditTransferInputs);
      })
      .otherwise(() => {});
  };

  const fileError = match(status)
    .with(AsyncData.P.Done(Result.P.Error({ type: "InvalidFile" })), () =>
      t("common.form.invalidFile"),
    )
    .with(AsyncData.P.Done(Result.P.Error(P.select({ type: "InvalidLine" }))), ({ line }) =>
      t("common.form.invalidFileLine", { line }),
    )
    .otherwise(() => undefined);

  return (
    <>
      <Tile
        footer={
          fileError != null ? (
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
              ariaLabel={t("transfer.bulk.help.whatIsThis")}
            >
              {t("transfer.bulk.help.whatIsThis")}
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
            <LakeButton color="current" onPress={onPressSubmit} grow={small}>
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
