"use strict";

module.exports = {
  meta: {
    docs: {
      description: "Disallow template literals in translation function.",
      recommended: false,
    },
    messages: {
      forbidden: "Template literals are forbidden in translation functions.",
    },
    schema: [],
    type: "problem",
  },
  create(context) {
    return {
      'CallExpression[callee.name="t"]'(node) {
        const firstArgument = node.arguments[0];
        if (firstArgument && firstArgument.type === "TemplateLiteral") {
          context.report({
            node,
            messageId: "forbidden",
          });
        }
      },
    };
  },
};
