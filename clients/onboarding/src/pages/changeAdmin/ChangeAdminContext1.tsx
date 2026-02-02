import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { AccountAdminChangeInfoFragment } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

const styles = StyleSheet.create({
  listItem: {
    display: "list-item",
    listStyleType: "disc",
    marginLeft: spacings[24],
  },
});

type Props = {
  accountHolder: AccountAdminChangeInfoFragment["accountHolder"];
  changeAdminRequestId: string;
  nextStep: ChangeAdminRoute;
};

export const ChangeAdminContext1 = ({ accountHolder, changeAdminRequestId, nextStep }: Props) => {
  const onPressNext = () => {
    Router.push(nextStep, { requestId: changeAdminRequestId });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.context1.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.context1.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
              <ReadOnlyFieldList>
                <LakeLabel
                  type="view"
                  label={t("changeAdmin.step.context1.accountHolder")}
                  render={() => <LakeText color={colors.gray[900]}>{accountHolder.name}</LakeText>}
                />
                <LakeLabel
                  type="view"
                  label={t("changeAdmin.step.context1.accounts")}
                  render={() => (
                    <View role="list" style={{ padding: 0, margin: 0 }}>
                      {accountHolder.accounts.map((account, index) => (
                        <LakeText
                          key={index}
                          role="listitem"
                          style={styles.listItem}
                          color={colors.gray[900]}
                        >
                          {account.name}
                        </LakeText>
                      ))}
                    </View>
                  )}
                />
              </ReadOnlyFieldList>
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter
        nextLabel="changeAdmin.step.context1.continue"
        onNext={onPressNext}
        loading={false}
      />
    </OnboardingStepContent>
  );
};
