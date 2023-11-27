import { atom, useAtom } from "react-atomic-state";

const mandateUrl = atom<string | undefined>(undefined);

export const setMandateUrl = mandateUrl.set;
export const useMandateUrl = () => useAtom(mandateUrl);
