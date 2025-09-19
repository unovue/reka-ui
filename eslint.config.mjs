import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: {
      overrides: {
        'vue/max-attributes-per-line': ['error', {
          singleline: 1,
          multiline: 1,
        }],
      },
    },
    typescript: true,
    markdown: {
      overrides: {
        'vue/max-attributes-per-line': 'off', // in documentation we allow more attributes per line
      },
    },
  },
  {
    ignores: ['*.js'],
  },
  {
    rules: {
      'ts/no-non-null-asserted-optional-chain': 'off',
      'ts/ban-ts-comment': 'warn',
      'ts/consistent-type-definitions': 'off',
      'ts/no-unsafe-function-type': 'off',
      'ts/no-unused-expressions': 'off',
      'ts/no-empty-object-type': 'off',
      'symbol-description': 'off',
      'no-console': 'warn',
      'import/first': 'off',
      'import/order': 'off',
      'style/max-statements-per-line': ['error', { max: 2 }],
      'vue/one-component-per-file': 'off',
      'unicorn/prefer-dom-node-text-content': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unused-imports/no-unused-vars': 'off',
      'regexp/no-super-linear-backtracking': 'off',
    },
  },
  {
    files: ['*.story.vue'],
    rules: {
      'no-console': 'off',
      'no-alert': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/package.json'],
    rules: {
      // Wrecks the order of `files` otherwise, and breaks the exclusion patterns
      // pnpm has no issues with that, but npm does and doesn't apply the correct config
      'jsonc/sort-array-values': 'off',
    },
  },
)
