import { Connection as ConnectionType, useForwardPagination } from "@swan-io/graphql-client";

export const Connection = <A extends ConnectionType<unknown>>({
  connection,
  children,
}: {
  connection: A;
  children: (value: A) => React.ReactNode;
}) => {
  const paginated = useForwardPagination(connection);
  return children(paginated);
};
