import { Future, Result } from "@swan-io/boxed";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";

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

export const queryCompanies = (query: string): Future<Result<Array<CompanySuggestion>, Error>> =>
  Future.make<Result<PappersResults, Error>>(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "json";

    const params = new URLSearchParams({
      cibles: "nom_entreprise,denomination,siren",
      q: query,
    });

    xhr.open("GET", `https://suggestions.pappers.fr/v2?${params.toString()}`, true);

    xhr.addEventListener("load", () => {
      resolve(
        (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304
          ? Result.Ok(xhr.response as PappersResults)
          : Result.Error(new Error(xhr.statusText)),
      );
    });

    xhr.addEventListener("error", () => {
      resolve(Result.Error(new Error("Failed to fetch companies")));
    });

    const timeoutId = setTimeout(() => xhr.send(), 250);

    return () => {
      xhr.abort();
      clearTimeout(timeoutId);
    };
  }).mapOk(
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
