// Плоская конфигурация ESLint 9+. Прежний .eslintrc.js больше не читается.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'writable',
};

module.exports = [
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**'],
  },

  // Исходники расширения.
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['src/**/*.ts'] })),
  {
    files: ['src/**/*.ts'],
    rules: {
      'semi': ['error', 'always'],

      // Ловит мёртвый код; подчёркивание в начале имени помечает намеренно
      // неиспользуемое.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Отключено исторически. Единственный явный any стоит на границе разбора
      // JSON в localize.ts, типы возвращаемых значений выводятся точно.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Тесты и сама конфигурация — обычный CommonJS для Node, правила TypeScript
  // к ним не применяются.
  {
    ...js.configs.recommended,
    files: ['test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      'semi': ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
