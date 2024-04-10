import { Future, Option, Result } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { FileInput } from "@swan-io/shared-business/src/components/FileInput";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { isValid } from "iban";
import { useState } from "react";
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
  const [header, ...lines] = text.split(/\r?\n|\r|\n/g);
  const rows = header?.split(",");
  return match(rows)
    .with(["beneficiary_name", "iban", "amount", "currency", "reference"], () => {
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
                P.select("reference", P.string),
              ],
              ({ beneficiary_name, iban, amount, currency, reference }) => {
                const value = Number(amount);
                if (Number.isNaN(value)) {
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
                    reference,
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

  const onPressSubmit = () => {
    if (file.isSome()) {
      Future.make<string>(resolve => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          resolve(reader.result as string);
        });
        reader.readAsText(file.get());
      })
        .map(text => parseCsv(text))
        .tapOk(creditTransferInputs => {
          onSave(creditTransferInputs);
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("transfer.bulk.invalidFile") });
        });
    }
  };

  return (
    <>
      <Tile>
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

      <LakeModal icon="lake-document-csv" visible={isHelpModalOpen}>
        <LakeText>hello</LakeText>

        <LakeButtonGroup>
          <LakeButton>{t("transfer.bulk.help.downloadTemplate")}</LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};
