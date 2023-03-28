import { Link, LinkProps } from "@swan-io/lake/src/components/Link";
import { Except } from "type-fest";
import { TranslationKey, t } from "../utils/i18n";

type ArticleName = "companyAvailableCountries" | "individualAvailableCountries" | "uboDetails";

const links: Record<ArticleName, TranslationKey> = {
  companyAvailableCountries: "supportLink.companyAvailableCountries",
  individualAvailableCountries: "supportLink.individualAvailableCountries",
  uboDetails: "supportLink.uboDetails",
};

type Props = Except<LinkProps, "to" | "target"> & {
  page: keyof typeof links;
};

export const DocumentationLink = ({ page, ...props }: Props) => {
  const to = t(links[page]);
  return <Link to={to} target="blank" {...props} />;
};
