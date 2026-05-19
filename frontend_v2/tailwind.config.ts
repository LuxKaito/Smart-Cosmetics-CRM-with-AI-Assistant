import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/app/**/*.{ts,tsx}",
        "./src/components/**/*.{ts,tsx}",
        "./src/features/**/*.{ts,tsx}",
        "./src/hooks/**/*.{ts,tsx}",
        "./src/lib/**/*.{ts,tsx}",
        "./src/providers/**/*.{ts,tsx}",
        "./src/services/**/*.{ts,tsx}",
        "./src/stores/**/*.{ts,tsx}",
        "./src/types/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {
                background: "var(--bg)",
                foreground: "var(--ink)",
                primary: "var(--primary)",
                muted: "var(--muted)",
                surface: "var(--surface)",
                line: "var(--line)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
