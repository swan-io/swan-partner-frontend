import { AsyncData, Option, Result } from "@swan-io/boxed";
import { ClientError, parseGraphQLError, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { backgroundColor, colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { AccountCountry, GetVerificationRenewalDocument } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { ErrorView } from "../ErrorView";
import { ForbiddenView } from "../ForbiddenView";
import { VerificationRenewalCompany } from "./VerificationRenewalCompany";
import { VerificationRenewalFinalizeSuccess } from "./VerificationRenewalFinalize";
import { VerificationRenewalHeader } from "./VerificationRenewalHeader";
import { VerificationRenewalIndividual } from "./VerificationRenewalIndividual";

const styles = StyleSheet.create({
  main: {
    backgroundColor: backgroundColor.default90Transparency,
    minHeight: "100vh",
  },
  fill: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
    maxWidth: 1280,
    marginHorizontal: "auto",
  },
  contentDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  sticky: {
    position: "sticky",
    top: 0,
    backgroundColor: backgroundColor.default90Transparency,
    backdropFilter: "blur(4px)",
    zIndex: 10,
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
    .with({ data: AsyncData.P.Done(Result.P.Error(P.select())) }, error => {
      const isForbidden = ClientError.toArray(error)
        .map(parseGraphQLError)
        .map(error => error.extensions)
        .some(ext => ext?.code === "Forbidden");

      if (isForbidden) {
        return (
          <ForbiddenView
            title={t("verificationRenewal.forbidden.title")}
            subtitle={t("verificationRenewal.forbidden.subtitle")}
          />
        );
      } else {
        return <ErrorView error={error} />;
      }
    })

    .with(
      { data: AsyncData.P.Done(Result.P.Ok(P.select())) },
      ({ projectInfo, verificationRenewal }) => {
        const projectColor = projectInfo?.accentColor ?? invariantColors.defaultAccentColor;

        const renewalSupportingDoc = match(verificationRenewal)
          .with(
            {
              __typename: "WaitingForInformationVerificationRenewal",
              supportingDocumentCollection: P.nonNullable,
            },
            ({ supportingDocumentCollection }) => supportingDocumentCollection,
          )
          .otherwise(() => null);

        const accountCountry = match(verificationRenewal)
          .returnType<Option<AccountCountry>>()
          .with({ accountCountries: P.nonNullable }, ({ accountCountries }) =>
            Option.fromNullable(accountCountries[0]),
          )
          .otherwise(() => Option.None());

        return (
          <LakeScrollView contentContainerStyle={styles.main}>
            <WithPartnerAccentColor color={projectColor}>
              <ResponsiveContainer style={styles.fill}>
                {({ large }) => (
                  <>
                    <Box style={styles.sticky}>
                      <VerificationRenewalHeader
                        projectName={projectInfo.name}
                        projectLogo={projectInfo.logoUri}
                      />
                    </Box>

                    <View style={[styles.content, large && styles.contentDesktop]}>
                      {match({ verificationRenewal, accountCountry })
                        .with(
                          {
                            verificationRenewal: {
                              info: { __typename: "CompanyVerificationRenewalInfo" },
                            },
                            accountCountry: Option.P.Some(P.string),
                          },
                          ({ verificationRenewal, accountCountry }) => (
                            <VerificationRenewalCompany
                              accountCountry={accountCountry.get()}
                              verificationRenewalId={verificationRenewalId}
                              info={verificationRenewal.info}
                              supportingDocumentCollection={renewalSupportingDoc}
                              verificationRenewal={verificationRenewal}
                              projectName={projectInfo.name}
                            />
                          ),
                        )
                        .with(
                          {
                            verificationRenewal: {
                              info: { __typename: "IndividualVerificationRenewalInfo" },
                            },
                            accountCountry: Option.P.Some(P.string),
                          },
                          ({ verificationRenewal, accountCountry }) => (
                            <VerificationRenewalIndividual
                              accountCountry={accountCountry.get()}
                              verificationRenewalId={verificationRenewalId}
                              info={verificationRenewal.info}
                              supportingDocumentCollection={renewalSupportingDoc}
                              verificationRenewal={verificationRenewal}
                              projectName={projectInfo.name}
                            />
                          ),
                        )
                        .with(
                          {
                            verificationRenewal: {
                              __typename: "PendingVerificationRenewal",
                            },
                          },
                          () => <VerificationRenewalFinalizeSuccess />,
                        )
                        .otherwise(() => (
                          <ErrorView
                            style={{
                              flex: 1,
                              justifyContent: "center",
                            }}
                          />
                        ))}
                    </View>
                  </>
                )}
              </ResponsiveContainer>
            </WithPartnerAccentColor>
          </LakeScrollView>
        );
      },
    )
    .exhaustive();
};
