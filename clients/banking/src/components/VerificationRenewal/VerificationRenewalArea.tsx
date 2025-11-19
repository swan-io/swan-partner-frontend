import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { backgroundColor, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { GetVerificationRenewalDocument } from "../../graphql/partner";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalIndividual } from "./VerificationRenewalIndividual";

const styles = StyleSheet.create({
  main: {
    backgroundColor: backgroundColor.default90Transparency,
    // backdropFilter: "blur(4px)",
  },
});

type Props = {
  verificationRenewalId: string;
};

export const VerificationRenewalArea = ({ verificationRenewalId }: Props) => {
  const [data] = useQuery(GetVerificationRenewalDocument, { id: verificationRenewalId });

  return match({ data })
    .with({ data: P.union(AsyncData.P.NotAsked, AsyncData.P.Loading) }, () => (
      <LoadingView color={colors.gray[400]} />
    ))
    .with({ data: AsyncData.P.Done(Result.P.Error(P.select())) }, error => (
      <ErrorView error={error} />
    ))
    .with({ data: AsyncData.P.Done(Result.P.Ok(P.select())) }, data => {
      const { projectInfo, verificationRenewal } = data;
      const projectColor = projectInfo?.accentColor ?? invariantColors.defaultAccentColor;
      const accountAdmin = match(verificationRenewal?.info)
        .with(
          { __typename: "CompanyVerificationRenewalInfo", accountAdmin: P.select() },
          accountAdmin => accountAdmin,
        )
        .with(
          { __typename: "IndividualVerificationRenewalInfo", accountAdmin: P.select() },
          accountAdmin => accountAdmin,
        )
        .otherwise(() => null);

      return (
        <View style={styles.main}>
          <WithPartnerAccentColor color={projectColor}>
            {match(accountAdmin)
              .with({ __typename: "CompanyVerificationRenewalAccountAdmin" }, () => <p>Company</p>)
              .with({ __typename: "IndividualVerificationRenewalAccountAdmin" }, admin => (
                <VerificationRenewalIndividual
                  accountAdmin={admin}
                  projectInfo={projectInfo}
                  verificationRenewalId={verificationRenewalId}
                />
              ))
              .otherwise(() => (
                <ErrorView />
              ))}
          </WithPartnerAccentColor>
        </View>
      );
    })
    .exhaustive();
};
