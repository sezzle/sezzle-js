module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    "camelcase": "off",
    "no-array-constructor": "off",
    "no-empty-function": "off",
    "no-unused-vars": "off",
    "no-use-before-define": "off",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "no-shadow": "off",
    "no-plusplus": "off",
    "consistent-return": "off",
    "array-callback-return": "off",
    "no-console": "off",
    "no-param-reassing": "off",
    "no-tabs": 0,
    "indent": ["error", 2],
    "max-len": ["error", { "code": 200 }],
    "no-cycle": "off",
    "no-param-reassign": "off",
    "func-names": ["error", "never"],
    "no-cycle": "off",
    "no-underscore-dangle": "off",
    "no-useless-escape": "off"
  },
};