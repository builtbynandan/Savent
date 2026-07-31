import { constants } from 'node:fs';
import { access, copyFile } from 'node:fs/promises';

const examplePath = new URL('../apps/server/.env.example', import.meta.url);
const environmentPath = new URL('../apps/server/.env', import.meta.url);

try {
  await access(environmentPath, constants.F_OK);
  console.log('Using the existing apps/server/.env file.');
} catch {
  await copyFile(examplePath, environmentPath);
  console.log('Created apps/server/.env from .env.example.');
}
