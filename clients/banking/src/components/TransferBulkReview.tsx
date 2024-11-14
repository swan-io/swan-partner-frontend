import { Box } from "@swan-io/lake/src/components/Box";
import { CopyableTextCell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { ColumnConfig, VirtualizedList } from "@swan-io/lake/src/components/VirtualizedList";
import { colors, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { printFormat } from "iban";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CreditTransferInput } from "../graphql/partner";
import { formatCurrency, formatNestedMessage, t } from "../utils/i18n";

const styles = StyleSheet.create({
  scrollViewContainer: {
    marginHorizontal: negativeSpacings[32],
    flexGrow: 1,
    flexShrink: 1,
  },
  name: {
    flexDirection: "row",
    alignItems: "center",
    userSelect: "none",
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: spacings[16],
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

const stickedToStartColumns: ColumnConfig<CreditTransferInput, ExtraInfo>[] = [
  {
    id: "name",
    title: t("transfer.bulk.beneficiaryName"),
    width: 250,
    renderTitle: ({ title, extraInfo: { selected, setSelected, totalCount } }) => {
      const checked = selected.size === totalCount ? true : selected.size === 0 ? false : "mixed";
      return (
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

          <LakeText variant="semibold" color={colors.gray[900]} numberOfLines={1}>
            {title}
          </LakeText>
        </Pressable>
      );
    },
    renderCell: ({ item, index, extraInfo: { selected, setSelected } }) => (
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

        <LakeText variant="semibold" color={colors.gray[900]} numberOfLines={1}>
          {item.sepaBeneficiary?.name}
        </LakeText>
      </Pressable>
    ),
  },
];

const columns: ColumnConfig<CreditTransferInput, ExtraInfo>[] = [
  {
    id: "label",
    title: t("transfer.bulk.label"),
    width: 150,
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => {
      const label = item.label;
      return <TextCell color={colors.gray[700]} text={label ?? "-"} />;
    },
  },
  {
    id: "iban",
    title: t("transfer.bulk.iban"),
    width: 340,
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => {
      const iban = item.sepaBeneficiary?.iban;
      if (iban == null) {
        return null;
      }
      return (
        <CopyableTextCell
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
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => {
      const reference = item.reference;
      return <TextCell color={colors.gray[700]} text={reference ?? "-"} />;
    },
  },
];

const stickedToEndColumn: ColumnConfig<CreditTransferInput, ExtraInfo>[] = [
  {
    id: "amount",
    title: t("transfer.bulk.amount"),
    width: 150,
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => {
      const amount = item.amount;
      return (
        <TextCell
          variant="medium"
          align="right"
          color={colors.gray[900]}
          text={formatCurrency(Number(amount.value), amount.currency)}
        />
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
            {t("transfer.bulk.allTransfers", { count: selected.size })}
          </LakeText>

          <Space width={12} />

          <Tag color="current" label={t("transfer.bulk.allTransfers.selected")}>
            {selected.size}
          </Tag>
        </Box>

        <Space height={8} />

        <View style={styles.scrollViewContainer}>
          <VirtualizedList
            variant="accented"
            rowHeight={56}
            headerHeight={56}
            data={creditTransferInputs}
            keyExtractor={(item, index) => String(index)}
            extraInfo={{ selected, setSelected, totalCount: creditTransferInputs.length }}
            stickedToStartColumns={stickedToStartColumns}
            columns={columns}
            stickedToEndColumns={stickedToEndColumn}
            renderEmptyList={() => <EmptyView icon="error-circle-regular" borderedIcon={true} />}
          />
        </View>

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
            <LakeButton mode="secondary" onPress={onPressPrevious} grow={small}>
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
