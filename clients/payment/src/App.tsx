import { Box } from "@swan-io/lake/src/components/Box";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { backgroundColor, colors } from "@swan-io/lake/src/constants/design";
import { Suspense, useState } from "react";
import { ScrollView } from "react-native";
import { P, match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
import { ErrorView } from "./components/ErrorView";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { t } from "./utils/i18n";
import { logFrontendError } from "./utils/logger";
import { Router } from "./utils/routes";
import { unauthenticatedClient } from "./utils/urql";

const items = [{ id: "sdd", name: "SEPA Direct Debit" }] as const;

type ItemId = (typeof items)[number]["id"];

export const App = () => {
  const route = Router.useRoute(["PaymentLinkArea"]);

  const [selected, setSelected] = useState<ItemId>(items[0].id);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={({ error }) => <ErrorView error={error} />}
    >
      <Suspense fallback={<LoadingView color={colors.gray[50]} />}>
        <ClientProvider value={unauthenticatedClient}>
          {match(route)
            .with({ name: "PaymentLinkArea" }, () => (
              <ScrollView>
                <Box>
                  <Box>
                    <LakeLabel
                      label={t("paymentLink.paymentMethod")}
                      render={() => (
                        <SegmentedControl
                          mode="desktop"
                          selected={selected}
                          items={[{ name: "Direct debit", id: "sdd" }]}
                          onValueChange={setSelected}
                        />
                      )}
                    />
                  </Box>

                  <LakeLabel label={t("paymentLink.iban")} render={() => <LakeTextInput />} />
                  <LakeLabel label={t("paymentLink.country")} render={() => <LakeTextInput />} />

                  <Box direction="row">
                    <LakeLabel
                      label={t("paymentLink.firstName")}
                      render={() => <LakeTextInput />}
                    />

                    <LakeLabel label={t("paymentLink.lastName")} render={() => <LakeTextInput />} />
                  </Box>

                  <LakeLabel
                    label={t("paymentLink.addressLine1")}
                    render={() => <LakeTextInput />}
                  />

                  <LakeLabel
                    label={t("paymentLink.addressLine2")}
                    render={() => <LakeTextInput />}
                  />

                  <LakeLabel label={t("paymentLink.city")} render={() => <LakeTextInput />} />

                  <Box direction="row">
                    <LakeLabel label={t("paymentLink.postcode")} render={() => <LakeTextInput />} />
                    <LakeLabel label={t("paymentLink.state")} render={() => <LakeTextInput />} />
                  </Box>

                  <LakeButton onPress={() => {}}>
                    <LakeText color={backgroundColor.accented}> {t("button.pay")}</LakeText>
                  </LakeButton>
                </Box>
              </ScrollView>
            ))
            .with(P.nullish, () => <NotFoundPage />)
            .exhaustive()}
        </ClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
};
