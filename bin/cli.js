#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { cac } from 'cac';
import { confirm, isCancel, text } from '@clack/prompts';
import pc from 'picocolors';

import { CLI_PACKAGE_JSON_PATH, TEMPLATE_DIR } from '../lib/constants.js';
import {
  copyTemplate,
  renderTemplateFiles,
  runGitInit,
} from '../lib/scaffold.js';
import {
  printCliLogo,
  printHeader,
  printNextSteps,
  readCliVersion,
  toPackageName,
  validateProjectName,
} from '../lib/utils.js';

const cliVersion = readCliVersion(CLI_PACKAGE_JSON_PATH);
const scaffoldedWith = `create-adorex@${cliVersion}`;
const DEFAULT_PROJECT_NAME = 'my-app';
const VALID_TEMPLATES = ['express-sqlite'];

async function resolveProjectName(initialName) {
  const provided = String(initialName ?? '').trim();
  if (provided) return provided;

  if (!(process.stdin.isTTY && process.stdout.isTTY)) return '';

  const answer = await text({
    message: 'Project name',
    placeholder: DEFAULT_PROJECT_NAME,
  });

  if (isCancel(answer)) {
    throw new Error('Operation cancelled by user.');
  }

  return String(answer).trim() || DEFAULT_PROJECT_NAME;
}

async function handleExistingDir(projectPath, appName, force) {
  if (!fs.existsSync(projectPath)) return;

  if (force) {
    fs.rmSync(projectPath, { recursive: true });
    return;
  }

  if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    throw new Error(`Directory "${appName}" already exists`);
  }

  const answer = await confirm({
    message: `${pc.red('Directory')} "${pc.red(appName)}" ${pc.red('already exists. Remove and continue?')}`,
  });

  if (isCancel(answer) || !answer) {
    throw new Error('Operation cancelled.');
  }

  fs.rmSync(projectPath, { recursive: true });
}

async function scaffold(projectName, options = {}) {
  const { template = 'express-sqlite', force = false } = options;

  if (!VALID_TEMPLATES.includes(template)) {
    throw new Error(
      `Unknown template "${template}". Available: ${VALID_TEMPLATES.join(', ')}`,
    );
  }

  const skipSetup = process.env.ADOREX_SKIP_SETUP === '1';
  const isDot = projectName === '.';
  const appName = isDot
    ? path.basename(process.cwd())
    : validateProjectName(projectName);
  const packageName = toPackageName(appName);

  printCliLogo(cliVersion);
  printHeader(pc.green('Scaffolding your Adorex app'));

  const projectPath = isDot ? process.cwd() : path.join(process.cwd(), appName);

  if (!isDot) {
    await handleExistingDir(projectPath, appName, force);
  }

  await copyTemplate(TEMPLATE_DIR, projectPath, isDot);
  await renderTemplateFiles(projectPath, {
    appName,
    packageName,
    scaffoldedWith,
  });

  console.log(`  ${pc.green('✔')} Created ${pc.green(appName)}`);

  if (!skipSetup) {
    await runGitInit(projectPath);
  }

  printNextSteps(isDot ? '.' : pc.green(appName));
  console.log(
    `  ${pc.green('✔')} ${pc.green(`"${appName}" is ready!`)}\n Don't forget to read ${pc.yellowBright('README.md')}\nfor setup instructions. ${pc.green('Good luck! XD')}`,
  );
}

async function main() {
  const cli = cac('create-adorex');
  cli.version(cliVersion, '-v, --version');
  cli.help();

  let projectNameFromArgs;
  let scaffoldOptions = {};

  cli
    .command(
      '[project-name]',
      'Scaffold a new Express + TypeScript + Prisma app',
    )
    .option('--template <name>', 'Template to use (default: express-sqlite)')
    .option('--force', 'Overwrite existing target directory')
    .action((projectName, options) => {
      projectNameFromArgs = projectName;
      scaffoldOptions = {
        template: options.template ?? 'express-sqlite',
        force: options.force ?? false,
      };
    });

  const parsed = cli.parse();
  if (parsed.options?.help || parsed.options?.version) {
    return;
  }

  const projectName = await resolveProjectName(projectNameFromArgs);
  await scaffold(projectName, scaffoldOptions);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
