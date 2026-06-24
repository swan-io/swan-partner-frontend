import { Result } from "@swan-io/boxed";
import { Ref, useImperativeHandle, useState } from "react";

export type WizardStepRef = {
  submit: () => void;
};

type Config<Value, Submitted, Error> = {
  ref: Ref<WizardStepRef> | undefined;
  initialValue: Value | (() => Value);
  validate: (value: Value) => Result<Submitted, Error[]>;
  onSubmit: (submitted: Submitted) => void;
  // Re-validate on every change ("always", default) or only once the step has already
  // shown errors ("whenInvalid"). Mirrors each step's pre-existing behavior.
  revalidateOnChange?: "always" | "whenInvalid";
};

/**
 * Wires a wizard step's local value to the imperative `ref.submit()` the wizard's Next
 * button calls: it owns the value + validation-error state, validates on submit (calling
 * `onSubmit` only when valid), and re-validates on change.
 */
export const useWizardStep = <Value, Submitted, Error>({
  ref,
  initialValue,
  validate,
  onSubmit,
  revalidateOnChange = "always",
}: Config<Value, Submitted, Error>) => {
  const [value, setValue] = useState<Value>(initialValue);
  const [errors, setErrors] = useState<Error[] | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        validate(value).match({
          Ok: submitted => {
            setErrors(null);
            onSubmit(submitted);
          },
          Error: setErrors,
        });
      },
    }),
    [value, validate, onSubmit],
  );

  const onChange = (next: Value) => {
    setValue(next);
    if (revalidateOnChange === "whenInvalid" && errors == null) {
      return;
    }
    validate(next).match({
      Ok: () => setErrors(null),
      Error: setErrors,
    });
  };

  return { value, errors, onChange };
};
