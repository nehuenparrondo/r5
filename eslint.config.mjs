/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: validar TypeScript y pruebas respetando el codigo base.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.npm-cache/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-namespace': 'off'
    }
  }
);
// This file exports: configuracion ESLint.
// It is used by: npm run lint.
// It imports from: ESLint, typescript-eslint y globals.
