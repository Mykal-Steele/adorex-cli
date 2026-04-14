import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { CLI_PACKAGE_JSON_PATH, TEMPLATE_DIR } from '../lib/constants.js';
import {
  SUPPORTED_GENERATED_APP_NODE_TEXT,
  isGeneratedAppNodeVersionSupported,
  printCliLogo,
  readCliVersion,
  toPackageName,
  warnIfUnsupportedGeneratedAppNode,
  printNextSteps,
} from '../lib/utils.js';

const cliPath = path.join(process.cwd(), 'bin/cli.js');
const cliPackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
);
const expectedScaffoldedWith = `create-adorex@${cliPackageJson.version}`;
const expectedScaffoldedWithRegex = new RegExp(
  `Scaffolded with ${escapeRegex(expectedScaffoldedWith)}`,
);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env: {
      ...process.env,
      ADOREX_SKIP_SETUP: '1',
      ADOREX_DISABLE_UPDATE_NOTIFIER: '1',
    },
    encoding: 'utf8',
  });
}

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adorex-'));

  try {
    fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test('creates a scaffolded project', () => {
  withTempDir((tempDir) => {
    const projectName = 'My App';
    const result = runCli([projectName], tempDir);
    const combinedOutput = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 0, result.stderr);
    assert.match(combinedOutput, /___\s+__\s+_\s*/);

    const projectPath = path.join(tempDir, projectName);
    const packageJson = readJson(path.join(projectPath, 'package.json'));
    const packageLock = readJson(path.join(projectPath, 'package-lock.json'));
    const readme = fs.readFileSync(path.join(projectPath, 'README.md'), 'utf8');

    assert.equal(packageJson.name, 'my-app');
    assert.equal(packageJson.adorex.scaffoldedWith, expectedScaffoldedWith);
    assert.equal(packageLock.name, 'my-app');
    assert.equal(packageLock.packages[''].name, 'my-app');
    assert.match(readme, /^# My App$/m);
    assert.match(readme, expectedScaffoldedWithRegex);
    assert.equal(fs.existsSync(path.join(projectPath, 'src/index.ts')), true);
    assert.equal(
      fs.existsSync(path.join(projectPath, 'prisma/schema.prisma')),
      true,
    );
  });
});

test('shows usage when project name is missing', () => {
  withTempDir((tempDir) => {
    const result = runCli([], tempDir);

    assert.equal(result.status, 1);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Usage: npm create adorex <project-name>/,
    );
  });
});

test('rejects project names that include a slash', () => {
  withTempDir((tempDir) => {
    const result = runCli(['foo/bar'], tempDir);

    assert.equal(result.status, 1);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Project name must be a single directory name/,
    );
  });
});

test('fails if target directory already exists', () => {
  withTempDir((tempDir) => {
    const projectName = 'demo';
    fs.mkdirSync(path.join(tempDir, projectName));

    const result = runCli([projectName], tempDir);

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /already exists/);
  });
});

test('shows help output', () => {
  withTempDir((tempDir) => {
    const result = runCli(['--help'], tempDir);

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Scaffold a new Express \+ TypeScript \+ Prisma app/,
    );
  });
});

test('shows version output', () => {
  withTempDir((tempDir) => {
    const result = runCli(['--version'], tempDir);

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      new RegExp(cliPackageJson.version),
    );
  });
});

test('package.json name is create-adorex', () => {
  assert.equal(cliPackageJson.name, 'create-adorex');
});

test('package.json bin includes the create-adorex alias', () => {
  assert.equal(cliPackageJson.bin.adorex, 'bin/cli.js');
  assert.equal(cliPackageJson.bin['create-adorex'], 'bin/cli.js');
});

test('utils readCliVersion returns the current package version', () => {
  assert.equal(readCliVersion(CLI_PACKAGE_JSON_PATH), cliPackageJson.version);
});

test('utils readCliVersion returns unknown for missing package file', () => {
  const missingPath = path.join(
    os.tmpdir(),
    `adorex-missing-${Date.now()}.json`,
  );
  assert.equal(readCliVersion(missingPath), 'unknown');
});

test('utils toPackageName normalizes names', () => {
  assert.equal(toPackageName('My App'), 'my-app');
  assert.equal(toPackageName('__Demo..App__'), 'demo-app');
  assert.equal(toPackageName('***'), 'adorex-app');
});

test('utils generated app Node support matches Prisma matrix', () => {
  assert.equal(SUPPORTED_GENERATED_APP_NODE_TEXT, '^22.12 || ^24.0');
  assert.equal(isGeneratedAppNodeVersionSupported('21.0.0'), false);
  assert.equal(isGeneratedAppNodeVersionSupported('22.11.0'), false);
  assert.equal(isGeneratedAppNodeVersionSupported('22.12.0'), true);
  assert.equal(isGeneratedAppNodeVersionSupported('24.0.0'), true);
  assert.equal(isGeneratedAppNodeVersionSupported('30.0.0'), false);
});

test('utils warnIfUnsupportedGeneratedAppNode prints warning details', () => {
  const warning = warnIfUnsupportedGeneratedAppNode('30.0.0');
  assert.equal(typeof warning, 'string');
  assert.equal(warning.includes('tested with'), true);
  assert.equal(warning.includes('30.0.0'), true);
});

test('utils warnIfUnsupportedGeneratedAppNode is quiet for supported versions', () => {
  const warning = warnIfUnsupportedGeneratedAppNode('22.12.0');
  assert.equal(warning, null);
});

test('utils printNextSteps includes Node support guidance', () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (line) => logs.push(String(line ?? ''));

  try {
    printNextSteps('demo-app');
    assert.equal(
      logs.some((line) => line.includes('cd "demo-app"')),
      true,
    );
    assert.equal(
      logs.some((line) => line.includes('npx prisma migrate dev --name init')),
      true,
    );
    assert.equal(
      logs.some((line) => line.includes('npm run dev')),
      true,
    );
  } finally {
    console.log = originalLog;
  }
});

test('utils printCliLogo outputs the CLI banner', () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (line) => logs.push(String(line ?? ''));

  try {
    printCliLogo('1.3.11');
    const rendered = logs.join('\n');
    assert.equal(rendered.includes('___       __'), true);
    assert.equal(rendered.includes('/____/ .___/'), true);
    assert.equal(rendered.includes('create-adorex 1.3.11'), true);
  } finally {
    console.log = originalLog;
  }
});

test('constants resolve to existing template and package paths', () => {
  assert.equal(fs.existsSync(TEMPLATE_DIR), true);
  assert.equal(fs.existsSync(CLI_PACKAGE_JSON_PATH), true);
});
