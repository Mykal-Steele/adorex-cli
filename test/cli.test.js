import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { toPackageName } from '../lib/utils.js';

const cliPath = path.join(process.cwd(), 'bin/cli.js');
const cliPackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
);
const expectedScaffoldedWith = `create-adorex@${cliPackageJson.version}`;

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

    assert.equal(result.status, 0, result.stderr);

    const projectPath = path.join(tempDir, projectName);
    const packageJson = readJson(path.join(projectPath, 'package.json'));

    assert.equal(packageJson.name, 'my-app');
    assert.equal(packageJson.adorex.scaffoldedWith, expectedScaffoldedWith);
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

test('toPackageName normalizes names', () => {
  assert.equal(toPackageName('My App'), 'my-app');
  assert.equal(toPackageName('__Demo..App__'), 'demo-app');
  assert.equal(toPackageName('***'), 'adorex-app');
});
