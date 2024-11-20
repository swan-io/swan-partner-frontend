export type WizardFieldValidationError = { fieldName: string; code: string };

export type WizardStep = {
  id: string;
  url: string;
  label: string;
  errors: WizardFieldValidationError[];
};
