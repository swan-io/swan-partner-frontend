import { AsyncData, Result } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { P, match } from "ts-pattern";
import { GetAvailableAccountBalanceDocument } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { ErrorView } from "./ErrorView";

export type Amount = number;

const FIXED_AMOUNT_DEFAULT_VALUE = 0;

type Props = {
  initialAmount?: Amount;
  onPressPrevious: () => void;
  onSave: (amount: Amount) => void;
  accountMembershipId: string;
};

export const TransferInternationalWizardAmount = ({
  initialAmount,
  onPressPrevious,
  accountMembershipId,
  onSave,
}: Props) => {
  const [amount, setAmount] = useState<Amount>(initialAmount ?? FIXED_AMOUNT_DEFAULT_VALUE);
  const { data } = useUrqlQuery(
    {
      query: GetAvailableAccountBalanceDocument,
      variables: { accountMembershipId },
    },
    [accountMembershipId],
  );

  return (
    <View>
      <Tile>
        {match(data)
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
            <ActivityIndicator color={colors.gray[900]} />
          ))
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
            const availableBalance = data.accountMembership?.account?.balances?.available;
            return availableBalance != null ? (
              <View>
                <LakeText color={colors.gray[500]} variant="smallRegular">
                  {t("transfer.new.availableBalance")}
                </LakeText>

                <Space height={4} />

                <LakeHeading level={3} variant="h1">
                  {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                </LakeHeading>

                <Space height={12} />
              </View>
            ) : null;
          })
          .otherwise(() => (
            <ErrorView />
          ))}

        <p>fields</p>
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={() => onSave(amount)} grow={small}>
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};
