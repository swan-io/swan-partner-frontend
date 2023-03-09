import { useEffect } from "react";

type Props = {
  to: string;
};

export const Redirect = ({ to }: Props) => {
  useEffect(() => {
    window.location.assign(to);
    // we want to trigger this effect only on mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};
