import { useEffect, useRef } from "react";

export const useTitle = (title: string) => {
  const previousRef = useRef(document.title);
  document.title = title;

  useEffect(() => {
    const { current } = previousRef;

    return () => {
      document.title = current;
    };
  }, []);
};
