import baseConfig from '../eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['src/db/seed/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@hono/zod-validator',
              importNames: ['zValidator'],
              message:
                'Importing zValidator is not allowed. Please use our custom zodValidator instead.',
            },
            {
              name: 'exports',
              message:
                'Do not import from "exports". The exports file is for non-server use only. Import directly from the source file instead.',
            },
          ],
        },
      ],
    },
  },
];
