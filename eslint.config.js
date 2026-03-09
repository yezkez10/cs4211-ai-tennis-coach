import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import pluginNoRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/dist/**/*', 'eslint.config.js', 'plopfile.mjs', 'plop/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...tseslint.configs.recommendedTypeChecked,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.ts', '.tsx'],
        },
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'no-relative-import-paths': pluginNoRelativeImportPaths,
      import: pluginImport,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/consistent-type-exports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'dot-notation': ['warn'],
      'import/consistent-type-specifier-style': ['warn', 'prefer-inline'],
      'import/no-duplicates': ['warn', { 'prefer-inline': true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-relative-import-paths/no-relative-import-paths': ['warn'],
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['*.ts*'],
              message:
                'Do not specify file extensions when importing TypeScript files.',
            },
            {
              group: ['*.js*'],
              message:
                'The use of JavaScript files is not allowed; use TypeScript files instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Do not access process.env directly. Use a ENV_VARS instead.',
        },
      ],
    },
  },
];
