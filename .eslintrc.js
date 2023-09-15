module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        ecmaVersion: 13,
        parser: '@typescript-eslint/parser',
        sourceType: 'module'
    },
    extends: [
        'plugin:vue/vue3-recommended'
        // 'eslint:recommended',
        // 'plugin:@typescript-eslint/recommended',
    ],
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        indent: [
            'warn',
            4,
            {
                SwitchCase: 1
            }
        ],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        '@type-eslint/ban-ts-ignore': 'off',
        '@type-eslint/explicit-function-return-type': 'off',
        '@type-eslint/no-explicit-any': 'off',
        '@type-eslint/no-var-requires': 'off',
        '@type-eslint/no-empty-function': 'off',
        '@type-eslint/no-use-before-define': 'off',
        '@type-eslint/ban-ts-comment': 'off',
        '@type-eslint/ban-types': 'off',
        '@type-eslint/no-non-null-assertion': 'off',
        '@type-eslint/explicit-module-boundary-types': 'off',
        'vue/valid-template-root': 'off',
        'vue/custom-event-name-casing': 'off',
        'vue/attributes-order': 'off',
        'vue/one-component-per-file': 'off',
        'vue/html-closing-bracket-newline': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/multiline-html-element-content-newline': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/attribute-hyphenation': 'off',
        'vue/html-self-closing': 'off',
        'vue/no-multiple-template-root': 'off',
        'vue/require-default-prop': 'off',
        'vue/no-v-model-argument': 'off',
        'vue/no-arrow-functions-in-watch': 'off',
        'vue/no-template-key': 'off',
        'vue/no-v-html': 'off',
        'vue/comment-directive': 'off',
        'vue/no-parsing-error': 'off',
        'vue/no-deprecated-v-on-native-modifier': 'off',
        'vue/html-indent': [
            'error',
            4,
            {
                attribute: 0,
                baseIndent: 1,
                alignAttributesVertically: true
            }
        ],
        'vue/html-closing-bracket-newline': 'off',
        'vue/script-indent': [
            'error',
            4,
            {
                baseIndent: 0,
                switchCase: 1
            }
        ],
        'vue/html-self-closing': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/max-attributes-per-line': 'off',
        'no-useless-escape': 'off',
        'no-sparse-arrays': 'off',
        'no-prototype-builtins': 'off',
        'no-constant-condition': 'off',
        'no-use-before-define': 'off',
        'no-restricted-globals': 'off',
        'no-restricted-syntax': 'off',
        'generator-star-spacing': 'off',
        'no-unreachable': 'off',
        'no-multiple-template-root': 'off',
        'no-unused-vars': 'off',
        'no-v-model-argument': 'off',
        'no-case-declarations': 'off',
        'no-console': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/no-unused-vars': 'off',
        'comma-dangle': ['error', 'never']
    },
    overrides: [
        {
            files: ['*.vue'],
            rules: {
                indent: 'off'
            }
        }
    ]
};
