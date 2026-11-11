// Avisa, sin fallar, si la copia local del contrato difiere de la del backend (rama main).
// Uso: npm run contract:sync
import { readFile } from 'node:fs/promises';

const REMOTE =
  'https://raw.githubusercontent.com/miguelaurela/cbl-backend/main/specs/001-gestion-prestamos/contracts/openapi.yaml';
const LOCAL = new URL('../specs/001-web-ui/contracts/openapi.yaml', import.meta.url);

const normalize = (text) => text.replace(/\r\n/g, '\n').trimEnd();

try {
  const response = await fetch(REMOTE);
  if (!response.ok) {
    console.warn(`::warning::No se pudo descargar el contrato del backend (HTTP ${response.status}); se omite la comprobación.`);
    process.exit(0);
  }
  const remote = normalize(await response.text());
  const local = normalize(await readFile(LOCAL, 'utf8'));
  if (remote === local) {
    console.log('El contrato local coincide con el de cbl-backend@main.');
  } else {
    console.warn(
      '::warning::specs/001-web-ui/contracts/openapi.yaml difiere del contrato de cbl-backend@main. ' +
        'Revisa los cambios del backend y, si procede, actualiza la copia y ejecuta npm run contract:generate.',
    );
  }
} catch (error) {
  console.warn(`::warning::No se pudo comprobar el contrato del backend: ${error.message}`);
}
process.exit(0);
