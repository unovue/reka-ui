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
      'markdown/heading-increment': 'off',
      'markdown/no-multiple-h1': 'off',
    },
  },
  {
    files: ['**/*.md', '**/*.md/**'],
    rules: {
      'no-console': 'off', // allow console.log in documentation examples
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
    // A family importing from the root barrel makes the module graph circular
    // (barrel → family → barrel). Import from the owning family or `@/shared`.
    files: ['packages/core/src/*/*.{ts,vue}'],
    ignores: ['**/*.test.ts', '**/*.test-d.ts', '**/*.story.vue', '**/story/**', '**/stories/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: '..', message: 'Import from the owning family (`@/<Family>`) or `@/shared`, not the root barrel.' },
          { name: '@/index', message: 'Import from the owning family (`@/<Family>`) or `@/shared`, not the root barrel.' },
        ],
      }],
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
