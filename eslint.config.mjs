import antfu from '@antfu/eslint-config'
import addUndefToOptional from './eslint-rules/add-undef-to-optional.mjs'

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
    // Shipped library source only. The rule exists so that consumers compiling
    // with `exactOptionalPropertyTypes` can pass an explicit `undefined` into
    // any optional property we export; tests and stories are not part of that
    // contract.
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.vue'],
    ignores: [
      '**/*.test.ts',
      '**/*.test-d.ts',
      '**/*.test-d.vue',
      '**/*.story.vue',
      '**/story/**',
      '**/stories/**',
    ],
    plugins: {
      reka: {
        rules: {
          'add-undef-to-optional': addUndefToOptional,
        },
      },
    },
    rules: {
      'reka/add-undef-to-optional': 'error',
    },
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
      'markdown/heading-increment': 'off',
      'markdown/no-multiple-h1': 'off',
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
