export const toRequiredDocumentPurposes = <Purpose extends string>(
  purposes: Array<{
    name: Purpose;
    label: string;
    description: string;
    purposeDetails?: string | null;
  }>,
): Record<Purpose, { label: string; description: string; purposeDetails?: string }> =>
  Object.fromEntries(
    purposes.map(({ name, label, description, purposeDetails }) => [
      name,
      { label, description, purposeDetails: purposeDetails ?? undefined },
    ]),
  ) as Record<Purpose, { label: string; description: string; purposeDetails?: string }>;
