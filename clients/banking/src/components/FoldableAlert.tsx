import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColorVariants } from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ComponentProps } from "react";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";

type FoldableAlertProps = {
  title: string;
  description: string;
  variant: ComponentProps<typeof LakeAlert>["variant"];
};

export const FoldableAlert = ({ variant, title, description }: FoldableAlertProps) => {
  const [visible, { toggle }] = useDisclosure(false);

  return (
    <LakeAlert
      anchored={true}
      variant={variant}
      title={title}
      callToAction={
        isNotNullishOrEmpty(description) ? (
          <LakeButton
            onPress={toggle}
            mode="tertiary"
            size="small"
            color={match(variant)
              .returnType<ColorVariants>()
              .with("error", () => "negative")
              .with("info", () => "shakespear")
              .with("neutral", () => "gray")
              .with("success", () => "positive")
              .with("warning", () => "warning")
              .exhaustive()}
          >
            {visible ? t("common.showLess") : t("common.showMore")}
          </LakeButton>
        ) : null
      }
    >
      {visible ? <LakeText variant="smallRegular">{description}</LakeText> : null}
    </LakeAlert>
  );
};
