import chalk from "chalk";
import { readFile } from "fs/promises";
import { glob } from "glob";
import { InlineFragmentNode, parse, SelectionNode } from "graphql";
import path from "path";

const parseSelection = (
  operationName: string,
  selection: SelectionNode,
  errorMessages: string[],
) => {
  if (selection.kind === "FragmentSpread") {
    return;
  }

  const hasTypename =
    selection.selectionSet?.selections.find(
      selection => selection.kind === "Field" && selection.name.value === "__typename",
    ) != null;

  const firstInlineFragment = selection.selectionSet?.selections.find(
    (selection): selection is InlineFragmentNode => selection.kind === "InlineFragment",
  );

  if (!hasTypename && firstInlineFragment != null) {
    errorMessages.push(
      `${chalk.bold(operationName)}: Missing __typename above ${chalk.yellow(
        "... on",
      )} ${chalk.cyan(firstInlineFragment.typeCondition?.name.value ?? "")}`,
    );
  }

  selection.selectionSet?.selections.forEach(selection => {
    if (selection.kind === "InlineFragment") {
      const hasTypename =
        selection.selectionSet?.selections.find(
          selection => selection.kind === "Field" && selection.name.value === "__typename",
        ) != null;

      if (hasTypename) {
        errorMessages.push(
          `${chalk.bold(operationName)}: Extra __typename in ${chalk.yellow("... on")} ${chalk.cyan(
            selection.typeCondition?.name.value ?? "",
          )}`,
        );
      }
    }
  });

  selection.selectionSet?.selections.forEach(selection =>
    parseSelection(operationName, selection, errorMessages),
  );
};

const lint = (filePath: string, content: string) => {
  const ast = parse(content);
  const errorMessages: string[] = [];

  ast.definitions.forEach(definition => {
    if (definition.kind === "FragmentDefinition" || definition.kind === "OperationDefinition") {
      definition.selectionSet.selections.forEach(selection =>
        parseSelection(definition.name?.value ?? "", selection, errorMessages),
      );
    }

    if (definition.kind === "FragmentDefinition") {
      const hasTypename =
        definition.selectionSet?.selections.find(
          selection => selection.kind === "Field" && selection.name.value === "__typename",
        ) != null;

      if (!hasTypename) {
        errorMessages.push(
          `Missing __typename in ${chalk.yellow("fragment")} ${chalk.cyan(definition.name.value)}`,
        );
      }
    }
  });

  if (errorMessages.length > 0) {
    console.log();
    console.log(chalk.dim(filePath + ":"));
    console.log(errorMessages.join("\n"));
    console.log();
    process.exit(1);
  }
};

const filesPaths = glob
  .sync(path.join(process.cwd(), "**", "*.{gql,graphql}"))
  .filter(file => file.startsWith(path.join(process.cwd(), "packages")));

void Promise.all(
  filesPaths.map(async filePath => {
    const content = await readFile(filePath, "utf-8");
    lint(filePath, content);
  }),
);
