"use strict";

const ignoredExpressionTypes = ["JSXEmptyExpression", "Literal"];

const isHandledElement = element =>
  element.type === "JSXElement" ||
  (element.type === "JSXExpressionContainer" &&
    !ignoredExpressionTypes.includes(element.expression.type));

const isDifferentElementLine = (elementA, elementB) =>
  elementA.loc.start.line !== elementB.loc.start.line;

const isDifferentElementType = (elementA, elementB) => elementA.type !== elementB.type;
const isMultiLineElement = element => element.loc.start.line !== element.loc.end.line;

// Fork of https://github.com/yannickcr/eslint-plugin-react/tree/master/docs/rules/jsx-newline
module.exports = {
  meta: {
    fixable: "code",
    hasSuggestions: true,
    docs: {
      description: "Require or prevent a new line after jsx elements and expressions.",
      category: "Stylistic Issues",
      recommended: true,
    },
    messages: {
      require: "JSX element should start in a new line",
      prevent: "JSX element should not start in a new line",
    },
  },
  create(context) {
    const jsxElementParents = new Set();
    const sourceCode = context.getSourceCode();

    return {
      "Program:exit"() {
        jsxElementParents.forEach(parent => {
          parent.children.forEach((element, index, elements) => {
            if (!isHandledElement(element)) {
              return;
            }

            const firstAdjacentSibling = elements[index + 1];
            const secondAdjacentSibling = elements[index + 2];

            const hasSibling =
              firstAdjacentSibling &&
              secondAdjacentSibling &&
              (firstAdjacentSibling.type === "Literal" || firstAdjacentSibling.type === "JSXText");

            if (!hasSibling || !isHandledElement(secondAdjacentSibling)) {
              return;
            }

            // Check adjacent sibling has the proper amount of newlines
            const hasNewLine = /\n\s*\n/.test(firstAdjacentSibling.value);

            const required =
              (isDifferentElementType(element, secondAdjacentSibling) &&
                isDifferentElementLine(element, secondAdjacentSibling)) ||
              isMultiLineElement(element) ||
              isMultiLineElement(secondAdjacentSibling);

            if (hasNewLine === required) {
              return;
            }

            const messageId = required ? "require" : "prevent";
            const regex = required ? /(\n)(?!.*\1)/g : /(\n\n)(?!.*\1)/g;
            const replacement = required ? "\n\n" : "\n";

            context.report({
              node: secondAdjacentSibling,
              messageId,
              fix(fixer) {
                return fixer.replaceText(
                  firstAdjacentSibling,
                  // double or remove the last newline
                  sourceCode.getText(firstAdjacentSibling).replace(regex, replacement),
                );
              },
            });
          });
        });
      },
      ":matches(JSXElement, JSXFragment) > :matches(JSXElement, JSXExpressionContainer)": node => {
        jsxElementParents.add(node.parent);
      },
    };
  },
};
