import "@urql/core";

declare module "@urql/core" {
  export interface CombinedError {
    requestId?: string;
  }
}
