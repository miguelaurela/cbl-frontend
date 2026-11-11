// Endurecimiento (constitución III, FR-027): falla si src/ usa almacenamiento del navegador o HTML sin sanear.
// Se excluyen las pruebas (*.spec.ts), que comprueban justamente que no se escribe nada, y el contrato generado.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src', import.meta.url));
const FORBIDDEN = ['localStorage', 'sessionStorage', 'innerHTML', 'outerHTML', 'bypassSecurityTrust', 'document.cookie'];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') && entry.name !== 'openapi.generated.ts') {
      yield path;
    }
  }
}

const hits = [];
for await (const file of walk(src)) {
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const needle of FORBIDDEN) {
      if (line.includes(needle)) {
        hits.push(`${file.replace(src, 'src')}:${index + 1}: ${needle}`);
      }
    }
  });
}

if (hits.length > 0) {
  console.error(`Uso prohibido en src/:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log('OK: src/ no usa localStorage, sessionStorage, cookies, innerHTML ni bypassSecurityTrust.');
