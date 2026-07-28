/**
 * Adapted from MUI's `add-undef-to-optional` rule.
 * @see https://github.com/mui/mui-public/blob/master/packages/code-infra/src/eslint/mui/rules/add-undef-to-optional.mjs
 *
 * Optional properties whose type does not include `undefined` are unusable by
 * consumers compiling with `exactOptionalPropertyTypes`, since they cannot pass
 * `undefined` explicitly (e.g. `:disabled="maybeUndefined"`).
 */

import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/unovue/reka-ui/blob/v2/eslint-rules/add-undef-to-optional.mjs',
)

const RULE_NAME = 'add-undef-to-optional'

/**
 * Type nodes that bind loosely enough that appending `| undefined` would change
 * their meaning, so the original type has to be wrapped in parentheses.
 */
const NEEDS_PARENS = new Set([
  AST_NODE_TYPES.TSFunctionType,
  AST_NODE_TYPES.TSConstructorType,
  AST_NODE_TYPES.TSConditionalType,
  AST_NODE_TYPES.TSInferType,
])

/**
 * Checks whether the given type node includes 'undefined' either directly,
 * via union, or via type references that eventually include 'undefined'.
 * Treats 'any' and 'unknown' as including 'undefined'.
 *
 * @param {import('@typescript-eslint/types').TSESTree.TSTypeAnnotation['typeAnnotation'] | undefined} typeNode
 * @param {Map<string, any>} typeDefinitions
 * @returns {boolean} Whether the type already accepts `undefined`.
 */
function acceptsUndefined(typeNode, typeDefinitions) {
  if (!typeNode) {
    return false
  }

  switch (typeNode.type) {
    case AST_NODE_TYPES.TSUnionType: {
      return typeNode.types.some(t => acceptsUndefined(t, typeDefinitions))
    }
    case AST_NODE_TYPES.TSUndefinedKeyword:
    case AST_NODE_TYPES.TSAnyKeyword:
    case AST_NODE_TYPES.TSUnknownKeyword:
      return true
    case AST_NODE_TYPES.TSTypeReference: {
      if (typeNode.typeName?.type === AST_NODE_TYPES.Identifier) {
        // Check if it's a reference to 'undefined' itself
        if (typeNode.typeName.name === 'undefined') {
          return true
        }
        // If we have a local definition, check it
        if (typeDefinitions.has(typeNode.typeName.name)) {
          return acceptsUndefined(typeDefinitions.get(typeNode.typeName.name), typeDefinitions)
        }
      }
      break
    }
    default:
      break
  }
  return false
}

export default createRule({
  meta: {
    docs: {
      description: 'Ensures that optional properties include undefined in their type.',
    },
    messages: {
      addUndefined:
        'Optional property "{{ propName }}" type does not explicitly include undefined. Add "| undefined".',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  name: RULE_NAME,
  defaultOptions: [],
  create(context) {
    const typeDefinitions = new Map()

    return {
      // Collect type alias definitions, ie, type Foo = ...
      TSTypeAliasDeclaration(node) {
        if (node.id && node.typeAnnotation) {
          typeDefinitions.set(node.id.name, node.typeAnnotation)
        }
      },
      // only checks optional properties in types/interfaces
      TSPropertySignature(node) {
        if (!node.optional || !node.typeAnnotation) {
          return
        }
        const typeNode = node.typeAnnotation.typeAnnotation
        if (!typeNode || acceptsUndefined(typeNode, typeDefinitions)) {
          return
        }
        const source = context.sourceCode
        context.report({
          node: node.key ?? node,
          messageId: 'addUndefined',
          data: {
            propName: source.getText(node.key),
          },
          fix(fixer) {
            const text = source.getText(typeNode)
            return fixer.replaceText(
              typeNode,
              NEEDS_PARENS.has(typeNode.type) ? `(${text}) | undefined` : `${text} | undefined`,
            )
          },
        })
      },
    }
  },
})
