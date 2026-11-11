// Falla si el build de producción (dist/cbl-web) contiene cadenas exclusivas del modo demostración.
// Se ejecuta después de `ng build`: `npm run check:prod`.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/cbl-web', import.meta.url));
const FORBIDDEN = ['__CBL_MOCK_API__', 'fail500@test.com', 'X-CBL-Mock', 'MOCK_ROUTES'];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (/\.(js|mjs|html|css|json|map)$/.test(entry.name)) {
      yield path;
    }
  }
}

let scanned = 0;
const hits = [];
try {
  for await (const file of walk(dist)) {
    scanned += 1;
    const text = await readFile(file, 'utf8');
    for (const needle of FORBIDDEN) {
      if (text.includes(needle)) {
        hits.push(`${file.replace(dist, 'dist/cbl-web')}: ${needle}`);
      }
    }
  }
} catch (error) {
  console.error(`No se pudo leer ${dist}: ${error.message}. ¿Se ejecutó "ng build"?`);
  process.exit(1);
}

if (scanned === 0) {
  console.error('El build de producción está vacío.');
  process.exit(1);
}
if (hits.length > 0) {
  console.error(`El build de producción contiene código del mock:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${scanned} archivos revisados; el build de producción no contiene código del mock.`);
