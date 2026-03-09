import baseConfig from '../eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['**/src/**/*.{ts,tsx}'],
    rules: {
      // Allow relative imports
      'no-relative-import-paths/no-relative-import-paths': 'off', // TODO: Find a way to have absolute path imports in common
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['schemas/*', 'utils/*', 'const/*'],
              message: 'Use relative imports for internal modules.',
            },
          ],
        },
      ],
    },
  },
];
