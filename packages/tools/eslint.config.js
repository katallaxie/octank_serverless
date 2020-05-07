module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  rules: {}
};
