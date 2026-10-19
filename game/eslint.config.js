import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/.wrangler/**',
      'dist/**',
      'node_modules/**',
      'online/node_modules/**',
      'server/node_modules/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {ecmaVersion: 2023, sourceType: 'module'},
    rules: {
      'no-empty': ['error', {allowEmptyCatch: true}],
      'no-unused-vars': ['warn', {args: 'none', caughtErrors: 'none'}],
    },
  },
  {files: ['src/**/*.js'], languageOptions: {globals: globals.browser}},
  {
    files: [
      'core/**/*.js',
      'online/**/*.{js,mjs}',
      'test/**/*.js',
      'server/**/*.{js,mjs}',
      'scripts/**/*.mjs',
      '*.js',
    ],
    languageOptions: {
      globals: {...globals.node, ...globals.serviceworker, WebSocketPair: 'readonly'},
    },
  },
];
