import { Box } from "@swan-io/lake/src/components/Box";
import {
  CopyableRegularTextCell,
  SimpleHeaderCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { backgroundColor, colors, negativeSpacings } from "@swan-io/lake/src/constants/design";
import { printFormat } from "iban";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { CreditTransferInput } from "../graphql/partner";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: negativeSpacings[40],
    height: 1,
    flexGrow: 1,
  },
  name: {
    flexDirection: "row",
    alignItems: "center",
    userSelect: "none",
  },
});

type Props = {
  creditTransferInputs: CreditTransferInput[];
  initialSelectedCreditTransferInputs?: CreditTransferInput[];
  onPressPrevious: () => void;
  onSave: (creditTransfers: CreditTransferInput[]) => void;
};

type ExtraInfo = {
  selected: Set<number>;
  setSelected: (set: Set<number>) => void;
  totalCount: number;
};

const columns: ColumnConfig<CreditTransferInput, ExtraInfo>[] = [
  {
    id: "name",
    title: t("transfer.bulk.beneficiaryName"),
    width: 215,
    renderTitle: ({ title, extraInfo: { selected, setSelected, totalCount } }) => {
      const checked = selected.size === totalCount ? true : selected.size === 0 ? false : "mixed";
      return (
        <StartAlignedCell>
          <Pressable
            style={styles.name}
            onPress={() => {
              setSelected(
                selected.size > 0
                  ? new Set()
                  : new Set(Array.from({ length: totalCount }, (_, index) => index)),
              );
            }}
            role="checkbox"
            aria-checked={checked}
          >
            <LakeCheckbox value={checked} />
            <Space width={8} />

            <LakeText variant="semibold" color={colors.gray[900]}>
              {title}
            </LakeText>
          </Pressable>
        </StartAlignedCell>
      );
    },
    renderCell: ({ item, index, extraInfo: { selected, setSelected } }) => (
      <StartAlignedCell>
        <Pressable
          style={styles.name}
          onPress={() => {
            const nextSelected = new Set([...selected]);
            if (nextSelected.has(index)) {
              nextSelected.delete(index);
            } else {
              nextSelected.add(index);
            }
            setSelected(nextSelected);
          }}
          role="checkbox"
          aria-checked={selected.has(index)}
        >
          <LakeCheckbox value={selected.has(index)} />
          <Space width={8} />

          <LakeText variant="semibold" color={colors.gray[900]}>
            {item.sepaBeneficiary?.name}
          </LakeText>
        </Pressable>
      </StartAlignedCell>
    ),
  },
  {
    id: "label",
    title: t("transfer.bulk.label"),
    width: 150,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const label = item.label;
      if (label == null) {
        return (
          <StartAlignedCell>
            <LakeText>{"—"}</LakeText>
          </StartAlignedCell>
        );
      }
      return (
        <CopyableRegularTextCell
          variant="regular"
          text={label}
          textToCopy={label}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      );
    },
  },
  {
    id: "iban",
    title: t("transfer.bulk.iban"),
    width: 350,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const iban = item.sepaBeneficiary?.iban;
      if (iban == null) {
        return null;
      }
      return (
        <CopyableRegularTextCell
          variant="regular"
          text={printFormat(iban)}
          textToCopy={printFormat(iban)}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      );
    },
  },
  {
    id: "reference",
    title: t("transfer.bulk.reference"),
    width: 150,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const reference = item.reference;
      if (reference == null) {
        return (
          <StartAlignedCell>
            <LakeText>{"—"}</LakeText>
          </StartAlignedCell>
        );
      }
      return (
        <CopyableRegularTextCell
          variant="regular"
          text={reference}
          textToCopy={reference}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      );
    },
  },
  {
    id: "amount",
    title: t("transfer.bulk.amount"),
    width: 150,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const amount = item.amount;
      return (
        <StartAlignedCell>
          <LakeText variant="medium" color={colors.gray[900]}>
            {formatCurrency(Number(amount.value), amount.currency)}
          </LakeText>
        </StartAlignedCell>
      );
    },
  },
];

export const TransferBulkReview = ({
  creditTransferInputs,
  initialSelectedCreditTransferInputs,
  onPressPrevious,
  onSave,
}: Props) => {
  const [selected, setSelected] = useState(() => {
    if (initialSelectedCreditTransferInputs != null) {
      return new Set(
        initialSelectedCreditTransferInputs.map(item => creditTransferInputs.indexOf(item)),
      );
    } else {
      return new Set(creditTransferInputs.map((item, index) => index));
    }
  });

  const onPressSubmit = () => {
    onSave(creditTransferInputs.filter((item, index) => selected.has(index)));
  };

  return (
    <>
      <Tile flexGrow={1}>
        <Box direction="row" alignItems="center">
          <LakeText variant="smallMedium" color={colors.current.primary}>
            {t("transfer.bulk.allTransfers")}
          </LakeText>

          <Space width={12} />

          <Tag color="current" label={t("transfer.bulk.allTransfers.selected")}>
            {selected.size}
          </Tag>
        </Box>

        <Space height={8} />

        <ScrollView style={styles.scrollView}>
          <PlainListView
            withoutScroll={true}
            headerBackgroundColor={backgroundColor.accented}
            rowHeight={56}
            headerHeight={56}
            data={creditTransferInputs}
            keyExtractor={(item, index) => String(index)}
            groupHeaderHeight={0}
            extraInfo={{ selected, setSelected, totalCount: creditTransferInputs.length }}
            columns={columns}
          />
        </ScrollView>

        <Space height={32} />

        <LakeText color={colors.gray[700]}>
          {formatNestedMessage("transfer.bulk.youSendExactly", {
            amount: (
              <LakeText color={colors.current.primary} variant="semibold">
                {formatCurrency(
                  creditTransferInputs.reduce(
                    (acc, item, index) =>
                      acc + (selected.has(index) ? Number(item.amount.value) : 0),
                    0,
                  ),
                  "EUR",
                )}
              </LakeText>
            ),
          })}
        </LakeText>
      </Tile>

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton
              mode="secondary"
              disabled={selected.size === 0}
              onPress={onPressPrevious}
              grow={small}
            >
              {t("common.previous")}
            </LakeButton>

            <LakeButton
              color="current"
              disabled={selected.size === 0}
              onPress={onPressSubmit}
              grow={small}
            >
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </>
  );
};
