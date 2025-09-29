import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import pluginJest from 'eslint-plugin-jest';

import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';

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
GLOBALS_FIXED['JSX'] = false;

/** @type {import("eslint").Linter.FlatConfig|import("eslint").Linter.FlatConfig[]} */
export default [
    {
        files: ['src/**/*.{js,jsx,ts,tsx}', "**/*.spec.js', '**/*.test.js"],
        plugins: {
            'react': reactPlugin,
            'react-hooks': hooksPlugin,
            'typescript': typescriptPlugin,
            'import': legacyPlugin('eslint-plugin-import', 'import'),
            'sonarjs': sonarjsPlugin,
            'jsx-a11y': jsxA11yPlugin,
            'jest': pluginJest,
        },
        settings: {
            react: {
                version: '19.0',
            },
        },
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
        rules: {
            'constructor-super': 'error',
            'for-direction': 'error',
            'getter-return': 'error',
            'no-async-promise-executor': 'error',
            'no-class-assign': 'error',
            'no-cond-assign': 'error',
            'no-compare-neg-zero': 'error',
            'no-const-assign': 'error',
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'warn',
            'no-dupe-args': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty-character-class': 'error',
            'no-empty-pattern': 'error',
            'no-fallthrough': 'error',
            'no-func-assign': 'error',
            'no-import-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-misleading-character-class': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-obj-calls': 'error',
            'no-promise-executor-return': 'error',
            'no-prototype-builtins': 'error',
            'no-self-assign': 'error',
            'no-self-compare': 'error',
            'no-setter-return': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-this-before-super': 'error',
            'no-undef': 'error',
            'no-unexpected-multiline': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unreachable': 'warn',
            'no-unreachable-loop': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-private-class-members': 'error',
            'no-useless-backreference': 'error',
            'require-atomic-updates': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            'block-scoped-var': 'warn',
            'curly': 'error',
            'default-case-last': 'error',
            'eqeqeq': 'error',
            // "no-alert": "warn",
            'no-caller': 'error',
            // "no-console": "warn",
            'no-empty': 'error',
            'no-empty-static-block': 'error',
            'no-eq-null': 'error',
            'no-extra-boolean-cast': 'error',
            'no-global-assign': 'error',
            'no-lonely-if': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-octal': 'error',
            'no-return-assign': 'error',
            'no-script-url': 'error',
            'no-unused-labels': 'error',
            'no-useless-catch': 'error',
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-var': 'error',
            'no-with': 'error',
            'prefer-const': 'error',
            'radix': 'error',
            'require-yield': 'error',
            /* TypeScript specific rules */
            'typescript/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'typescript/no-redeclare': 'error',
            'typescript/no-loss-of-precision': 'error',
            'typescript/no-invalid-this': 'error',
            'typescript/no-loop-func': 'error',
            'typescript/no-dupe-class-members': 'error',
            /* React */
            'react/jsx-key': 'error',
            'react/jsx-no-comment-textnodes': 'error',
            'react/jsx-no-duplicate-props': 'error',
            'react/jsx-no-script-url': 'error',
            'react/jsx-no-target-blank': 'error',
            'react/jsx-no-undef': 'error',
            'react/jsx-pascal-case': 'error',
            'react/no-children-prop': 'error',
            'react/no-danger': 'error',
            'react/no-danger-with-children': 'error',
            'react/no-deprecated': 'error',
            'react/no-direct-mutation-state': 'error',
            'react/no-find-dom-node': 'error',
            'react/no-is-mounted': 'error',
            'react/no-render-return-value': 'error',
            'react/no-this-in-sfc': 'error',
            'react/no-string-refs': 'error',
            'react/no-unknown-property': 'error',
            'react/no-unsafe': 'error',
            'react/prefer-es6-class': 'error',
            'react/require-render-return': 'error',
            /* React hooks */
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
            /* Import checks */
            'import/no-duplicates': 'error',
            /* "import/no-deprecated": "warn", */
            'import/no-empty-named-blocks': 'error',
            'import/no-extraneous-dependencies': 'error',
            'import/no-mutable-exports': 'error',
            'import/no-unused-modules': 'error',
            'import/no-commonjs': 'error',
            'import/no-amd': 'error',
            'import/no-absolute-path': 'error',
            'import/no-cycle': 'error',
            'import/no-relative-parent-imports': 'error',
            'import/no-self-import': 'error',
            'import/no-useless-path-segments': 'error',
            'import/first': 'error',
            'import/no-namespace': 'error',
            'import/order': 'error',
            /* SonarJS */
            // "sonarjs/no-duplicate-string": "warn",
            'sonarjs/cognitive-complexity': ['warn', 15],
            /* JSX Accessibility */
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/img-redundant-alt': 'warn',
            /* Jest */
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/prefer-to-have-length': 'warn',
            'jest/valid-expect': 'error',
        },
    },
    {
        ignores: ['coverage/**'],
    },
];
