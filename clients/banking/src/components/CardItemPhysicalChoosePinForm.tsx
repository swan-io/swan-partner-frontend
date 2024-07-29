import { Option } from "@swan-io/boxed";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { useForm } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle } from "react";
import { t } from "../utils/i18n";

export type CardItemPhysicalChoosePinFormRef = {
  submit: () => void;
};

export type EditorState = {
  choosePin: boolean;
};

type Props = {
  onSubmit: (editorState: EditorState) => void;
};

const items: RadioGroupItem<boolean>[] = [
  {
    value: true,
    name: t("card.physicalCard.choosePin.yes"),
  },
  {
    value: false,
    name: t("card.physicalCard.choosePin.no"),
  },
];

export const CardItemPhysicalChoosePinForm = forwardRef<CardItemPhysicalChoosePinFormRef, Props>(
  ({ onSubmit }, ref) => {
    const { Field, submitForm } = useForm({
      choosePin: {
        initialValue: true,
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        submitForm({
          onSuccess: values => {
            Option.allFromDict(values).tapSome(onSubmit);
          },
        });
      },
    }));

    return (
      <>
        <Field name="choosePin">
          {({ value, onChange }) => (
            <RadioGroup items={items} onValueChange={onChange} value={value} />
          )}
        </Field>
      </>
    );
  },
);
