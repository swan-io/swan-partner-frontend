declare type WizardStep<T extends string> = {
  id: T;
  label: string;
  errors: { fieldName: string; code: string }[];
};
