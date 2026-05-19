import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        ignores: ["dist", ".next", "node_modules"],
    },
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            parser: tsParser,
            globals: {
                ...globals.browser,
                ...globals.node,
                process: "readonly",
            },
            parserOptions: {
                ecmaVersion: "latest",
                ecmaFeatures: { jsx: true },
                sourceType: "module",
            },
        },
        plugins: {
            "@next/next": nextPlugin,
            react,
            "react-hooks": reactHooks,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
];
