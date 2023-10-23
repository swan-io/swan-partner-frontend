import { Option, Result } from "@swan-io/boxed";

export const projectConfiguration = Result.fromExecution(() => {
  if (typeof __env.SWAN_PROJECT_ID == "string") {
    return __env.SWAN_PROJECT_ID;
  } else {
    throw new Error();
  }
})
  .map(projectId => ({ mode: "SingleProject", projectId }) as const)
  .flatMapError(() => {
    const [, projects, projectId] = location.pathname.split("/");

    return projects === "projects" && typeof projectId === "string"
      ? Result.Ok({ mode: "MultiProject", projectId } as const)
      : Result.Error(new Error("No project specified"));
  })
  .toOption()
  .flatMap(nullable => Option.fromNullable(nullable));
