import { AsyncData, Future, Result } from "@swan-io/boxed";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Combobox } from "@swan-io/lake/src/components/Combobox";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import {
  countriesWithMultipleCCA3,
  CountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { useGoogleMapSDK } from "@swan-io/shared-business/src/hooks/useGoogleMapSDK";
import { useEffect, useMemo, useState } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { match } from "ts-pattern";
import poweredByGoogle from "../assets/imgs/powered_by_google_on_white_hdpi.png";
import { t } from "../utils/i18n";
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
  poweredByGoogle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

type PlaceDetail = {
  city: string;
  postalCode: string;
};

type Suggestion = {
  value: string; // Google 'place_id; value.
  prediction: google.maps.places.AutocompletePrediction;
};

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  country: CountryCCA3;
  disabled?: boolean;
  error?: string;
  label: string;
  onSuggestion?: (place: PlaceDetail) => void;
  style: StyleProp<ViewStyle>;
};

type State = AsyncData<Result<Suggestion[], unknown>>;

export const CityInput = ({
  value,
  onValueChange,
  label,
  country,
  disabled,
  error,
  onSuggestion,
  style,
}: Props) => {
  const [state, setState] = useState<State>(AsyncData.NotAsked());
  const sdk = useGoogleMapSDK({ apiKey: __env.CLIENT_GOOGLE_MAPS_API_KEY });

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
                  country: [...(countriesWithMultipleCCA3[country] ?? [country])],
                },
                types: ["(cities)"],
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
            postalCode: "",
            city: "",
          };

          placeDetail?.address_components?.forEach(({ types, short_name, long_name }) => {
            const type = types[0];

            match(type)
              .with("postal_code", () => (result.postalCode = short_name))
              .with("locality", () => (result.city = long_name))
              .otherwise(() => {});
          });

          onSuggestion?.(result);
        });
      };

      return (
        <Combobox
          style={StyleSheet.flatten([commonStyles.fill, style])}
          label={label}
          placeholder={t("addressInput.placeholder")}
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
          onValueChange={onValueChange}
          ListFooterComponent={
            <Box direction="row" justifyContent="end" style={styles.poweredByGoogle}>
              <AutoWidthImage height={14} sourceUri={poweredByGoogle} />
            </Box>
          }
          onSelectItem={selectAddress}
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
      );
    },
  });
};
