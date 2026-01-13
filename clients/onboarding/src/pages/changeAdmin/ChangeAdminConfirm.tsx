import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import {
  CountryCCA3,
  getCCA2forCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import dayjs from "dayjs";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountAdminChangeInfoFragment,
  FinalizeAccountAdminChangeDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type RequesterFilled = {
  __typename: "AccountAdminChangeRequester";
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type AdminFilled = {
  __typename: "AccountAdminChangeAdmin";
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  birthCountry: CountryCCA3;
};

export const isRequesterFilled = (
  requester: AccountAdminChangeInfoFragment["requester"],
): requester is RequesterFilled => {
  return (
    requester != null &&
    typeof requester.firstName === "string" &&
    typeof requester.lastName === "string" &&
    typeof requester.email === "string" &&
    typeof requester.phoneNumber === "string"
  );
};

export const isAdminFilled = (
  admin: AccountAdminChangeInfoFragment["admin"],
): admin is AdminFilled => {
  return (
    admin != null &&
    typeof admin.firstName === "string" &&
    typeof admin.lastName === "string" &&
    typeof admin.email === "string" &&
    typeof admin.phoneNumber === "string" &&
    typeof admin.birthDate === "string" &&
    isCountryCCA3(admin.birthCountry)
  );
};

type Props = {
  requester: RequesterFilled;
  admin: AdminFilled;
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  onSubmitted: () => void;
};

export const ChangeAdminConfirm = ({
  requester,
  admin,
  changeAdminRequestId,
  previousStep,
  onSubmitted,
}: Props) => {
  const [finalizeChangeAdmin, finalization] = useMutation(FinalizeAccountAdminChangeDocument);

  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onSubmit = () => {
    finalizeChangeAdmin({
      accountAdminChangeId: changeAdminRequestId,
    })
      .mapOk(data => data.finalizeAccountAdminChange)
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => showToast({ variant: "error", title: translateError(error), error }))
      .tapOk(() => {
        onSubmitted();
      });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.confirm.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.confirm.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <UserInfoTile
              small={small}
              title={t("changeAdmin.step.confirm.yourInfo")}
              firstName={requester.firstName}
              lastName={requester.lastName}
              email={requester.email}
              phoneNumber={requester.phoneNumber}
            />

            <Space height={small ? 24 : 32} />

            <UserInfoTile
              small={small}
              title={t("changeAdmin.step.confirm.newAdminInfo")}
              firstName={admin.firstName}
              lastName={admin.lastName}
              email={admin.email}
              phoneNumber={admin.phoneNumber}
              birthDate={admin.birthDate}
              birthCountry={admin.birthCountry}
            />
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter
        nextLabel="changeAdmin.step.confirm.submit"
        onPrevious={onPressPrevious}
        onNext={onSubmit}
        loading={finalization.isLoading()}
      />
    </OnboardingStepContent>
  );
};

type UserInfoTileProps = {
  small: boolean;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate?: string;
  birthCountry?: CountryCCA3;
};

const UserInfoTile = ({
  small,
  title,
  firstName,
  lastName,
  email,
  phoneNumber,
  birthDate,
  birthCountry,
}: UserInfoTileProps) => {
  return (
    <Tile>
      <LakeText variant="medium" color={colors.partner[500]}>
        {title}
      </LakeText>

      <Space height={small ? 24 : 32} />

      <LakeHeading level={3} variant="h3">{`${firstName} ${lastName}`}</LakeHeading>
      <Space height={8} />

      <Box direction="row" alignItems="center" wrap="wrap">
        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {email}
        </LakeText>
        <Separator space={12} horizontal={true} />
        <LakeText variant="smallRegular" color={colors.gray[600]}>
          {phoneNumber}
        </LakeText>

        {birthDate && (
          <>
            <Separator space={12} horizontal={true} />
            <LakeText variant="smallRegular" color={colors.gray[600]}>
              {dayjs(birthDate).format("LL")}
            </LakeText>
          </>
        )}

        {birthCountry && (
          <>
            <Separator space={12} horizontal={true} />
            <Box direction="row" alignItems="center">
              <Flag code={getCCA2forCCA3(birthCountry)} width={16} />
              <Space width={12} />
              <LakeText variant="smallRegular" color={colors.gray[600]}>
                {birthCountry}
              </LakeText>
            </Box>
          </>
        )}
      </Box>
    </Tile>
  );
};
