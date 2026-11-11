// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/**", ".angular/**", "coverage/**", "**/openapi.generated.ts"] },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Constitución, principio III: el token y la sesión viven solo en memoria; nada de contenido ejecutable del servidor.
      "no-restricted-globals": [
        "error",
        { name: "localStorage", message: "La sesión vive solo en memoria (constitución III)." },
        { name: "sessionStorage", message: "La sesión vive solo en memoria (constitución III)." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "localStorage", message: "La sesión vive solo en memoria (constitución III)." },
        { object: "window", property: "sessionStorage", message: "La sesión vive solo en memoria (constitución III)." },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "MemberExpression[property.name='innerHTML']", message: "No se usa innerHTML (FR-027)." },
        { selector: "MemberExpression[property.name='outerHTML']", message: "No se usa outerHTML (FR-027)." },
        { selector: "CallExpression[callee.property.name=/^bypassSecurityTrust/]", message: "No se usa bypassSecurityTrust* (FR-027)." },
      ],
      // Las páginas enrutadas usan el sufijo Page (login.page.ts, loans.page.ts…).
      "@angular-eslint/component-class-suffix": ["error", { suffixes: ["Component", "Page"] }],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    // Las pruebas pueden leer el almacenamiento para comprobar que la sesión nunca se escribe en él.
    files: ["**/*.spec.ts"],
    rules: { "no-restricted-globals": "off", "no-restricted-properties": "off" },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
