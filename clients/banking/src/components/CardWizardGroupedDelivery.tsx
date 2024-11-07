import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { forwardRef, Fragment, useImperativeHandle, useState } from "react";
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
  item: {
    alignSelf: "stretch",
  },
  descriptionContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
  },
  description: {
    width: 1,
    flexGrow: 1,
  },
  lineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  erroredTile: {
    borderColor: colors.negative[100],
    borderWidth: 1,
  },
});

type Member = GetNode<NonNullable<GetEligibleCardMembershipsQuery["account"]>["memberships"]>;

type CardGroupedDeliveryConfig = {
  address: CompleteAddressWithContactInput;
  members: Member[];
};

type Props = {
  members: Member[];
  address: CompleteAddressWithContactInput;
  onSubmit: (cardDeliveryConfig: CardGroupedDeliveryConfig) => void;
};

export type CardWizardGroupedDeliveryRef = { submit: () => void };

export const CardWizardGroupedDelivery = forwardRef<CardWizardGroupedDeliveryRef, Props>(
  ({ members, address, onSubmit }: Props, ref) => {
    const [currentCardGroupedDeliveryConfig, setCardGroupedDeliveryConfig] =
      useState<CardGroupedDeliveryConfig>(() => ({
        address,
        members,
      }));

    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          onSubmit(currentCardGroupedDeliveryConfig);
        },
      }),
      [currentCardGroupedDeliveryConfig, onSubmit],
    );

    const hasError = isNotNullish(
      validateAddressLine(currentCardGroupedDeliveryConfig.address.addressLine1),
    );

    return (
      <View>
        <View>
          <LakeHeading level={2} variant="h4">
            {t("card.groupedDelivery.address")}
          </LakeHeading>

          <Space height={12} />

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
              <Icon name="pin-regular" size={28} color={colors.current[500]} />
              <Space width={24} />

              <View>
                <LakeText variant="semibold" color={colors.gray[900]}>
                  {currentCardGroupedDeliveryConfig.address.firstName}{" "}
                  {currentCardGroupedDeliveryConfig.address.lastName}
                </LakeText>

                {currentCardGroupedDeliveryConfig.address.companyName != null ? (
                  <LakeText>{currentCardGroupedDeliveryConfig.address.companyName}</LakeText>
                ) : null}

                <LakeText>{currentCardGroupedDeliveryConfig.address.addressLine1}</LakeText>

                {currentCardGroupedDeliveryConfig.address.addressLine2 != null ? (
                  <LakeText>{currentCardGroupedDeliveryConfig.address.addressLine2}</LakeText>
                ) : null}

                <LakeText>
                  {currentCardGroupedDeliveryConfig.address.postalCode}{" "}
                  {currentCardGroupedDeliveryConfig.address.city}
                </LakeText>

                <LakeText>
                  {currentCardGroupedDeliveryConfig.address.state ?? ""}{" "}
                  {currentCardGroupedDeliveryConfig.address.country.trim()}
                </LakeText>
              </View>

              <Fill minWidth={24} />

              <LakeButton
                mode="tertiary"
                onPress={() =>
                  setEditingAddress({
                    addressLine1: currentCardGroupedDeliveryConfig.address.addressLine1,
                    addressLine2:
                      currentCardGroupedDeliveryConfig.address.addressLine2 ?? undefined,
                    postalCode: currentCardGroupedDeliveryConfig.address.postalCode,
                    city: currentCardGroupedDeliveryConfig.address.city,
                    state: currentCardGroupedDeliveryConfig.address.state ?? undefined,
                    country: currentCardGroupedDeliveryConfig.address.country as CountryCCA3,
                  })
                }
              >
                {t("cardWizard.address.change")}
              </LakeButton>
            </Box>
          </Tile>

          <Space height={24} />

          <LakeHeading level={2} variant="h4">
            {t("card.groupedDelivery.members")}
          </LakeHeading>

          <Space height={12} />

          {currentCardGroupedDeliveryConfig.members.map(node => {
            return (
              <Fragment key={node.id}>
                <Tile selected={false} paddingVertical={16}>
                  <View style={styles.lineContainer}>
                    <Avatar size={32} user={node.user} />
                    <Space width={16} />

                    <View>
                      <LakeHeading level={3} variant="h5" userSelect="none">
                        {getMemberName({ accountMembership: node })}
                      </LakeHeading>

                      <LakeText userSelect="none">{node.email}</LakeText>
                    </View>
                  </View>
                </Tile>

                <Space height={12} />
              </Fragment>
            );
          })}
        </View>

        <LakeModal visible={editingAddress != null} title={t("cardWizard.address.changeAddress")}>
          {editingAddress != null ? (
            <CardWizardAddressForm
              initialAddress={editingAddress}
              onSubmit={address => {
                setCardGroupedDeliveryConfig({
                  ...currentCardGroupedDeliveryConfig,
                  address: {
                    firstName: currentCardGroupedDeliveryConfig.address.firstName,
                    lastName: currentCardGroupedDeliveryConfig.address.lastName,
                    phoneNumber: currentCardGroupedDeliveryConfig.address.phoneNumber,
                    ...address,
                  },
                });
                setEditingAddress(null);
              }}
              onPressClose={() => setEditingAddress(null)}
            />
          ) : null}
        </LakeModal>
      </View>
    );
  },
);
