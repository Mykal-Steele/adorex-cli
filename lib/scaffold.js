import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import pc from 'picocolors';

function render(template, ctx) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] ?? '');
}

export async function copyTemplate(
  templateDir,
  projectPath,
  intoExisting = false,
) {
  await fsPromises.cp(templateDir, projectPath, {
    recursive: true,
    errorOnExist: !intoExisting,
    force: intoExisting,
    filter: (src) => {
      const rel = path.relative(templateDir, src);
      return !rel.startsWith('node_modules');
    },
  });

  const gitignoreSrc = path.join(projectPath, '_gitignore');
  const gitignoreDest = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignoreSrc)) {
    await fsPromises.rename(gitignoreSrc, gitignoreDest);
  }
}

export async function renderTemplateFiles(projectPath, context) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageLockPath = path.join(projectPath, 'package-lock.json');
  const envPath = path.join(projectPath, '.env');
  const schemaPath = path.join(projectPath, 'prisma', 'schema.prisma');
  const readmePath = path.join(projectPath, 'README.md');

  const [packageTemplate, envTemplate, schemaTemplate, readmeTemplate] =
    await Promise.all([
      fsPromises.readFile(packageJsonPath, 'utf8'),
      fsPromises.readFile(envPath, 'utf8'),
      fsPromises.readFile(schemaPath, 'utf8'),
      fsPromises.readFile(readmePath, 'utf8'),
    ]);

  const packageJson = JSON.parse(
    render(packageTemplate, { scaffoldedWith: context.scaffoldedWith }),
  );
  packageJson.name = context.packageName;
  packageJson.adorex = { scaffoldedWith: context.scaffoldedWith };

  await Promise.all([
    fsPromises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
    ),
    fsPromises.writeFile(
      envPath,
      render(envTemplate, { port: '3000', databaseUrl: 'file:./dev.db' }),
    ),
    fsPromises.writeFile(
      schemaPath,
      render(schemaTemplate, { dbProvider: 'sqlite' }),
    ),
    fsPromises.writeFile(
      readmePath,
      render(readmeTemplate, {
        appName: context.appName,
        scaffoldedWith: context.scaffoldedWith,
      }),
    ),
  ]);

  if (fs.existsSync(packageLockPath)) {
    const packageLock = JSON.parse(
      await fsPromises.readFile(packageLockPath, 'utf8'),
    );
    packageLock.name = context.packageName;
    if (packageLock.packages?.[''] !== undefined) {
      packageLock.packages[''].name = context.packageName;
    }
    await fsPromises.writeFile(
      packageLockPath,
      JSON.stringify(packageLock, null, 2) + '\n',
    );
  }
}

export function runGitInit(projectPath) {
  const result = spawnSync('git', ['init'], {
    cwd: projectPath,
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    process.stdout.write(`  ${pc.yellow('⚠')} Git init skipped\n`);
    return;
  }

  process.stdout.write(`  ${pc.green('✔')} Git repository initialized\n`);
}
