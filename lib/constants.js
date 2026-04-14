import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export const TEMPLATE_DIR = path.join(root, 'template');
export const CLI_PACKAGE_JSON_PATH = path.join(root, 'package.json');
