import antfu from '@antfu/eslint-config'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

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
    files: ['packages/core/src/**/*.vue'],
    plugins: {
      'vuejs-accessibility': pluginVueA11y,
    },
    // Adopt the recommended preset at `warn` while existing violations are
    // fixed incrementally; flip to `error` once the codebase is clean.
    rules: Object.fromEntries(
      Object.keys(pluginVueA11y.configs['flat/recommended'][1].rules)
        .map(rule => [rule, 'warn']),
    ),
  },
  {
    files: ['packages/core/src/**/*.{ts,vue}'],
    ignores: ['**/*.test.ts'],
    rules: {
      // Dev-only warnings are guarded with `process.env.NODE_ENV !== 'production'`: it survives the
      // published build and the consumer's bundler drops it. The build has no `import.meta.env`.
      'node/prefer-global/process': 'off',
      // The two strings are the preset's own entries, which setting this rule would otherwise drop.
      'no-restricted-syntax': ['error', 'TSEnumDeclaration[const=true]', 'TSExportAssignment', {
        selector: 'MemberExpression[property.name=\'DEV\'][object.property.name=\'env\'][object.object.type=\'MetaProperty\']',
        message: 'Use `process.env.NODE_ENV !== \'production\'`: `import.meta.env.DEV` does not exist in the published build, so the code behind it never runs.',
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
