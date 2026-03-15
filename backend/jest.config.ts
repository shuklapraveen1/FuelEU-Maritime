import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/core/$1',
    '@adapters/(.*)': '<rootDir>/src/adapters/$1',
    '@infrastructure/(.*)': '<rootDir>/src/infrastructure/$1',
    '@shared/(.*)': '<rootDir>/src/shared/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/infrastructure/db/seed.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

export default config;
