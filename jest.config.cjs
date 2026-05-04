/* eslint-disable @typescript-eslint/no-require-imports */

const swcJestOptions = {
  jsc: {
    parser: {
      syntax: 'typescript',
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      legacyDecorator: true,
      decoratorMetadata: true,
    },
    target: 'es2020',
    keepClassNames: true,
  },
  module: {
    type: 'commonjs',
  },
  sourceMaps: 'inline',
};

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', swcJestOptions],
  },
  clearMocks: true,
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
