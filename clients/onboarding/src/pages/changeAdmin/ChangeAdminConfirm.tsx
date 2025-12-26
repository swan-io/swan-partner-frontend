import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import { CountryCCA3, getCCA2forCCA3 } from "@swan-io/shared-business/src/constants/countries";
import dayjs from "dayjs";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type Props = {
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  onSubmitted: () => void;
};

export const ChangeAdminConfirm = ({ changeAdminRequestId, previousStep, onSubmitted }: Props) => {
  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onSubmit = () => {
    // TODO submit to backend
    onSubmitted();
  };

  // TODO fetch from backend
  const requester = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@swan.io",
    phoneNumber: "+33123456789",
  };
  const admin = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@swan.io",
    phoneNumber: "+33123456789",
    birthDate: "1990-01-01",
    birthCountry: "FRA" as CountryCCA3,
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
        loading={false}
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

      <Box direction="row" alignItems="center">
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
            <Flag code={getCCA2forCCA3(birthCountry)} width={16} />
            <Space width={12} />
            <LakeText variant="smallRegular" color={colors.gray[600]}>
              {birthCountry}
            </LakeText>
          </>
        )}
      </Box>
    </Tile>
  );
};
