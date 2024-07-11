import { Fill } from "@swan-io/lake/src/components/Fill";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import dayjs from "dayjs";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  MerchantCategory,
  MerchantSubCategory,
  TransactionDetailsFragment,
} from "../graphql/partner";
import { formatCurrency, isTranslationKey, t } from "../utils/i18n";

type Transaction = TransactionDetailsFragment;

const styles = StyleSheet.create({
  cell: {
    display: "flex",
    paddingHorizontal: spacings[16],
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    width: 1,
  },
  cellRightAlign: {
    justifyContent: "flex-end",
  },
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  amounts: {
    alignItems: "flex-end",
  },
  overflowingText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  transactionSummary: {
    flexShrink: 1,
    flexGrow: 1,
  },
  merchantLogo: {
    width: spacings[24],
    height: spacings[24],
    borderRadius: radii[4],
  },
});

export const getMerchantCategoryIcon = (category: MerchantCategory) => {
  return match(category)
    .returnType<IconName>()
    .with("Culture", () => "music-note-2-regular")
    .with("Entertainment", () => "movies-and-tv-regular")
    .with("Finance", () => "calculator-regular")
    .with("Groceries", () => "cart-regular")
    .with("HealthAndBeauty", () => "heart-pulse-regular")
    .with("HomeAndUtilities", () => "home-regular")
    .with("Other", () => "payment-regular")
    .with("ProfessionalServices", () => "people-team-toolbox-regular")
    .with("PublicAdministrations", () => "gavel-regular")
    .with("Restaurants", () => "food-regular")
    .with("Shopping", () => "shopping-bag-regular")
    .with("Software", () => "laptop-regular")
    .with("Transport", () => "vehicle-subway-regular")
    .with("Travel", () => "airplane-regular")
    .exhaustive();
};

export const getMerchantCategorySublabel = (subcategory: MerchantSubCategory) => {
  return match(subcategory)
    .with("Education", () => t("transaction.enriched.subcategory.Education"))
    .with("Museums", () => t("transaction.enriched.subcategory.Museums"))
    .with("CinemasAndShows", () => t("transaction.enriched.subcategory.CinemasAndShows"))
    .with("GamblingAndBettingActivities", () =>
      t("transaction.enriched.subcategory.GamblingAndBettingActivities"),
    )
    .with("OtherLeisureActivities", () =>
      t("transaction.enriched.subcategory.OtherLeisureActivities"),
    )
    .with("StreamingPlatforms", () => t("transaction.enriched.subcategory.StreamingPlatforms"))
    .with("ThemeParks", () => t("transaction.enriched.subcategory.ThemeParks"))
    .with("TicketsAndEvents", () => t("transaction.enriched.subcategory.TicketsAndEvents"))
    .with("VideoGames", () => t("transaction.enriched.subcategory.VideoGames"))
    .with("FinancialServices", () => t("transaction.enriched.subcategory.FinancialServices"))
    .with("Insurance", () => t("transaction.enriched.subcategory.Insurance"))
    .with("LiquorStore", () => t("transaction.enriched.subcategory.LiquorStore"))
    .with("SupermarketsAndOtherGroceryStores", () =>
      t("transaction.enriched.subcategory.SupermarketsAndOtherGroceryStores"),
    )
    .with("FitnessAndSports", () => t("transaction.enriched.subcategory.FitnessAndSports"))
    .with("Hairdressing", () => t("transaction.enriched.subcategory.Hairdressing"))
    .with("Healthcare", () => t("transaction.enriched.subcategory.Healthcare"))
    .with("Pharmacies", () => t("transaction.enriched.subcategory.Pharmacies"))
    .with("SpaAndBeautyTreatments", () =>
      t("transaction.enriched.subcategory.SpaAndBeautyTreatments"),
    )
    .with("ConstructionAndOddJobs", () =>
      t("transaction.enriched.subcategory.ConstructionAndOddJobs"),
    )
    .with("EnergyProviders", () => t("transaction.enriched.subcategory.EnergyProviders"))
    .with("Gardening", () => t("transaction.enriched.subcategory.Gardening"))
    .with("Laundries", () => t("transaction.enriched.subcategory.Laundries"))
    .with("PhoneAndInternetServicesProviders", () =>
      t("transaction.enriched.subcategory.PhoneAndInternetServicesProviders"),
    )
    .with("RealEstate", () => t("transaction.enriched.subcategory.RealEstate"))
    .with("CharityAndNonProfitOrganizations", () =>
      t("transaction.enriched.subcategory.CharityAndNonProfitOrganizations"),
    )
    .with("ReligiousOrganizations", () =>
      t("transaction.enriched.subcategory.ReligiousOrganizations"),
    )
    .with("AdvertisingAndMarketing", () =>
      t("transaction.enriched.subcategory.AdvertisingAndMarketing"),
    )
    .with("BookkeepingAndConsultancy", () =>
      t("transaction.enriched.subcategory.BookkeepingAndConsultancy"),
    )
    .with("CourierAndLogistics", () => t("transaction.enriched.subcategory.CourierAndLogistics"))
    .with("IndustrialCleaning", () => t("transaction.enriched.subcategory.IndustrialCleaning"))
    .with("LegalActivities", () => t("transaction.enriched.subcategory.LegalActivities"))
    .with("OtherProfessionalServices", () =>
      t("transaction.enriched.subcategory.OtherProfessionalServices"),
    )
    .with("StationaryServices", () => t("transaction.enriched.subcategory.StationaryServices"))
    .with("GovernmentAndCityCouncils", () =>
      t("transaction.enriched.subcategory.GovernmentAndCityCouncils"),
    )
    .with("BarsAndRestaurants", () => t("transaction.enriched.subcategory.BarsAndRestaurants"))
    .with("CoffeeAndBakeries", () => t("transaction.enriched.subcategory.CoffeeAndBakeries"))
    .with("FoodDelivery", () => t("transaction.enriched.subcategory.FoodDelivery"))
    .with("PubsAndNightclubs", () => t("transaction.enriched.subcategory.PubsAndNightclubs"))
    .with("BooksAndNewspapers", () => t("transaction.enriched.subcategory.BooksAndNewspapers"))
    .with("CigarShops", () => t("transaction.enriched.subcategory.CigarShops"))
    .with("ClothingShoesAndAccessories", () =>
      t("transaction.enriched.subcategory.ClothingShoesAndAccessories"),
    )
    .with("ComputersAndElectronicDevices", () =>
      t("transaction.enriched.subcategory.ComputersAndElectronicDevices"),
    )
    .with("DepartmentStores", () => t("transaction.enriched.subcategory.DepartmentStores"))
    .with("Furniture", () => t("transaction.enriched.subcategory.Furniture"))
    .with("GamesAndToys", () => t("transaction.enriched.subcategory.GamesAndToys"))
    .with("HardwareStores", () => t("transaction.enriched.subcategory.HardwareStores"))
    .with("HouseholdItems", () => t("transaction.enriched.subcategory.HouseholdItems"))
    .with("Pets", () => t("transaction.enriched.subcategory.Pets"))
    .with("SoftwareServices", () => t("transaction.enriched.subcategory.SoftwareServices"))
    .with("CarRental", () => t("transaction.enriched.subcategory.CarRental"))
    .with("MetroBusAndTrains", () => t("transaction.enriched.subcategory.MetroBusAndTrains"))
    .with("MotorVehiclesRepairsAndAccessories", () =>
      t("transaction.enriched.subcategory.MotorVehiclesRepairsAndAccessories"),
    )
    .with("OtherTransportProviders", () =>
      t("transaction.enriched.subcategory.OtherTransportProviders"),
    )
    .with("PrivateMobilityServices", () =>
      t("transaction.enriched.subcategory.PrivateMobilityServices"),
    )
    .with("ServiceStations", () => t("transaction.enriched.subcategory.ServiceStations"))
    .with("TollsAndParkings", () => t("transaction.enriched.subcategory.TollsAndParkings"))
    .with("Airlines", () => t("transaction.enriched.subcategory.Airlines"))
    .with("FerriesAndBoats", () => t("transaction.enriched.subcategory.FerriesAndBoats"))
    .with("HotelsAndAccommodation", () =>
      t("transaction.enriched.subcategory.HotelsAndAccommodation"),
    )
    .with("TravelAgents", () => t("transaction.enriched.subcategory.TravelAgents"))
    .with("ATM", () => t("transaction.enriched.subcategory.ATM"))
    .with("OfficeRental", () => t("transaction.enriched.subcategory.OfficeRental"))
    .with("HrAndRecruiting", () => t("transaction.enriched.subcategory.HrAndRecruiting"))
    .with("Flowers", () => t("transaction.enriched.subcategory.Flowers"))
    .with("OtherStores", () => t("transaction.enriched.subcategory.OtherStores"))
    .with("PerfumesAndCosmetics", () => t("transaction.enriched.subcategory.PerfumesAndCosmetics"))
    .with("Other", () => t("transaction.enriched.subcategory.Other"))
    .otherwise(value => value);
};

export const getMerchantCategoryLabel = (category: MerchantCategory) => {
  return match(category)
    .with("Culture", () => t("transaction.enriched.category.Culture"))
    .with("Entertainment", () => t("transaction.enriched.category.Entertainment"))
    .with("Finance", () => t("transaction.enriched.category.Finance"))
    .with("Groceries", () => t("transaction.enriched.category.Groceries"))
    .with("HealthAndBeauty", () => t("transaction.enriched.category.HealthAndBeauty"))
    .with("HomeAndUtilities", () => t("transaction.enriched.category.HomeAndUtilities"))
    .with("Other", () => t("transaction.enriched.category.Other"))
    .with("ProfessionalServices", () => t("transaction.enriched.category.ProfessionalServices"))
    .with("PublicAdministrations", () => t("transaction.enriched.category.PublicAdministrations"))
    .with("Restaurants", () => t("transaction.enriched.category.Restaurants"))
    .with("Shopping", () => t("transaction.enriched.category.Shopping"))
    .with("Software", () => t("transaction.enriched.category.Software"))
    .with("Transport", () => t("transaction.enriched.category.Transport"))
    .with("Travel", () => t("transaction.enriched.category.Travel"))
    .exhaustive();
};

const getTransactionIcon = (transaction: Transaction): IconName =>
  match(transaction)
    .returnType<IconName>()
    .with(
      { __typename: "CardTransaction", enrichedTransactionInfo: { category: P.select(P.string) } },
      category => getMerchantCategoryIcon(category),
    )
    .with({ __typename: "CardTransaction" }, () => "payment-regular")
    .otherwise(() => "arrow-swap-regular");

export const getTransactionLabel = (transaction: Transaction): string =>
  match(transaction)
    .with({ __typename: "FeeTransaction" }, ({ feesType }) => {
      if (feesType === "BankingFee") {
        return transaction.label;
      }

      try {
        return match(`paymentMethod.fees.${feesType}`)
          .with(P.when(isTranslationKey), key => t(key))
          .exhaustive();
      } catch {
        return transaction.label;
      }
    })
    //The check number is the first 7 numbers of the cmc7
    .with({ __typename: "CheckTransaction" }, ({ cmc7 }) => `Check N° ${cmc7.slice(0, 7)}`)
    .otherwise(() => transaction.label);

export const TransactionTypeCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={styles.cell}>
      {match(transaction)
        .with(
          {
            __typename: "CardTransaction",
            enrichedTransactionInfo: { logoUrl: P.select(P.string) },
          },
          logoUrl => <Image source={logoUrl} style={styles.merchantLogo} />,
        )
        .otherwise(() => (
          <Tag
            icon={getTransactionIcon(transaction)}
            color={match(transaction.statusInfo)
              .with({ __typename: "RejectedTransactionStatusInfo" }, () => "negative" as const)
              .with(
                { __typename: "ReleasedTransactionStatusInfo" },
                { __typename: "BookedTransactionStatusInfo" },
                () => (transaction.side === "Debit" ? ("gray" as const) : ("positive" as const)),
              )
              .otherwise(() => "gray" as const)}
          />
        ))}
    </View>
  );
};

export const TransactionNameCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={styles.cell}>
      <LakeHeading variant="h5" level={3} style={styles.overflowingText}>
        {getTransactionLabel(transaction)}
      </LakeHeading>

      {match(transaction.statusInfo.__typename)
        .with("PendingTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="shakespear">{t("transactionStatus.pending")}</Tag>
          </>
        ))
        .with("RejectedTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
          </>
        ))
        .with("CanceledTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
          </>
        ))
        .otherwise(() => null)}
    </View>
  );
};

const formatTransactionType = (typename: string) => {
  const unprefixed = typename.startsWith("SEPA") ? typename.slice(4) : typename;

  return (
    unprefixed.charAt(0).toUpperCase() +
    unprefixed
      .slice(1)
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
  );
};

export const TransactionMethodCell = ({
  transaction,
}: {
  transaction: Transaction | { __typename: string };
}) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <LakeText align="right" variant="smallMedium" color={colors.gray[600]}>
        {match(transaction)
          .with({ __typename: "CardTransaction" }, () => t("transactions.method.Card"))
          .with({ __typename: "CheckTransaction" }, () => t("transactions.method.Check"))
          .with({ __typename: "FeeTransaction" }, () => t("transactions.method.Fees"))
          .with(
            { __typename: "InternalCreditTransfer" },
            { type: "SepaInstantCreditTransferIn" },
            { type: "SepaInstantCreditTransferOut" },
            () => t("transactions.method.InstantTransfer"),
          )
          .with(
            { __typename: "SEPACreditTransferTransaction" },
            { __typename: "InternationalCreditTransferTransaction" },
            () => t("transactions.method.Transfer"),
          )
          .with(
            { __typename: "InternalDirectDebitTransaction" },
            { __typename: "SEPADirectDebitTransaction" },
            () => t("transactions.method.DirectDebit"),
          )
          .otherwise(({ __typename }) => formatTransactionType(__typename))}
      </LakeText>
    </View>
  );
};

export const TransactionExecutionDateCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <LakeText align="right" variant="smallMedium" color={colors.gray[600]}>
        {dayjs(transaction.executionDate).format("LL")}
      </LakeText>
    </View>
  );
};

const TransactionAmount = ({ transaction }: { transaction: Transaction }) => (
  <LakeHeading
    level={4}
    variant="h5"
    color={match(transaction.statusInfo)
      .with({ __typename: "RejectedTransactionStatusInfo" }, () => colors.negative[600])
      .with(
        { __typename: "ReleasedTransactionStatusInfo" },
        { __typename: "BookedTransactionStatusInfo" },
        () => (transaction.side === "Debit" ? colors.gray[900] : colors.positive[600]),
      )
      .otherwise(() => colors.gray[900])}
  >
    {(transaction.side === "Debit" ? "-" : "+") +
      formatCurrency(Number(transaction.amount.value), transaction.amount.currency)}
  </LakeHeading>
);

const TransactionOriginalAmount = ({
  transaction,
}: {
  transaction: Transaction &
    (
      | {
          __typename: "CardTransaction";
          originalAmount: { currency: string; value: string };
        }
      | {
          __typename: "InternationalCreditTransferTransaction";
          internationalCurrencyExchange: {
            targetAmount: { currency: string; value: string };
          };
        }
    );
}) => {
  return (
    <LakeText
      variant="smallRegular"
      color={match(transaction.statusInfo)
        .with({ __typename: "RejectedTransactionStatusInfo" }, () => colors.negative[400])
        .with(
          { __typename: "ReleasedTransactionStatusInfo" },
          { __typename: "BookedTransactionStatusInfo" },
          () => (transaction.side === "Debit" ? colors.gray[400] : colors.positive[400]),
        )
        .otherwise(() => colors.gray[400])}
    >
      {(transaction.side === "Debit" ? "-" : "+") +
        match(transaction)
          .with({ __typename: "CardTransaction" }, transaction =>
            formatCurrency(
              Number(transaction.originalAmount.value),
              transaction.originalAmount.currency,
            ),
          )
          .with({ __typename: "InternationalCreditTransferTransaction" }, transaction =>
            formatCurrency(
              Number(transaction.internationalCurrencyExchange.targetAmount.value),
              transaction.internationalCurrencyExchange.targetAmount.currency,
            ),
          )
          .exhaustive()}
    </LakeText>
  );
};

export const TransactionAmountCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <View style={styles.amounts}>
        <TransactionAmount transaction={transaction} />

        {match(transaction)
          .with(
            {
              __typename: "CardTransaction",
              originalAmount: { value: P.string, currency: P.string },
            },
            transaction =>
              transaction.originalAmount.currency !== transaction.amount.currency ? (
                <TransactionOriginalAmount transaction={transaction} />
              ) : null,
          )
          .with(
            {
              __typename: "InternationalCreditTransferTransaction",
              internationalCurrencyExchange: {
                sourceAmount: { currency: P.string },
                targetAmount: { value: P.string, currency: P.string },
              },
            },
            transaction =>
              transaction.internationalCurrencyExchange.sourceAmount.currency !==
              transaction.internationalCurrencyExchange.targetAmount.currency ? (
                <TransactionOriginalAmount transaction={transaction} />
              ) : null,
          )
          .otherwise(() => null)}
      </View>
    </View>
  );
};

export const TransactionSummaryCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.transactionSummary}>
        <LakeText variant="smallRegular" style={styles.overflowingText}>
          {getTransactionLabel(transaction)}
        </LakeText>

        <TransactionAmount transaction={transaction} />
      </View>

      <Fill minWidth={32} />

      <View>
        {match(transaction.statusInfo.__typename)
          .with("PendingTransactionStatusInfo", () => (
            <>
              <Space width={12} />
              <Tag color="shakespear">{t("transactionStatus.pending")}</Tag>
            </>
          ))
          .with("RejectedTransactionStatusInfo", () => (
            <>
              <Space width={12} />
              <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
            </>
          ))
          .with("CanceledTransactionStatusInfo", () => (
            <>
              <Space width={12} />
              <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
            </>
          ))
          .otherwise(() => null)}
      </View>
    </View>
  );
};
