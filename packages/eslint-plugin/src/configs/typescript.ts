import { workspaceRoot } from '@nx/devkit';
import { packageExists } from '../utils/config-utils';

const isPrettierAvailable =
  packageExists('prettier') && packageExists('eslint-config-prettier');

/**
 * This configuration is intended to be applied to ALL .ts and .tsx files
 * within an Nx workspace.
 *
 * It should therefore NOT contain any rules or plugins which are specific
 * to one ecosystem, such as React, Angular, Node etc.
 */
export default {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: workspaceRoot,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    ...(isPrettierAvailable ? ['prettier'] : []),
  ],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
  },
};
