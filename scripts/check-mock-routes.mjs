// Comprueba que el mock implementa todas las operaciones del contrato que usa la interfaz (constitución V).
// Uso: npm run contract:check-mock
import { readdir, readFile } from 'node:fs/promises';
import { load } from 'js-yaml';

const root = new URL('../', import.meta.url);
const contractPath = new URL('specs/001-web-ui/contracts/openapi.yaml', root);
const mockDir = new URL('src/app/core/mock/', root);

/** Operaciones del contrato que la interfaz no usa (edición y eliminación propias, consulta puntual y por id). */
const NOT_USED_BY_UI = new Set([
  'GET /api/loans/{id}',
  'PUT /api/loans/{id}',
  'DELETE /api/loans/{id}',
  'GET /api/loans/{id}/status',
  'GET /api/users/{id}',
  'DELETE /api/users/{id}',
]);

const METHODS = ['get', 'post', 'put', 'delete', 'patch'];

const contract = load(await readFile(contractPath, 'utf8'));
const operations = [];
for (const [path, item] of Object.entries(contract.paths ?? {})) {
  for (const method of METHODS) {
    if (item[method]) {
      operations.push(`${method.toUpperCase()} ${path}`);
    }
  }
}

const files = (await readdir(mockDir)).filter((name) => /^mock-routes-.*\.ts$/.test(name));
const implemented = new Set();
for (const file of files) {
  const source = await readFile(new URL(file, mockDir), 'utf8');
  for (const match of source.matchAll(/route\(\s*'(GET|POST|PUT|DELETE|PATCH)'\s*,\s*'(\/api\/[^']+)'/g)) {
    implemented.add(`${match[1]} ${match[2]}`);
  }
}

const required = operations.filter((operation) => !NOT_USED_BY_UI.has(operation));
const missing = required.filter((operation) => !implemented.has(operation));
const unknown = [...implemented].filter((operation) => !operations.includes(operation));

console.log(`Contrato: ${operations.length} operaciones; la interfaz usa ${required.length}; el mock implementa ${implemented.size}.`);
if (unknown.length > 0) {
  console.error(`Rutas del mock que no existen en el contrato:\n  ${unknown.join('\n  ')}`);
}
if (missing.length > 0) {
  console.error(`Operaciones del contrato sin implementar en el mock:\n  ${missing.join('\n  ')}`);
}
if (missing.length > 0 || unknown.length > 0) {
  process.exit(1);
}
console.log('OK: el mock cubre todas las operaciones del contrato que usa la interfaz.');
