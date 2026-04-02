import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, radii, texts } from "@swan-io/lake/src/constants/design";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
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
import { formatNestedMessage, locale, t } from "../../../utils/i18n";

import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { ownershipText, ownershipTypeText } from "../../../constants/business";
import {
  cleanData,
  namesMatch,
  transformRelatedIndividualsToInput,
} from "../../../utils/onboarding";
import { CompanyOnboardingRouteV2, Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import { extractServerInvalidFields, ServerInvalidFieldCode } from "../../../utils/validation";
import {
  OnboardingCompanyOwnershipFormRef,
  OwnershipFormStep,
  OwnershipFormWizard,
  OwnershipSubForm,
  REFERENCE_SYMBOL,
  SaveValue,
  SaveValueCompany,
  SaveValueIndividual,
  WithReference,
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
      errors: { fieldName: string; code: ServerInvalidFieldCode }[];
    };

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  nextStep: CompanyOnboardingRouteV2;
  serverValidationErrors: {
    fieldName: string;
    code: ServerInvalidFieldCode;
  }[];
};

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
  addOwnerButtonError: {
    borderColor: colors.negative[500],
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
  tagError: {
    marginLeft: "12px",
  },
  action: {
    flexBasis: 0,
  },
  ownerName: {
    paddingRight: 100,
  },
  menu: {
    width: 100,
    flexDirection: "row",
  },
  menuDesktop: {
    position: "absolute",
    top: -8,
    right: 0,
    justifyContent: "flex-end",
  },
});

type ActionMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  style?: StyleProp<ViewStyle>;
};

const ActionMenu = ({ onEdit, onDelete, style }: ActionMenuProps) => (
  <View style={[styles.menu, style]}>
    <Space width={8} />
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

const RELATED_COMPANY_REGEX = /^company\.relatedCompanies\[(\d+)\]\.(.+)$/;
const RELATED_INDIVIDUAL_REGEX = /^company\.relatedIndividuals\[(\d+)\]\.(.+)$/;

export const OnboardingCompanyOwnership = ({
  onboarding,
  nextStep,
  serverValidationErrors,
}: Props) => {
  const onboardingId = onboarding.id;
  const { company, accountInfo, accountAdmin, statusInfo } = onboarding;
  const isFirstMount = useFirstMountState();

  const accountCountry = accountInfo?.country;

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

  const hasRelated = currentRelatedCompany.length > 0 || currentRelatedIndividual.length > 0;

  const missingInfos = useMemo(() => {
    const company = new Map<number, { fieldName: string; code: ServerInvalidFieldCode }[]>();
    const individual = new Map<number, { fieldName: string; code: ServerInvalidFieldCode }[]>();

    if (statusInfo.__typename === "OnboardingInvalidStatusInfo") {
      statusInfo.errors.forEach(({ field }) => {
        const companyMatch = RELATED_COMPANY_REGEX.exec(field);
        if (companyMatch?.[1] != null && companyMatch[2] != null) {
          const index = Number(companyMatch[1]);
          const fields = company.get(index) ?? [];
          fields.push({ fieldName: companyMatch[2], code: "Missing" });
          company.set(index, fields);
          return;
        }
        const individualMatch = RELATED_INDIVIDUAL_REGEX.exec(field);
        if (individualMatch?.[1] != null && individualMatch[2] != null) {
          const index = Number(individualMatch[1]);
          const fields = individual.get(index) ?? [];
          fields.push({ fieldName: individualMatch[2], code: "Missing" });
          individual.set(index, fields);
        }
      });
    }
    const isValid = company.size === 0 && individual.size === 0;
    return { company, individual, isValid };
  }, [statusInfo]);

  const isTotalPercentageValid = useMemo(() => {
    if (statusInfo.__typename === "OnboardingInvalidStatusInfo") {
      return !statusInfo.errors.some(
        ({ field }) =>
          field === "company.relatedIndividuals.ultimateBeneficialOwner.ownership.totalPercentage",
      );
    }
    return true;
  }, [statusInfo]);

  const [modalState, setModalState] = useState<ModalState>({ type: "hidden" });
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const ownershipFormRef = useRef<OnboardingCompanyOwnershipFormRef>(null);

  const actionText = useMemo(() => {
    return modalState.type === "edit" ? t("common.save") : t("common.add");
  }, [modalState.type]);

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
    const { [REFERENCE_SYMBOL]: _, ...input } = newCompany;
    updateRelatedCompanies([...currentRelatedCompany, input]);
  };

  const editRelatedCompany = (company: SaveValueCompany) => {
    const { [REFERENCE_SYMBOL]: ref, ...input } = company;
    const updatedRelatedCompany: RelatedCompanyInput[] = currentRelatedCompany.map(item =>
      item[REFERENCE_SYMBOL] === ref ? input : item,
    );
    updateRelatedCompanies(updatedRelatedCompany);
  };

  const deleteRelatedCompany = () => {
    // Should be always true because we only open the modal when the pageState is deleting
    if (modalState.type !== "delete") {
      return resetPageState();
    }

    const updatedRelatedCompany = currentRelatedCompany.filter(
      item => item[REFERENCE_SYMBOL] !== modalState.reference,
    );
    updateRelatedCompanies(updatedRelatedCompany);
  };

  const addRelatedIndividual = (newIndividual: SaveValueIndividual) => {
    const { [REFERENCE_SYMBOL]: _, ...input } = newIndividual;
    const updatedRelatedIndividual = transformRelatedIndividualsToInput(currentRelatedIndividual);
    updatedRelatedIndividual.push(input);
    updateRelatedIndividuals(updatedRelatedIndividual);
  };

  const editRelatedIndividual = (individual: SaveValueIndividual) => {
    const { [REFERENCE_SYMBOL]: ref, ...input } = individual;
    const updatedRelatedIndividual = currentRelatedIndividual
      .map(item =>
        item[REFERENCE_SYMBOL] === ref
          ? cleanData(input)
          : transformRelatedIndividualsToInput([item])[0],
      )
      .filter((item): item is RelatedIndividualInput => item != null);
    updateRelatedIndividuals(updatedRelatedIndividual);
  };

  const deleteRelatedIndividual = () => {
    if (modalState.type !== "delete") {
      return resetPageState();
    }

    const filteredRelatedIndividual = currentRelatedIndividual.filter(
      item => item[REFERENCE_SYMBOL] !== modalState.reference,
    );
    const updatedRelatedIndividual = transformRelatedIndividualsToInput(filteredRelatedIndividual);
    updateRelatedIndividuals(updatedRelatedIndividual);
  };

  const sendUpdate = (
    company:
      | { relatedCompanies: RelatedCompanyInput[] }
      | { relatedIndividuals: RelatedIndividualInput[] },
  ) => {
    updateCompanyOnboarding({ input: { onboardingId, company }, language: locale.language })
      .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => resetPageState())
      .tapError(error => {
        showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
      });
  };

  const updateRelatedCompanies = (items: RelatedCompanyInput[]) => {
    sendUpdate({ relatedCompanies: cleanData(items) });
  };

  const updateRelatedIndividuals = (items: RelatedIndividualInput[]) => {
    sendUpdate({ relatedIndividuals: items });
  };

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const checkValidationError = useCallback((): string | undefined => {
    const errors = extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .with("company.relatedIndividuals.ultimateBeneficialOwner", () =>
          t("company.step.ownership.error.uboEmpty"),
        )
        .with("company.relatedIndividuals.legalRepresentative", () =>
          t("company.step.ownership.error.individual.legalRepEmpty"),
        )
        .with("company.relatedIndividuals", () => t("company.step.ownership.error.empty"))
        .otherwise(() => null),
    );
    return errors[0]?.fieldName;
  }, [onboarding.statusInfo]);

  useEffect(() => {
    if (validationError != null) {
      setValidationError(checkValidationError());
    }
  }, [validationError, checkValidationError]);

  useEffect(() => {
    if (isFirstMount && serverValidationErrors.length > 0) {
      setValidationError(checkValidationError());
    }
  }, [serverValidationErrors, isFirstMount, checkValidationError]);

  const onPressNext = () => {
    setIsSubmitted(true);
    const errorMessage = checkValidationError();
    setValidationError(errorMessage);

    if (isNullish(errorMessage) && isTotalPercentageValid && missingInfos.isValid) {
      Router.push(nextStep, { onboardingId });
    }
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ small }) => (
          <>
            <Tile>
              <StepTitle>{t("company.step.ownership.title")}</StepTitle>
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
                style={[
                  styles.addOwnerButton,
                  validationError != null && styles.addOwnerButtonError,
                ]}
                onPress={() => setModalState({ type: "add", step: "init" })}
              >
                <Icon name="add-circle-regular" size={24} color={colors.gray[500]} />
                <LakeText>{t("company.step.ownership.addTitle")}</LakeText>
              </Pressable>

              {validationError != null && (
                <>
                  <Space height={4} />
                  <LakeText color={colors.negative[500]}>{validationError}</LakeText>
                </>
              )}

              {hasRelated && (
                <>
                  <Space height={32} />

                  {!small && (
                    <>
                      <Box direction="row">
                        <LakeText style={{ flexGrow: 2, ...styles.textTitle }}>
                          {t("company.step.owners.thead.name")}
                        </LakeText>
                        <LakeText style={styles.textTitle}>
                          {t("company.step.owners.thead.role")}
                        </LakeText>
                        <View style={{ width: 100 }} />
                      </Box>
                      <Space height={24} />
                    </>
                  )}

                  {isSubmitted && !isTotalPercentageValid && (
                    <>
                      <LakeAlert
                        variant="error"
                        title={t("company.step.ownership.error.totalPercentage")}
                      />
                      <Space height={32} />
                    </>
                  )}

                  {isSubmitted && !missingInfos.isValid && (
                    <>
                      <LakeAlert
                        variant="error"
                        title={t("company.step.ownership.error.missingInformation")}
                      />
                      <Space height={32} />
                    </>
                  )}

                  {currentRelatedCompany.map((company, index) => (
                    <View key={company[REFERENCE_SYMBOL]}>
                      {index > 0 && (
                        <>
                          <Separator space={16} />
                          <Space height={8} />
                        </>
                      )}

                      <Box
                        direction={small ? "column" : "row"}
                        alignItems={small ? "start" : "center"}
                      >
                        <Box grow={2}>
                          <LakeText style={[styles.textTitle, styles.ownerName]}>
                            {company.entityName}
                            {missingInfos.company.has(index) && (
                              <Tag color="negative" style={styles.tagError}>
                                {t("company.step.owners.missingInfo")}
                              </Tag>
                            )}
                          </LakeText>
                          <LakeText style={texts.smallRegular}>{company.roles.join(", ")}</LakeText>
                        </Box>

                        <LakeText style={styles.textSubTitle}>
                          {t("company.step.ownership.role.CompanyLegalRepresentative")}
                        </LakeText>
                        <ActionMenu
                          onEdit={() =>
                            setModalState({
                              type: "edit",
                              step: "company",
                              initialValue: company,
                              errors: missingInfos.company.get(index) ?? [],
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
                          style={small && styles.menuDesktop}
                        />
                      </Box>
                    </View>
                  ))}

                  {currentRelatedIndividual.map((individual, index) => (
                    <View key={individual[REFERENCE_SYMBOL]}>
                      {(index > 0 || currentRelatedCompany.length > 0) && (
                        <>
                          <Separator space={16} />
                          <Space height={8} />
                        </>
                      )}

                      <Box
                        direction={small ? "column" : "row"}
                        alignItems={small ? "start" : "center"}
                      >
                        <Box grow={2}>
                          <LakeText style={[styles.textTitle, styles.ownerName]}>
                            {individual.firstName} {individual.lastName}
                            {accountAdmin &&
                              namesMatch(individual, accountAdmin) &&
                              ` (${t("company.step.ownership.you")})`}
                            {missingInfos.individual.has(index) && (
                              <Tag color="negative" style={styles.tagError}>
                                {t("company.step.owners.missingInfo")}
                              </Tag>
                            )}
                          </LakeText>
                          <LakeText style={texts.smallRegular}>
                            {match(individual)
                              .with(
                                { __typename: "CompanyLegalRepresentative" },
                                ({ legalRepresentative }) => legalRepresentative.roles.join(", "),
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

                        {small && <Space height={16} />}

                        <LakeText style={styles.textSubTitle} align={small ? "left" : "right"}>
                          {ownershipTypeText(individual.type)}
                        </LakeText>
                        <ActionMenu
                          onEdit={() =>
                            setModalState({
                              type: "edit",
                              step: "init",
                              initialValue: individual,
                              errors: missingInfos.individual.get(index) ?? [],
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
                          style={small && styles.menuDesktop}
                        />
                      </Box>
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
        icon={match(modalState)
          .returnType<IconName>()
          .with({ type: "edit" }, () => "edit-regular")
          .otherwise(() => "add-circle-regular")}
        title={match(modalState)
          .with({ step: "init" }, () => t("company.step.ownership.modal.initTitle"))
          .with({ step: "ubo" }, ({ type }) => t("company.step.ownership.modal.uboTitle", { type }))
          .with({ step: P.union("legal", "company") }, ({ type }) =>
            t("company.step.ownership.modal.legalTitle", { type }),
          )
          .with({ step: "legalAndUbo" }, ({ type }) =>
            t("company.step.ownership.modal.legalAndUboTitle", { type }),
          )
          .otherwise(() => undefined)}
        maxWidth={704}
      >
        <Space height={12} />

        <OwnershipFormWizard
          ref={ownershipFormRef}
          subForm={match(modalState)
            .with({ form: P.string }, ({ form }) => form)
            .otherwise(() => undefined)}
          type={match(modalState)
            .with({ type: "add" }, { type: "edit" }, ({ type }) => type)
            .otherwise(() => "add" as const)}
          step={match(modalState)
            .with({ step: P.string }, ({ step }) => step)
            .otherwise(() => "init")}
          onboarding={onboarding}
          onStepChange={setFormStep}
          onClose={() => setModalState({ type: "hidden" })}
          onSave={match(modalState)
            .with(
              { type: "add", step: "company" },
              () => addRelatedCompany as (editorState: SaveValue) => void,
            )
            .with(
              { type: "edit", step: "company" },
              () => editRelatedCompany as (editorState: SaveValue) => void,
            )
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
          errors={match(modalState)
            .with({ type: "edit" }, ({ errors }) => errors)
            .otherwise(() => [])}
        />

        <Space height={24} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            onPress={() => ownershipFormRef.current?.cancel()}
            mode="secondary"
            grow={true}
            style={styles.action}
          >
            {match(modalState)
              .with({ step: P.union("init") }, () => t("common.cancel"))
              .with({ step: "company", type: "edit" }, () => t("common.cancel"))
              .with(
                { step: P.union("legal", "ubo", "legalAndUbo"), form: "detail", type: "edit" },
                () => t("common.cancel"),
              )
              .otherwise(() => t("common.back"))}
          </LakeButton>

          <LakeButton
            onPress={() => ownershipFormRef.current?.submit()}
            color="partner"
            grow={true}
            style={styles.action}
            loading={updateResult.isLoading()}
          >
            {match(modalState)
              .with({ step: "company" }, () => actionText)
              .with({ step: "legal", form: "address" }, () => actionText)
              .with({ form: "identity" }, () => actionText)
              .with({ step: P.union("ubo", "legalAndUbo"), form: "capital" }, () =>
                accountCountry === "ITA" ? t("common.next") : actionText,
              )
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
