import { useEffect } from "react";

type Props = {
  to: string;
};

export const Redirect = ({ to }: Props) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies(to):
  useEffect(() => {
    window.location.assign(to);
    // we want to trigger this effect only on mount
  }, []);

  return null;
};
