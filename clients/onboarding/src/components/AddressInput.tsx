import { AsyncData, Future, Result } from "@swan-io/boxed";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Combobox } from "@swan-io/lake/src/components/Combobox";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import {
  countriesWithMultipleCCA3,
  CountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { useGoogleMapSDK } from "@swan-io/shared-business/src/hooks/useGoogleMapSDK";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { match } from "ts-pattern";
import poweredByGoogle from "../assets/imgs/powered_by_google_on_white_hdpi.png";
import { locale, t } from "../utils/i18n";
import { logFrontendError } from "../utils/logger";

const styles = StyleSheet.create({
  itemTitle: {
    ...typography.bodyLarge,
    lineHeight: typography.lineHeights.title,
  },
  itemSubtitle: {
    ...typography.bodySmall,
    color: colors.gray[400],
  },
  manualButtonInline: {
    bottom: 32, // align button with input
  },
  poweredByGoogle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

type Suggestion = {
  value: string; // Google 'place_id; value.
  prediction: google.maps.places.AutocompletePrediction;
};

export type PlaceDetail = {
  completeAddress: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
};

type Props = {
  country: CountryCCA3;
  disabled?: boolean;
  error?: string;
  inline?: boolean;
  label?: string;
  placeholder?: string;
  manualModeEnabled?: boolean;
  onManualMode?: () => void;
  onSuggestion?: (place: PlaceDetail) => void;
};

type State = AsyncData<Result<Suggestion[], unknown>>;

export const AddressInput = ({
  label,
  placeholder,
  country,
  inline = false,
  manualModeEnabled = false,
  disabled,
  error,
  onSuggestion,
  onManualMode,
}: Props) => {
  const [state, setState] = useState<State>(AsyncData.NotAsked());
  const [value, setValue] = useState("");

  const sdk = useGoogleMapSDK({
    language: locale.language.toLowerCase(),
    apiKey: __env.CLIENT_GOOGLE_MAPS_API_KEY,
  });

  const autocomplete = useMemo(
    () => sdk.map(google => new google.maps.places.AutocompleteService()),
    [sdk],
  );

  useEffect(() => {
    if (value.length <= 3) {
      return setState(AsyncData.NotAsked());
    }

    setState(AsyncData.Loading());

    const request = Future.make<Result<google.maps.places.AutocompleteResponse, unknown>>(
      resolve => {
        const timeoutId = setTimeout(() => {
          if (autocomplete.isDone()) {
            Future.fromPromise(
              autocomplete.get().getPlacePredictions({
                input: value,
                componentRestrictions: {
                  country: countriesWithMultipleCCA3[country] ?? [country],
                },
                types: ["address"],
              }),
            ).onResolve(resolve);
          }
        }, 250);

        return () => clearTimeout(timeoutId);
      },
    ).mapOk(
      ({ predictions }) => predictions.map(p => ({ value: p.place_id, prediction: p })),
      true,
    );

    request
      .tapError(error => logFrontendError(error))
      .onResolve(value => setState(AsyncData.Done(value)));

    return () => request.cancel();
  }, [country, value, autocomplete]);

  return sdk.match({
    NotAsked: () => null,
    Loading: () => null,
    Done: google => {
      const place = new google.maps.places.PlacesService(document.createElement("div"));

      const selectAddress = (suggestion: Suggestion) => {
        place.getDetails({ placeId: suggestion.value }, placeDetail => {
          const result = {
            completeAddress: "",
            streetNumber: "",
            postalCode: "",
            country: "",
            city: "",
          };

          placeDetail?.address_components?.forEach(({ types, short_name, long_name }) => {
            const type = types[0];
            match(type)
              .with("street_number", () => (result.streetNumber = long_name))
              .with("route", () => (result.completeAddress = long_name))
              .with("postal_code", () => (result.postalCode = short_name))
              .with("country", () => (result.country = short_name))
              .with("locality", () => (result.city = long_name))
              .otherwise(() => {});
          });

          if (result.streetNumber != "") {
            if (placeDetail?.name === `${result.completeAddress} ${result.streetNumber}`) {
              result.completeAddress = `${result.completeAddress} ${result.streetNumber}`;
            } else {
              result.completeAddress = `${result.streetNumber} ${result.completeAddress}`;
            }
          }

          setValue("");
          onSuggestion?.(result);
        });
      };

      return (
        <Box direction={inline ? "row" : "column"} alignItems={inline ? "end" : "stretch"}>
          <Combobox
            style={commonStyles.fill}
            label={label}
            placeholder={placeholder ?? t("addressInput.placeholder")}
            value={value}
            items={state.match({
              NotAsked: () => [],
              Loading: () => [],
              Done: result =>
                result.match({
                  Ok: suggestions => suggestions,
                  Error: () => [],
                }),
            })}
            icon="search-filled"
            loading={state.isLoading()}
            disabled={disabled}
            error={error}
            onValueChange={setValue}
            onSelectItem={selectAddress}
            ListFooterComponent={
              <Box direction="row" justifyContent="end" style={styles.poweredByGoogle}>
                <AutoWidthImage height={14} sourceUri={poweredByGoogle} />
              </Box>
            }
            renderItem={item => (
              <>
                <Text numberOfLines={1} selectable={false} style={styles.itemTitle}>
                  {item.prediction.structured_formatting.main_text}
                </Text>

                <Text numberOfLines={1} selectable={false} style={styles.itemSubtitle}>
                  {item.prediction.structured_formatting.secondary_text}
                </Text>
              </>
            )}
          />

          {!manualModeEnabled && (
            <>
              <Space width={8} height={8} />

              <LakeButton
                color="gray"
                onPress={onManualMode}
                style={inline && styles.manualButtonInline}
                size={inline ? "large" : "small"}
              >
                {t("addressInput.button")}
              </LakeButton>
            </>
          )}
        </Box>
      );
    },
  });
};
