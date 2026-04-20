import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  validateProjectName,
  toPackageName,
  readCliVersion,
} from '../lib/utils.js';
import {
  copyTemplate,
  renderTemplateFiles,
  runGitInit,
} from '../lib/scaffold.js';
import { TEMPLATE_DIR, CLI_PACKAGE_JSON_PATH } from '../lib/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, '.test-tmp');

function makeTmpDir() {
  const dir = path.join(
    TMP,
    `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

before(() => fs.mkdirSync(TMP, { recursive: true }));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// ─── validateProjectName ────────────────────────────────────────────

describe('validateProjectName', () => {
  it('returns a valid name unchanged', () => {
    assert.equal(validateProjectName('my-app'), 'my-app');
  });

  it('throws on empty string', () => {
    assert.throws(() => validateProjectName(''), /Usage/);
  });

  it('throws on undefined', () => {
    assert.throws(() => validateProjectName(undefined), /Usage/);
  });

  it('throws on name with slashes', () => {
    assert.throws(() => validateProjectName('foo/bar'), /single directory/);
    assert.throws(() => validateProjectName('foo\\bar'), /single directory/);
  });

  it('throws on ".."', () => {
    assert.throws(() => validateProjectName('..'), /single directory/);
  });
});

// ─── toPackageName ──────────────────────────────────────────────────

describe('toPackageName', () => {
  it('lowercases and returns simple names', () => {
    assert.equal(toPackageName('MyApp'), 'myapp');
  });

  it('replaces spaces and special chars with hyphens', () => {
    assert.equal(toPackageName('My Cool App!'), 'my-cool-app');
  });

  it('strips leading/trailing separators', () => {
    assert.equal(toPackageName('--app--'), 'app');
  });

  it('collapses consecutive separators', () => {
    assert.equal(toPackageName('a___b'), 'a-b');
  });

  it('returns "adorex-app" for empty result', () => {
    assert.equal(toPackageName('!!!'), 'adorex-app');
  });

  it('preserves dots and hyphens in name', () => {
    assert.equal(toPackageName('my.cool-app'), 'my.cool-app');
  });

  it('preserves underscores', () => {
    assert.equal(toPackageName('my_app'), 'my_app');
  });
});

// ─── readCliVersion ─────────────────────────────────────────────────

describe('readCliVersion', () => {
  it('reads version from the real package.json', () => {
    const version = readCliVersion(CLI_PACKAGE_JSON_PATH);
    assert.match(version, /^\d+\.\d+\.\d+/);
  });

  it('returns "unknown" for non-existent file', () => {
    assert.equal(readCliVersion('/tmp/nope.json'), 'unknown');
  });

  it('returns "unknown" for malformed JSON', () => {
    const bad = path.join(TMP, 'bad.json');
    fs.writeFileSync(bad, '{not json');
    assert.equal(readCliVersion(bad), 'unknown');
  });

  it('returns "unknown" when JSON has no version field', () => {
    const noVer = path.join(TMP, 'no-version.json');
    fs.writeFileSync(noVer, '{"name": "test"}');
    assert.equal(readCliVersion(noVer), 'unknown');
  });
});

// ─── constants ──────────────────────────────────────────────────────

describe('constants', () => {
  it('TEMPLATE_DIR points to existing directory', () => {
    assert.ok(fs.statSync(TEMPLATE_DIR).isDirectory());
  });

  it('CLI_PACKAGE_JSON_PATH points to existing file', () => {
    assert.ok(fs.statSync(CLI_PACKAGE_JSON_PATH).isFile());
  });
});

// ─── copyTemplate ───────────────────────────────────────────────────

describe('copyTemplate', () => {
  it('copies template files to target directory', async () => {
    const dest = makeTmpDir();
    fs.rmSync(dest, { recursive: true }); // copyTemplate creates it
    await copyTemplate(TEMPLATE_DIR, dest);

    assert.ok(fs.existsSync(path.join(dest, 'package.json')));
    assert.ok(fs.existsSync(path.join(dest, 'src', 'index.ts')));
    assert.ok(fs.existsSync(path.join(dest, 'prisma', 'schema.prisma')));
    assert.ok(fs.existsSync(path.join(dest, 'tsconfig.json')));
  });

  it('renames _gitignore to .gitignore', async () => {
    const dest = makeTmpDir();
    fs.rmSync(dest, { recursive: true });
    await copyTemplate(TEMPLATE_DIR, dest);

    assert.ok(fs.existsSync(path.join(dest, '.gitignore')));
    assert.ok(!fs.existsSync(path.join(dest, '_gitignore')));
  });

  it('skips node_modules from template', async () => {
    const dest = makeTmpDir();
    fs.rmSync(dest, { recursive: true });
    // create a fake node_modules in template if it exists
    await copyTemplate(TEMPLATE_DIR, dest);

    assert.ok(!fs.existsSync(path.join(dest, 'node_modules')));
  });

  it('works with intoExisting=true on existing dir', async () => {
    const dest = makeTmpDir();
    fs.writeFileSync(path.join(dest, 'existing.txt'), 'keep');
    await copyTemplate(TEMPLATE_DIR, dest, true);

    assert.ok(fs.existsSync(path.join(dest, 'existing.txt')));
    assert.ok(fs.existsSync(path.join(dest, 'package.json')));
  });
});

// ─── renderTemplateFiles ────────────────────────────────────────────

describe('renderTemplateFiles', () => {
  let projectDir;

  beforeEach(async () => {
    projectDir = makeTmpDir();
    fs.rmSync(projectDir, { recursive: true });
    await copyTemplate(TEMPLATE_DIR, projectDir);
  });

  const ctx = {
    appName: 'test-project',
    packageName: 'test-project',
    scaffoldedWith: 'create-adorex@0.0.0-test',
  };

  it('renders package.json with correct name', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
    );
    assert.equal(pkg.name, 'test-project');
  });

  it('sets adorex.scaffoldedWith in package.json', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
    );
    assert.equal(pkg.adorex.scaffoldedWith, 'create-adorex@0.0.0-test');
  });

  it('renders .env with default port and database URL', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const env = fs.readFileSync(path.join(projectDir, '.env'), 'utf8');
    assert.ok(env.includes('PORT=3000'));
    assert.ok(env.includes('DATABASE_URL="file:./dev.db"'));
  });

  it('renders prisma schema with sqlite provider', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const schema = fs.readFileSync(
      path.join(projectDir, 'prisma', 'schema.prisma'),
      'utf8',
    );
    assert.ok(schema.includes('provider = "sqlite"'));
    assert.ok(!schema.includes('{{dbProvider}}'));
  });

  it('renders README with app name and scaffoldedWith', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const readme = fs.readFileSync(path.join(projectDir, 'README.md'), 'utf8');
    assert.ok(readme.includes('test-project'));
    assert.ok(readme.includes('create-adorex@0.0.0-test'));
    assert.ok(!readme.includes('{{appName}}'));
  });

  it('updates package-lock.json name if present', async () => {
    const lockPath = path.join(projectDir, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      await renderTemplateFiles(projectDir, ctx);
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      assert.equal(lock.name, 'test-project');
    }
  });

  it('preserves existing package.json fields after render', async () => {
    await renderTemplateFiles(projectDir, ctx);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
    );
    assert.ok(pkg.scripts.dev, 'scripts.dev missing');
    assert.ok(pkg.scripts.build, 'scripts.build missing');
    assert.ok(pkg.dependencies['express'], 'express dep missing');
    assert.ok(pkg.dependencies['@prisma/client'], 'prisma dep missing');
    assert.equal(pkg.type, 'module');
  });

  it('leaves no unreplaced {{...}} placeholders', async () => {
    await renderTemplateFiles(projectDir, ctx);

    const filesToCheck = [
      'package.json',
      '.env',
      'prisma/schema.prisma',
      'README.md',
    ];

    for (const file of filesToCheck) {
      const content = fs.readFileSync(path.join(projectDir, file), 'utf8');
      assert.ok(
        !/\{\{\w+\}\}/.test(content),
        `Leftover placeholder in ${file}: ${content.match(/\{\{\w+\}\}/)?.[0]}`,
      );
    }
  });
});

// ─── runGitInit ─────────────────────────────────────────────────────

describe('runGitInit', () => {
  it('initializes a git repo in the given directory', () => {
    const dest = makeTmpDir();
    runGitInit(dest);
    assert.ok(fs.existsSync(path.join(dest, '.git')));
  });
});

// ─── template structure integrity ───────────────────────────────────

describe('template directory', () => {
  const required = [
    'package.json',
    'tsconfig.json',
    'prisma.config.ts',
    'prisma/schema.prisma',
    'src/index.ts',
    'src/utils/prisma.ts',
    'README.md',
    '_gitignore',
    '.env',
  ];

  for (const file of required) {
    it(`contains ${file}`, () => {
      assert.ok(
        fs.existsSync(path.join(TEMPLATE_DIR, file)),
        `Missing: ${file}`,
      );
    });
  }

  it('template package.json has correct type=module', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8'),
    );
    assert.equal(pkg.type, 'module');
  });

  it('template package.json contains required scripts', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8'),
    );
    assert.ok(pkg.scripts.dev);
    assert.ok(pkg.scripts.build);
    assert.ok(pkg.scripts.start);
  });

  it('template package.json has required dependencies', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8'),
    );
    assert.ok(pkg.dependencies['express']);
    assert.ok(pkg.dependencies['@prisma/client']);
    assert.ok(pkg.dependencies['dotenv']);
  });
});

// ─── CLI e2e: --help and --version ──────────────────────────────────

describe('CLI binary', () => {
  const CLI = path.join(ROOT, 'bin', 'cli.js');

  it('--version prints version number', () => {
    const out = execFileSync('node', [CLI, '--version'], { encoding: 'utf8' });
    assert.match(out.trim(), /\d+\.\d+\.\d+/);
  });

  it('--help prints usage info', () => {
    const out = execFileSync('node', [CLI, '--help'], { encoding: 'utf8' });
    assert.ok(out.includes('create-adorex'));
  });

  it('rejects invalid template name', () => {
    assert.throws(
      () =>
        execFileSync('node', [CLI, 'tmp-proj', '--template', 'nope'], {
          encoding: 'utf8',
          env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
        }),
      /Unknown template/,
    );
  });

  it('scaffolds a project with a given name', () => {
    const name = `test-e2e-${Date.now()}`;
    const dest = path.join(TMP, name);

    try {
      execFileSync('node', [CLI, name], {
        encoding: 'utf8',
        cwd: TMP,
        env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
      });

      assert.ok(fs.existsSync(path.join(dest, 'package.json')));
      assert.ok(fs.existsSync(path.join(dest, '.gitignore')));
      assert.ok(fs.existsSync(path.join(dest, 'src', 'index.ts')));

      const pkg = JSON.parse(
        fs.readFileSync(path.join(dest, 'package.json'), 'utf8'),
      );
      assert.equal(pkg.name, name);
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });

  it('--force overwrites existing directory', () => {
    const name = `test-force-${Date.now()}`;
    const dest = path.join(TMP, name);

    try {
      fs.mkdirSync(dest, { recursive: true });
      fs.writeFileSync(path.join(dest, 'old.txt'), 'old');

      execFileSync('node', [CLI, name, '--force'], {
        encoding: 'utf8',
        cwd: TMP,
        env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
      });

      assert.ok(!fs.existsSync(path.join(dest, 'old.txt')));
      assert.ok(fs.existsSync(path.join(dest, 'package.json')));
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });

  it('scaffolds into "." (current directory)', () => {
    const dest = makeTmpDir();

    try {
      execFileSync('node', [CLI, '.'], {
        encoding: 'utf8',
        cwd: dest,
        env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
      });

      assert.ok(fs.existsSync(path.join(dest, 'package.json')));
      assert.ok(fs.existsSync(path.join(dest, 'src', 'index.ts')));
      assert.ok(fs.existsSync(path.join(dest, '.gitignore')));
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });

  it('exits non-zero when no name given in non-TTY', () => {
    assert.throws(
      () =>
        execFileSync('node', [CLI], {
          encoding: 'utf8',
          cwd: TMP,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
        }),
      (err) => err.status !== 0,
    );
  });

  it('e2e: rendered output has correct .env, schema, README', () => {
    const name = `test-full-${Date.now()}`;
    const dest = path.join(TMP, name);

    try {
      execFileSync('node', [CLI, name], {
        encoding: 'utf8',
        cwd: TMP,
        env: { ...process.env, ADOREX_SKIP_SETUP: '1' },
      });

      const env = fs.readFileSync(path.join(dest, '.env'), 'utf8');
      assert.ok(env.includes('PORT=3000'));
      assert.ok(env.includes('DATABASE_URL='));

      const schema = fs.readFileSync(
        path.join(dest, 'prisma', 'schema.prisma'),
        'utf8',
      );
      assert.ok(schema.includes('provider = "sqlite"'));

      const readme = fs.readFileSync(path.join(dest, 'README.md'), 'utf8');
      assert.ok(readme.includes(name));
      assert.ok(!readme.includes('{{'));
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });
});
