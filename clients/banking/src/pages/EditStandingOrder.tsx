import { BorderedButton } from "@swan-io/lake/src/components/BorderedButton";
import { Box } from "@swan-io/lake/src/components/Box";
import { Button } from "@swan-io/lake/src/components/Button";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Input } from "@swan-io/lake/src/components/Input";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Modal } from "@swan-io/lake/src/components/Modal";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import dayjs from "dayjs";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { match } from "ts-pattern";
import { useMutation } from "urql";
import { BorderedRow } from "../components/BorderedRow";
import { Main } from "../components/Main";
import { CancelStandingOrderDocument, EditStandingOrderPageDocument } from "../graphql/partner";
import { formatCurrency, t, TranslationKey } from "../utils/i18n";
import { Router } from "../utils/routes";
import { parseOperationResult, useQueryWithErrorBoundary } from "../utils/urql";
import { NotFoundPage } from "./NotFoundPage";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    flexWrap: "wrap",
  },
  headerDesktop: {
    paddingTop: 56,
    paddingHorizontal: 80,
  },
  input: {
    flex: 1,
  },
  button: {
    minWidth: 150,
  },
  confirmText: {
    ...typography.bodyLarge,
    color: colors.gray[500],
  },
});

type DeleteStandingOrderProps = {
  visible: boolean;
  accountMembershipId: string;
  standingOrderId: string;
  onClose: () => void;
};
const DeleteStandingOrderModal = ({
  visible,
  accountMembershipId,
  standingOrderId,
  onClose,
}: DeleteStandingOrderProps) => {
  const [{ fetching }, cancelStandingOrder] = useMutation(CancelStandingOrderDocument);

  const confirm = () => {
    void cancelStandingOrder({ id: standingOrderId })
      .then(parseOperationResult)
      .then(() => {
        Router.push("AccountStandingOrders", { accountMembershipId });
      });
  };

  return (
    <Modal visible={visible} title={t("standingOrders.edit.cancelTitle")} onDismiss={onClose}>
      <Text style={styles.confirmText}>{t("standingOrders.edit.cancelSubtitle")}</Text>
      <Space height={40} />

      <Box direction="row" justifyContent="end">
        <BorderedButton onPress={onClose}>{t("common.cancel")}</BorderedButton>
        <Space width={32} />

        <Button color={colors.negative[500]} loading={fetching} onPress={confirm}>
          {t("standingOrders.edit.cancelConfirm")}
        </Button>
      </Box>
    </Modal>
  );
};

type StandingOrder = {
  id: string;
  period: string;
  reference?: string;
  label?: string;
  beneficiaryName: string;
  amount?: string;
  amountCurreny: string;
  targetBalance?: string;
  targetBalanceCurrency: string;
  firstExecutionDate: string;
  nextExecutionDate: string;
  lastExecutionDate: string;
  createdBy: string;
};

type Props = {
  accountMembershipId: string;
  standingOrderId: string;
};

export const EditStandingOrder = ({ accountMembershipId, standingOrderId }: Props) => {
  const { desktop, media } = useResponsive();

  const [{ data }] = useQueryWithErrorBoundary({
    query: EditStandingOrderPageDocument,
    variables: { id: standingOrderId },
  });

  const [visible, { open, close }] = useDisclosure(false);

  const standingOrder: StandingOrder | undefined = useMemo(() => {
    if (!data.standingOrder) {
      return;
    }

    const { lastName = "", firstName = "" } = data.standingOrder.createdBy;
    const createdBy = [firstName, lastName].filter(name => Boolean(name)).join(" ");

    const periodTranslationKey = match(data.standingOrder.period)
      .with("Daily", (): TranslationKey => "payments.new.standingOrder.details.daily")
      .with("Weekly", (): TranslationKey => "payments.new.standingOrder.details.weekly")
      .with("Monthly", (): TranslationKey => "payments.new.standingOrder.details.monthly")
      .exhaustive();

    return {
      id: data.standingOrder.id,
      period: t(periodTranslationKey),
      label: data.standingOrder.label ?? "",
      reference: data.standingOrder.reference ?? "",
      beneficiaryName: data.standingOrder.sepaBeneficiary.name,
      amount: data.standingOrder.amount?.value ?? "",
      amountCurreny: data.standingOrder.amount?.currency ?? "EUR",
      targetBalance: data.standingOrder.targetAvailableBalance?.value ?? "",
      targetBalanceCurrency: data.standingOrder.targetAvailableBalance?.currency ?? "EUR",
      firstExecutionDate: data.standingOrder.firstExecutionDate ?? "",
      lastExecutionDate: data.standingOrder.lastExecutionDate ?? "",
      nextExecutionDate: data.standingOrder.nextExecutionDate ?? "",
      createdBy,
    };
  }, [data]);

  const handleRedirect = () => {
    Router.push("AccountStandingOrders", {
      accountMembershipId,
    });
  };

  if (!standingOrder) {
    return <NotFoundPage />;
  }

  return (
    <>
      <Box direction="row" style={[styles.header, desktop && styles.headerDesktop]}>
        <Heading level={1} size={32}>
          {t("standingOrders.edit.title")}
        </Heading>
      </Box>

      <Space height={media({ mobile: 24, desktop: 40 })} />

      <Main.ScrollView>
        <Tile>
          <Grid numColumns={media({ mobile: 1, desktop: 2 })} horizontalSpace={40}>
            <Input
              disabled={true}
              style={styles.input}
              label={t("recurringTransfer.table.label")}
              value={standingOrder.label}
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("recurringTransfer.table.period")}
              value={standingOrder.period}
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("recurringTransfer.table.beneficiary")}
              value={standingOrder.beneficiaryName}
            />

            <Input
              disabled={true}
              style={styles.input}
              label={
                standingOrder.amount !== ""
                  ? t("standingOrders.edit.amount")
                  : t("standingOrders.edit.targetBalance")
              }
              value={
                standingOrder.amount !== ""
                  ? formatCurrency(Number(standingOrder.amount), standingOrder.amountCurreny)
                  : formatCurrency(
                      Number(standingOrder.targetBalance),
                      standingOrder.targetBalanceCurrency,
                    )
              }
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("standingOrders.edit.firstExecutionDate")}
              value={
                standingOrder.firstExecutionDate !== ""
                  ? dayjs(standingOrder.firstExecutionDate).format("LLL")
                  : undefined
              }
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("standingOrders.edit.lastExecutionDate")}
              value={
                standingOrder.lastExecutionDate !== ""
                  ? dayjs(standingOrder.lastExecutionDate).format("LLL")
                  : undefined
              }
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("standingOrders.edit.nextExecutionDate")}
              value={
                standingOrder.nextExecutionDate !== ""
                  ? dayjs(standingOrder.nextExecutionDate).format("LLL")
                  : undefined
              }
            />

            <Input
              disabled={true}
              style={styles.input}
              label={t("standingOrders.edit.createdBy")}
              value={standingOrder.createdBy}
            />

            <BorderedRow
              icon="arrow-right-filled"
              title={t("standingOrders.transactions.title")}
              subtitle={t("standingOrders.transactions.subtitle")}
              to={Router.AccountStandingOrdersHistory({
                accountMembershipId,
                standingOrderId,
              })}
            />
          </Grid>

          <Space height={32} />

          <Box direction={media({ mobile: "column", desktop: "row" })} justifyContent="end">
            <LakeButton onPress={handleRedirect} style={styles.button}>
              {t("common.cancel")}
            </LakeButton>

            {desktop ? <Space width={16} /> : <Space height={16} />}

            <LakeButton icon="delete-regular" mode="secondary" color="negative" onPress={open}>
              {t("standingOrders.edit.delete")}
            </LakeButton>
          </Box>
        </Tile>
      </Main.ScrollView>

      <DeleteStandingOrderModal
        visible={visible}
        accountMembershipId={accountMembershipId}
        standingOrderId={standingOrderId}
        onClose={close}
      />
    </>
  );
};
