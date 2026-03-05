import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, radii, texts } from "@swan-io/lake/src/constants/design";
import { Pressable, StyleSheet, View } from "react-native";
import { v4 as uuid } from "uuid";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  CompanyRelatedCompany,
  CompanyRelatedIndividual,
  RelatedCompanyInput,
  RelatedIndividualInput,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { formatNestedMessage, t } from "../../../utils/i18n";

import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { useMemo, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { ownershipText, ownershipTypeText } from "../../../constants/business";
import { cleanData, transformRelatedIndividualsToInput } from "../../../utils/onboarding";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import {
  OnboardingCompanyOwnershipFormRef,
  OwnershipFormStep,
  OwnershipFormWizard,
  OwnershipSubForm,
  REFERENCE_SYMBOL,
  SaveValue,
  SaveValueCompany,
  SaveValueIndividual,
} from "./ownership/OwnershipFormWizard";

type ModalState =
  | {
      type: "hidden";
    }
  | {
      type: "delete";
      reference: string;
      name: string;
      related: "company" | "individual";
    }
  | {
      type: "add";
      step: OwnershipFormStep;
      form?: OwnershipSubForm;
    }
  | {
      type: "edit";
      step: OwnershipFormStep;
      form?: OwnershipSubForm;
      initialValue: LocalRelated;
    };

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
};

type WithReference<T> = T & { [REFERENCE_SYMBOL]: string };
type LocalRelatedCompany = WithReference<CompanyRelatedCompany>;
type LocalRelatedIndividual = WithReference<CompanyRelatedIndividual>;
type LocalRelated = LocalRelatedCompany | LocalRelatedIndividual;

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gap: "16px 32px",
  },
  addOwnerButton: {
    padding: 24,
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radii[8],
    borderStyle: "dashed",
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: "8px",
  },
  textTitle: {
    ...texts.medium,
    color: colors.gray[900],
    marginBottom: 4,
  },
  textSubTitle: {
    ...texts.smallMedium,
    color: colors.gray[900],
  },
});

type ActionMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const ActionMenu = ({ onEdit, onDelete }: ActionMenuProps) => (
  <View style={{ width: 64 }}>
    <LakeButton
      size="small"
      mode="tertiary"
      icon="edit-regular"
      color="gray"
      onPress={onEdit}
      ariaLabel={t("common.edit")}
    />
    <Space width={4} />
    <LakeButton
      size="small"
      mode="tertiary"
      icon="delete-regular"
      color="negative"
      onPress={onDelete}
      ariaLabel={t("common.delete")}
    />
  </View>
);

export const OnboardingCompanyOwnership = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { company, accountInfo } = onboarding;

  const accountCountry = accountInfo?.country;
  const companyCountry = company?.address?.country;

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const currentRelatedCompany: LocalRelatedCompany[] = useMemo(() => {
    const relatedCompanies = company?.relatedCompanies ?? [];
    return relatedCompanies.map(related => ({
      [REFERENCE_SYMBOL]: uuid(),
      ...related,
    }));
  }, [company]);

  const currentRelatedIndividual: LocalRelatedIndividual[] = useMemo(() => {
    const relatedIndividuals = company?.relatedIndividuals ?? [];
    return relatedIndividuals.map(related => ({
      [REFERENCE_SYMBOL]: uuid(),
      ...related,
    }));
  }, [company]);

  const relatedCompanyAndIndividual: LocalRelated[] = useMemo(() => {
    return [...currentRelatedCompany, ...currentRelatedIndividual];
  }, [currentRelatedCompany, currentRelatedIndividual]);

  const [modalState, setModalState] = useState<ModalState>({ type: "hidden" });
  const ownershipFormRef = useRef<OnboardingCompanyOwnershipFormRef>(null);

  const setFormStep = (step: OwnershipFormStep, form?: OwnershipSubForm) => {
    setModalState(state => ({
      ...state,
      step,
      form,
    }));
  };

  const resetPageState = () => {
    setModalState({ type: "hidden" });
  };

  const addRelatedCompany = (newCompany: SaveValueCompany) => {
    const { roles, ...input } = newCompany;
    const updatedRelatedCompany: RelatedCompanyInput[] = [
      ...currentRelatedCompany,
      {
        roles: roles ?? [],
        ...input,
      },
    ];

    updateRelated(updatedRelatedCompany);
  };

  const editRelatedCompany = (company: SaveValueCompany) => {
    const { roles, ...input } = company;
    const updatedRelatedCompany: RelatedCompanyInput[] = currentRelatedCompany.map(item =>
      item[REFERENCE_SYMBOL] === company[REFERENCE_SYMBOL]
        ? {
            roles: roles ?? [],
            ...input,
          }
        : item,
    );

    updateRelated(updatedRelatedCompany);
  };

  const deleteRelatedCompany = () => {
    // Should be always true because we only open the modal when the pageState is deleting
    if (modalState.type !== "delete") {
      return resetPageState();
    }

    const updatedRelatedCompany = currentRelatedCompany.filter(
      item => item[REFERENCE_SYMBOL] !== modalState.reference,
    );
    updateRelated(updatedRelatedCompany);
  };

  const addRelatedIndividual = (newIndividual: SaveValueIndividual) => {
    const updatedRelatedIndividual = transformRelatedIndividualsToInput(currentRelatedIndividual);
    updatedRelatedIndividual.push(newIndividual);
    updateRelated(updatedRelatedIndividual);
  };

  const editRelatedIndividual = (individual: SaveValueIndividual) => {
    console.log("editRelatedIndividual", individual);

    const updatedRelatedIndividual = currentRelatedIndividual
      .map(item =>
        item[REFERENCE_SYMBOL] === individual[REFERENCE_SYMBOL]
          ? individual
          : transformRelatedIndividualsToInput([item])[0],
      )
      .filter((item): item is RelatedIndividualInput => item != null);
    updateRelated(updatedRelatedIndividual);
  };

  const deleteRelatedIndividual = () => {
    if (modalState.type !== "delete") {
      return resetPageState();
    }

    const filteredRelatedIndividual = currentRelatedIndividual.filter(
      item => item[REFERENCE_SYMBOL] !== modalState.reference,
    );
    const updatedRelatedIndividual = transformRelatedIndividualsToInput(filteredRelatedIndividual);
    updateRelated(updatedRelatedIndividual);
  };

  const updateRelated = (updatedRelated: (RelatedIndividualInput | RelatedCompanyInput)[]) => {
    const company = match(updatedRelated)
      .with(P.array({ entityName: P.nonNullable }), items => ({
        relatedCompanies: cleanData(items),
      }))
      .with(
        P.array({
          type: P.nonNullable,
        }),
        items => ({
          relatedIndividuals: cleanData(items),
        }),
      )
      .otherwise(() => undefined);

    updateCompanyOnboarding({
      input: {
        onboardingId,
        company,
      },
    })
      .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => resetPageState())
      .tapError(error => {
        showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
      });
  };

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const onPressNext = () => {
    Router.push("Finalize", { onboardingId });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ small }) => (
          <>
            <Tile>
              <StepTitle isMobile={small}>{t("company.step.ownership.title")}</StepTitle>
              <Space height={12} />
              <LakeText>{t("company.step.ownership.description")}</LakeText>
              <Space height={24} />

              <LakeText>
                {formatNestedMessage("company.step.ownership.additionalDescription", {
                  bold: text => (
                    <LakeText variant="semibold" color={colors.gray[900]}>
                      {text}
                    </LakeText>
                  ),
                })}
              </LakeText>

              <Space height={24} />

              <Pressable
                role="button"
                style={styles.addOwnerButton}
                onPress={() => setModalState({ type: "add", step: "init" })}
              >
                <Icon name="add-circle-regular" size={24} color={colors.gray[500]} />
                <LakeText>{t("company.step.ownership.addTitle")}</LakeText>
              </Pressable>

              {relatedCompanyAndIndividual.length > 0 && (
                <>
                  <Space height={32} />

                  <Box direction="row">
                    <LakeText style={{ flexGrow: 2, ...styles.textTitle }}>Name</LakeText>
                    <LakeText style={styles.textTitle}>Role</LakeText>
                    <View style={{ width: 64 }} />
                  </Box>
                  <Space height={32} />

                  {relatedCompanyAndIndividual.map((item, index) => (
                    <View key={item[REFERENCE_SYMBOL]}>
                      {index > 0 && (
                        <>
                          <Separator space={16} />
                          <Space height={8} />
                        </>
                      )}

                      {match(item)
                        .with({ __typename: "CompanyRelatedCompany" }, company => (
                          <Box direction="row">
                            <Box grow={2}>
                              <LakeText style={styles.textTitle}>{company.entityName}</LakeText>
                              <LakeText style={texts.smallRegular}>
                                {t("company.step.ownership.company")} • {company.roles.join(", ")}
                              </LakeText>
                            </Box>
                            <LakeText style={styles.textSubTitle}>
                              {t("company.step.ownership.role.legalRepresentative")}
                            </LakeText>
                            <ActionMenu
                              onEdit={() =>
                                setModalState({
                                  type: "edit",
                                  step: "company",
                                  initialValue: company,
                                })
                              }
                              onDelete={() =>
                                setModalState({
                                  type: "delete",
                                  reference: company[REFERENCE_SYMBOL],
                                  name: company.entityName ?? "",
                                  related: "company",
                                })
                              }
                            />
                          </Box>
                        ))
                        .with(
                          {
                            __typename: P.union(
                              "CompanyLegalRepresentative",
                              "CompanyUltimateBeneficialOwner",
                              "CompanyLegalRepresentativeAndUltimateBeneficialOwner",
                            ),
                          },
                          individual => (
                            <Box direction="row">
                              <Box grow={2}>
                                <LakeText style={styles.textTitle}>
                                  {individual.firstName} {individual.lastName}
                                </LakeText>
                                <LakeText style={texts.smallRegular}>
                                  {match(individual)
                                    .with(
                                      { __typename: "CompanyLegalRepresentative" },
                                      ({ legalRepresentative }) =>
                                        legalRepresentative.roles.join(", "),
                                    )
                                    .with(
                                      { __typename: "CompanyUltimateBeneficialOwner" },
                                      ({ ultimateBeneficialOwner }) =>
                                        ultimateBeneficialOwner?.ownership
                                          ? ownershipText(ultimateBeneficialOwner.ownership)
                                          : "",
                                    )
                                    .with(
                                      {
                                        __typename:
                                          "CompanyLegalRepresentativeAndUltimateBeneficialOwner",
                                      },
                                      ({ legalRepresentative, ultimateBeneficialOwner }) =>
                                        legalRepresentative.roles.join(", ") +
                                        (ultimateBeneficialOwner?.ownership
                                          ? ` • ${ownershipText(ultimateBeneficialOwner.ownership)}`
                                          : ""),
                                    )
                                    .exhaustive()}
                                </LakeText>
                              </Box>
                              <LakeText style={styles.textSubTitle}>
                                {ownershipTypeText(individual.type)}
                              </LakeText>
                              <ActionMenu
                                onEdit={() =>
                                  setModalState({
                                    type: "edit",
                                    step: "legal", // @todo update step base on RelatedIndividualType
                                    form: "detail",
                                    initialValue: individual,
                                  })
                                }
                                onDelete={() =>
                                  setModalState({
                                    type: "delete",
                                    reference: individual[REFERENCE_SYMBOL],
                                    name: [individual.firstName, individual.lastName]
                                      .filter(Boolean)
                                      .join(" "),
                                    related: "individual",
                                  })
                                }
                              />
                            </Box>
                          ),
                        )
                        .exhaustive()}
                    </View>
                  ))}
                </>
              )}
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter onNext={onPressNext} onPrevious={onPressPrevious} justifyContent="start" />

      <LakeModal
        visible={match(modalState)
          .with({ type: "add" }, { type: "edit" }, () => true)
          .otherwise(() => false)}
        title={match(modalState)
          .with({ step: "init" }, () => t("company.step.ownership.modal.initTitle"))
          .with({ step: P.union("ubo", "company") }, () =>
            t("company.step.ownership.modal.uboTitle"),
          )
          .with({ step: "legal" }, () => t("company.step.ownership.modal.legalTitle"))
          .with({ step: "legalAndUbo" }, () => t("company.step.ownership.modal.legalAndUboTitle"))
          .otherwise(() => undefined)}
        maxWidth={850}
      >
        <OwnershipFormWizard
          ref={ownershipFormRef}
          subForm={match(modalState)
            .with({ form: P.string }, ({ form }) => form)
            .otherwise(() => undefined)}
          type={modalState.type}
          step={match(modalState)
            .with({ step: P.string }, ({ step }) => step)
            .otherwise(() => "init")}
          accountCountry={accountCountry ?? "FRA"}
          companyCountry={(companyCountry ?? "FRA") as CountryCCA3}
          onStepChange={setFormStep}
          onClose={() => setModalState({ type: "hidden" })}
          onSave={match(modalState)
            .with({ type: "add", step: "company" }, () => addRelatedCompany)
            .with({ type: "edit", step: "company" }, () => editRelatedCompany)
            .with(
              { type: "add", step: P.union("legal", "legalAndUbo", "ubo") },
              () => addRelatedIndividual as (editorState: SaveValue) => void,
            )
            .with(
              { type: "edit", step: P.union("legal", "legalAndUbo", "ubo") },
              () => editRelatedIndividual as (editorState: SaveValue) => void,
            )
            .otherwise(() => noop)}
          initialValues={match(modalState)
            .with({ type: "edit" }, ({ initialValue }) => initialValue)
            .otherwise(() => undefined)}
        />

        <Space height={24} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            onPress={() => ownershipFormRef.current?.cancel()}
            mode="secondary"
            grow={true}
          >
            {match(modalState)
              .with({ step: P.union("init") }, () => t("common.cancel"))
              .with({ step: P.union("company", "legal", "ubo", "legalAndUbo"), type: "edit" }, () =>
                t("common.cancel"),
              )
              .otherwise(() => t("common.back"))}
          </LakeButton>

          <LakeButton
            onPress={() => ownershipFormRef.current?.submit()}
            color="partner"
            grow={true}
            loading={updateResult.isLoading()}
          >
            {match(modalState)
              .with({ step: P.union("company", "legal") }, () => t("common.add"))
              .with({ step: P.union("ubo", "legalAndUbo"), form: "capital" }, () => t("common.add"))
              .otherwise(() => t("common.next"))}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>

      <ConfirmModal
        visible={modalState.type === "delete"}
        title={t("company.step.ownership.deleteTitle", {
          relatedName: modalState.type === "delete" ? modalState.name : "",
        })}
        icon="delete-regular"
        confirmText={t("common.remove")}
        onConfirm={match(modalState)
          .with({ related: "company" }, () => deleteRelatedCompany)
          .with({ related: "individual" }, () => deleteRelatedIndividual)
          .otherwise(() => noop)}
        onCancel={resetPageState}
        color="negative"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
