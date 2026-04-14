import fs from 'node:fs';
import pc from 'picocolors';
import semver from 'semver';

const SUPPORTED_GENERATED_APP_NODE_RANGE =
  '>=22.12.0 <23.0.0 || >=24.0.0 <25.0.0';
export const SUPPORTED_GENERATED_APP_NODE_TEXT = '^22.12 || ^24.0';

const CLI_LOGO_LINES = [
  '    ___       __          _      ',
  '   /   | ____/ /___  ____(_)___  ',
  '  / /| |/ __  / __ \\/ __/ / __ \\ ',
  ' / ___ / /_/ / /_/ / / / / /_/ / ',
  '/_/  |_|\\__,_/\\____/_/ /_/\\____/  ',
  '         _________  ____  ________',
  '        / ___/ __ \\/ __ ` / ___/ _ \\',
  '       (__  ) /_/ / /_/ / /__/ __/',
  '      /____/ .___/\\__,_/\\___/\\___/ ',
  '          /_/                    ',
];

export function validateProjectName(name) {
  if (!name) {
    throw new Error('Usage: npm create adorex <project-name>');
  }

  if (name === '..' || /[\\/]/.test(name)) {
    throw new Error('Project name must be a single directory name.');
  }

  return name;
}

export function printCliLogo(version) {
  console.log(CLI_LOGO_LINES.join('\n'));

  if (version) {
    console.log(`\ncreate-adorex ${version}`);
  }
}

export function printHeader(message) {
  console.log(`\n  ${message}\n`);
}

export function isGeneratedAppNodeVersionSupported(
  version = process.versions.node,
) {
  const normalizedVersion = semver.coerce(String(version));
  if (!normalizedVersion) {
    return false;
  }

  return semver.satisfies(
    normalizedVersion,
    SUPPORTED_GENERATED_APP_NODE_RANGE,
  );
}

export function warnIfUnsupportedGeneratedAppNode(
  version = process.versions.node,
) {
  if (isGeneratedAppNodeVersionSupported(version)) {
    return null;
  }

  return `Template is tested with Node ${SUPPORTED_GENERATED_APP_NODE_TEXT} (current: ${version}).\nIf you hit issues, switch to a supported LTS version.`;
}

export function printNextSteps(projectName) {
  const shellSafeProjectName = String(projectName).replace(/"/g, '\\"');

  console.log(`\n  ${pc.bold('Done!')} Now run:\n`);
  if (projectName !== '.') {
    console.log(`    cd "${shellSafeProjectName}"`);
  }
  console.log('    npm install');
  console.log('    npx prisma migrate dev --name init');
  console.log('    npx prisma generate');
  console.log('    npm run dev');
  console.log();
}

export function toPackageName(appName) {
  const name = appName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .replace(/[._-]{2,}/g, '-');

  return name || 'adorex-app';
}

export function readCliVersion(cliPackageJsonPath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}
