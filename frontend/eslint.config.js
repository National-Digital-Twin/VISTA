import { createRequire } from 'node:module';

import js from '@eslint/js';
import globals from 'globals';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import pluginJest from 'eslint-plugin-jest';
import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';

const require = createRequire(import.meta.url);
const configPrettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

function legacyPlugin(name, alias = name) {
    const plugin = compat.plugins(name)[0]?.plugins?.[alias];

    if (!plugin) {
        throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
    }

    return fixupPluginRules(plugin);
}

const GLOBALS_FIXED = {
    ...globals.browser,
    ...globals.jest,
    ...globals.node,
};
delete GLOBALS_FIXED['AudioWorkletGlobalScope '];
GLOBALS_FIXED.JSX = false;

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
    // Base ESLint recommended rules for JavaScript
    js.configs.recommended,

    // TypeScript, React, accessibility, Jest, and import
    {
        files: ['src/**/*.{js,jsx,ts,tsx}', '**/*.spec.js', '**/*.test.js'],
        languageOptions: {
            parser: typescriptParser,
            globals: GLOBALS_FIXED,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                jsxPragma: null,
            },
        },
        plugins: {
            'typescript': typescriptPlugin,
            'react': reactPlugin,
            'react-hooks': hooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
            'jest': pluginJest,
            'import': legacyPlugin('eslint-plugin-import', 'import'),
        },
        settings: {
            react: {
                version: '19.0',
            },
        },
        rules: {
            // TypeScript
            'typescript/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-unused-vars': 'off',

            // React
            'react/jsx-no-useless-fragment': 'error',
            'react/self-closing-comp': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',

            // Import ordering
            'import/order': [
                'error',
                {
                    'alphabetize': { caseInsensitive: true, order: 'asc' },
                    'groups': ['external', 'parent', ['sibling', 'index']],
                    'newlines-between': 'never',
                },
            ],

            // Jest
            'jest/no-focused-tests': 'error',
        },
    },

    // Ignore coverage output
    {
        ignores: ['coverage/**', 'dist/**', 'qa/**', 'vite.config.js', 'src/vendor/**'],
    },

    // Turn off conflicting style rules and enforce Prettier formatting
    { rules: configPrettier.rules },
    {
        files: ['src/**/*.{js,jsx,ts,tsx}', '**/*.spec.js', '**/*.test.js'],
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },
];
