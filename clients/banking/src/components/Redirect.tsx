import { replaceUnsafe, useLocation } from "@zoontek/chicane";
import { useLayoutEffect } from "react";

export const Redirect = ({ to }: { to: string }) => {
  const location = useLocation().toString();

  useLayoutEffect(() => {
    if (to !== location) {
      replaceUnsafe(to);
    }
  }, [to, location]);

  return null;
};
