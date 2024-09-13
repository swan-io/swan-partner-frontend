import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ColorVariants } from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { ComponentProps, ReactNode } from "react";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";

type FoldableAlertProps = {
  variant: ComponentProps<typeof LakeAlert>["variant"];
  title: string;
  more: ReactNode;
  openedAtStart?: boolean;
};

export const FoldableAlert = ({
  variant,
  title,
  more,
  openedAtStart = false,
}: FoldableAlertProps) => {
  const [visible, { toggle }] = useDisclosure(openedAtStart);

  return (
    <LakeAlert
      anchored={true}
      variant={variant}
      title={title}
      callToAction={
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
      }
    >
      {visible ? more : null}
    </LakeAlert>
  );
};
