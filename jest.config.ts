import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // Ajoutez cette ligne si vous utilisez des alias d'import
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};

export default createJestConfig(config);