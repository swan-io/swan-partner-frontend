import { createTestResultsDir, deleteTestResultsDir } from "./utils/functions";

export default async () => {
  await deleteTestResultsDir();
  await createTestResultsDir();
};
