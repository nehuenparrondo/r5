/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: formatear solo archivos alcanzados por la entrega OAuth.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as prettier from 'prettier';

const roots = [
  'backend/src',
  'backend/tests',
  'frontend-router/src',
  'frontend-state/src',
  'docs',
  'scripts'
];
const modified = new Set([
  'app.ts',
  'env.ts',
  'auth.controller.ts',
  'profile.controller.ts',
  'auth.middleware.ts',
  'rateLimiters.ts',
  'express.d.ts',
  'jwt.ts',
  'types.ts',
  'api.ts',
  'LoginPage.tsx',
  'RegisterPage.tsx',
  'ProfilePage.tsx',
  'AuthScreens.tsx',
  'ProfileScreen.tsx'
]);
const files = [
  'package.json',
  'eslint.config.mjs',
  '.prettierrc.json',
  'README.md',
  'backend/package.json',
  'frontend-router/vite.config.ts',
  'frontend-state/vite.config.ts'
];
const collect = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await collect(path);
    else if (
      modified.has(entry.name) ||
      /oauth|OAuth|SocialLogin|LinkedAccounts|authSession|asyncHandler/.test(entry.name) ||
      /^(docs|scripts|backend\/tests)\//.test(path)
    )
      files.push(path);
  }
};
for (const directory of roots) await collect(directory);
const check = process.argv.includes('--check');
for (const file of files) {
  const path = resolve(file);
  const content = await readFile(path, 'utf8');
  const options = { ...(await prettier.resolveConfig(path)), filepath: path };
  if (check) {
    if (!(await prettier.check(content, options))) {
      console.error(file);
      process.exitCode = 1;
    }
  } else {
    await writeFile(path, await prettier.format(content, options));
  }
}
console.log(check ? 'Verificacion de formato terminada.' : 'Formato de la entrega actualizado.');
// This file exports: ningun simbolo; ejecuta Prettier.
// It is used by: npm run format y npm run format:check.
// It imports from: fs, path y prettier.
