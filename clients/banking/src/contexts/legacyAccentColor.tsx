import { defaultAccentColor } from "@swan-io/lake/src/constants/colors";
import { createContext, ReactNode, useContext } from "react";

const Context = createContext(defaultAccentColor);

export const LegacyAccentColorProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) => <Context.Provider value={value}>{children}</Context.Provider>;

export const useLegacyAccentColor = () => useContext(Context);
