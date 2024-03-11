import { Future, Result } from "@swan-io/boxed";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Request, badStatusToError, emptyToError } from "@swan-io/request";

// We set all fields optional because values comes from a free external service we can't trust at 100%
// https://www.pappers.fr/api/documentation
type PappersResult = {
  siren?: string;
  nom_entreprise?: string;
  denomination?: string;
  siege?: {
    code_postal?: string;
    ville?: string;
  };
};

type PappersResults = {
  resultats_siren?: (PappersResult | undefined)[];
  resultats_nom_entreprise?: (PappersResult | undefined)[];
  resultats_denomination?: (PappersResult | undefined)[];
};

export type CompanySuggestion = {
  city: string;
  name: string;
  siren: string;
  value: string;
};

export const queryCompanies = (query: string): Future<Result<Array<CompanySuggestion>, Error>> => {
  const params = new URLSearchParams({
    cibles: "nom_entreprise,denomination,siren",
    q: query,
  });
  const url = `https://suggestions.pappers.fr/v2?${params.toString()}`;
  return Request.make({
    url,
    method: "GET",
    responseType: "json",
  })
    .mapOkToResult(badStatusToError)
    .mapOkToResult(emptyToError)
    .mapOk(value => value as PappersResults)
    .mapOk(
      ({ resultats_siren = [], resultats_nom_entreprise = [], resultats_denomination = [] }) => {
        return [...resultats_siren, ...resultats_nom_entreprise, ...resultats_denomination]
          .filter(isNotNullish)
          .reduce<CompanySuggestion[]>((acc, result) => {
            const { denomination, nom_entreprise, siege, siren = "" } = result;

            const name = nom_entreprise ?? denomination ?? "";
            const city = [siege?.code_postal, siege?.ville].filter(isNotNullish).join(" ");

            // we don't display result without name, without siren or already displayed
            return name === "" || siren === "" || acc.some(suggestion => suggestion.siren === siren)
              ? acc
              : [...acc, { value: siren, siren, name, city }];
          }, []);
      },
      true,
    );
};
