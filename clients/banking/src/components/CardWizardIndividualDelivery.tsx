import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  CompleteAddressWithContactInput,
  GetEligibleCardMembershipsQuery,
} from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { validateAddressLine } from "../utils/validations";
import { Address, CardWizardAddressForm } from "./CardWizardAddressForm";

const styles = StyleSheet.create({
  erroredTile: {
    borderColor: colors.negative[100],
    borderWidth: 1,
  },
});

type Member = GetNode<NonNullable<GetEligibleCardMembershipsQuery["account"]>["memberships"]>;

type CardIndividualDeliveryConfig = {
  address: CompleteAddressWithContactInput;
  member: Member;
}[];

type Props = {
  members: Member[];
  address: CompleteAddressWithContactInput;
  onSubmit: (cardDeliveryConfig: CardIndividualDeliveryConfig) => void;
};

export type CardWizardIndividualDeliveryRef = { submit: () => void };

export const CardWizardIndividualDelivery = forwardRef<CardWizardIndividualDeliveryRef, Props>(
  ({ members, address, onSubmit }: Props, ref) => {
    const [currentCardIndividualDeliveryConfig, setCardIndividualDeliveryConfig] =
      useState<CardIndividualDeliveryConfig>(() => members.map(member => ({ member, address })));

    const [editingAddress, setEditingAddress] = useState<[Address, number] | null>(null);

    const hasSomeError = currentCardIndividualDeliveryConfig.some(config =>
      isNotNullish(validateAddressLine(config.address.addressLine1)),
    );

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          if (!hasSomeError) {
            onSubmit(currentCardIndividualDeliveryConfig);
          }
        },
      }),
      [currentCardIndividualDeliveryConfig, hasSomeError, onSubmit],
    );

    return (
      <View>
        {currentCardIndividualDeliveryConfig.map((config, index) => {
          const initials =
            config.member.user?.firstName != null && config.member.user?.lastName != null
              ? `${config.member.user.firstName.charAt(0)}${config.member.user.lastName.charAt(0)}`
              : undefined;
          const hasError = isNotNullish(validateAddressLine(config.address.addressLine1));
          return (
            <View key={config.member.id}>
              <Tile
                style={hasError ? styles.erroredTile : null}
                footer={
                  hasError ? (
                    <LakeAlert
                      anchored={true}
                      variant="error"
                      title={t("cardWizard.address.tooLong")}
                    />
                  ) : null
                }
              >
                <Box direction="row" alignItems="center">
                  <Avatar size={28} initials={initials} />
                  <Space width={24} />

                  <View>
                    <LakeText variant="semibold" color={colors.gray[900]}>
                      {getMemberName({ accountMembership: config.member })}
                    </LakeText>

                    <LakeText>{config.address.addressLine1}</LakeText>

                    {config.address.addressLine2 != null ? (
                      <LakeText>{config.address.addressLine2}</LakeText>
                    ) : null}

                    <LakeText>
                      {`${config.address.postalCode} ${config.address.city} ${
                        config.address.state ?? ""
                      } ${config.address.country}`.trim()}
                    </LakeText>
                  </View>

                  <Fill minWidth={24} />

                  <LakeButton
                    mode="tertiary"
                    onPress={() =>
                      setEditingAddress([
                        {
                          addressLine1: config.address.addressLine1,
                          addressLine2: config.address.addressLine2 ?? undefined,
                          postalCode: config.address.postalCode,
                          city: config.address.city,
                          state: config.address.state ?? undefined,
                          country: config.address.country as CountryCCA3,
                        },
                        index,
                      ])
                    }
                  >
                    {t("cardWizard.address.change")}
                  </LakeButton>
                </Box>
              </Tile>

              <Space height={16} />
            </View>
          );
        })}

        <LakeModal visible={editingAddress != null} title={t("cardWizard.address.changeAddress")}>
          {(() => {
            if (editingAddress != null) {
              const [initialAddress, editingIndex] = editingAddress;

              return (
                <CardWizardAddressForm
                  initialAddress={initialAddress}
                  onSubmit={address => {
                    setCardIndividualDeliveryConfig(
                      currentCardIndividualDeliveryConfig.map((item, index) => {
                        if (editingIndex !== index) {
                          return item;
                        }
                        return {
                          ...item,
                          address: {
                            firstName: item.address.firstName,
                            lastName: item.address.lastName,
                            phoneNumber: item.address.phoneNumber,
                            ...address,
                          },
                        };
                      }),
                    );
                    setEditingAddress(null);
                  }}
                  onPressClose={() => setEditingAddress(null)}
                />
              );
            }
            return null;
          })()}
        </LakeModal>
      </View>
    );
  },
);
