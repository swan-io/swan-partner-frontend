import { resetEmailAddresses } from "./utils/webhook";

export default async () => {
  await resetEmailAddresses();
};
