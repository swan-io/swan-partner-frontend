import { Connection as ConnectionType, useForwardPagination } from "@swan-io/graphql-client";
import { ReactNode } from "react";

export const Connection = <A extends ConnectionType<unknown>>({
  connection,
  children,
}: {
  connection: A;
  children: (value: A) => ReactNode;
}) => {
  const paginated = useForwardPagination(connection);
  return children(paginated);
};
