import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { colors } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { match, P } from "ts-pattern";
import { OnboardingRepresentative } from "../graphql/partner";
import { t } from "../utils/i18n";

type RepresentativeItem = Item<string> & {
  roles: string;
  fullName: string;
};

type props = {
  representatives: OnboardingRepresentative[];
  value?: string;
  error?: string;
  onChange: (value: string) => void;
};

export const RepresentativeFormsInput = ({ representatives, value, onChange, error }: props) => {
  const items: RepresentativeItem[] = useMemo(() => {
    const representativesItems = representatives
      .map(representative => {
        return match(representative)
          .with(
            {
              __typename: "OnboardingIndividualRepresentative",
              firstName: P.string,
              lastName: P.string,
              roles: P.array(P.string),
            },
            ({ roles, firstName, lastName }) => ({
              name: `${firstName} ${lastName} - ${roles.join(", ")}`,
              fullName: `${firstName} ${lastName}`,
              value: lastName,
              roles: roles.join(", "),
            }),
          )
          .with(
            {
              __typename: "OnboardingCompanyRepresentative",
              entityName: P.string,
              roles: P.array(P.string),
            },
            ({ roles, entityName }) => ({
              name: `${entityName} - ${roles.join(", ")}`,
              fullName: `${entityName}`,
              value: entityName,
              roles: roles.join(", "),
            }),
          )
          .otherwise(() => null);
      })
      .filter(item => item !== null);

    const unlisted = {
      name: t("company.step.organisation.representative.unlisted"),
      fullName: "",
      value: "",
      roles: "",
    };

    return [...representativesItems, unlisted];
  }, [representatives]);

  return (
    <LakeLabel
      label={t("company.step.organisation.representativeLabel")}
      render={id => (
        <LakeSelect
          id={id}
          placeholder={t("company.step.organisation.representativePlaceholder")}
          value={value}
          onValueChange={onChange}
          items={items}
          error={error}
          renderItem={item =>
            item.value === "" ? (
              <Box direction="column">
                <LakeText>{item.name}</LakeText>
              </Box>
            ) : (
              <Box direction="column">
                <LakeText color={colors.gray[900]}>{item.fullName}</LakeText>
                <LakeText variant="smallRegular" color={colors.gray[600]}>
                  {item.roles}
                </LakeText>
              </Box>
            )
          }
        />
      )}
    />
  );
};
