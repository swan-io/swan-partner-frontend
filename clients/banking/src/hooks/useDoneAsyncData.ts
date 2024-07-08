import { AsyncData } from "@swan-io/boxed";
import { useRef } from "react";

export const useDoneAsyncData = <T>(data: AsyncData<T>) => {
  const ref = useRef(data);

  if (data.isDone()) {
    ref.current = data;
  }

  return ref.current;
};
