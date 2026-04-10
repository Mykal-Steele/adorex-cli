import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { execa } from "execa";
import ora from "ora";
import pc from "picocolors";

function npmBinary() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function npxBinary() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

async function runCommand(command, args, options = {}) {
  const { retries = 0, cwd, stdio = "pipe" } = options;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await execa(command, args, {
        cwd,
        stdio,
        reject: true,
      });

      return {
        ok: true,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    error: lastError,
    stdout: lastError?.stdout,
    stderr: lastError?.stderr,
  };
}

function commandToString(command, args) {
  return [command, ...args].join(" ");
}

export function ensureProjectPathAvailable(projectPath, projectName) {
  if (fs.pathExistsSync(projectPath)) {
    throw new Error(`Directory '${projectName}' already exists`);
  }
}

export async function copyTemplate(templateDir, projectPath) {
  await fs.copy(templateDir, projectPath, {
    overwrite: false,
    errorOnExist: true,
  });
}

export async function renderTemplateFiles(projectPath, context) {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageLockPath = path.join(projectPath, "package-lock.json");
  const envPath = path.join(projectPath, ".env");
  const schemaPath = path.join(projectPath, "prisma", "schema.prisma");
  const readmePath = path.join(projectPath, "README.md");

  const [packageTemplate, envTemplate, schemaTemplate, readmeTemplate] =
    await Promise.all([
      fs.readFile(packageJsonPath, "utf8"),
      fs.readFile(envPath, "utf8"),
      fs.readFile(schemaPath, "utf8"),
      fs.readFile(readmePath, "utf8"),
    ]);

  const renderedPackageJson = Handlebars.compile(packageTemplate)({
    scaffoldedWith: context.scaffoldedWith,
  });
  const packageJson = JSON.parse(renderedPackageJson);
  packageJson.name = context.packageName;
  packageJson.adorex = {
    scaffoldedWith: context.scaffoldedWith,
  };
  const finalizedPackageJson = `${JSON.stringify(packageJson, null, 2)}\n`;
  const renderedEnv = Handlebars.compile(envTemplate)({
    port: "3000",
    databaseUrl: "file:./dev.db",
  });
  const renderedSchema = Handlebars.compile(schemaTemplate)({
    dbProvider: "sqlite",
  });
  const renderedReadme = Handlebars.compile(readmeTemplate)({
    appName: context.appName,
    scaffoldedWith: context.scaffoldedWith,
  });

  await Promise.all([
    fs.writeFile(packageJsonPath, finalizedPackageJson),
    fs.writeFile(envPath, renderedEnv),
    fs.writeFile(schemaPath, renderedSchema),
    fs.writeFile(readmePath, renderedReadme),
  ]);

  if (await fs.pathExists(packageLockPath)) {
    const packageLock = await fs.readJson(packageLockPath);
    packageLock.name = context.packageName;

    if (packageLock.packages && packageLock.packages[""]) {
      packageLock.packages[""].name = context.packageName;
    }

    await fs.writeJson(packageLockPath, packageLock, { spaces: 2 });
  }
}

export async function runInstall(projectPath) {
  const spinner = ora("Installing dependencies...").start();

  const command = npmBinary();
  const args = ["install", "--no-fund", "--no-audit", "--silent"];
  const result = await runCommand(command, args, {
    cwd: projectPath,
    retries: 1,
  });

  if (!result.ok) {
    spinner.fail(pc.red("Failed to install dependencies"));
    const output =
      result.stderr || result.stdout || result.error?.message || "";
    throw new Error(
      `Failed to install dependencies\nCommand: ${commandToString(command, args)}${output ? `\n${output}` : ""}`,
    );
  }

  spinner.succeed(pc.green("Dependencies installed"));
}

export async function runGitInit(projectPath) {
  const spinner = ora("Initializing git repository...").start();

  const result = await runCommand("git", ["init"], {
    cwd: projectPath,
    retries: 0,
  });

  if (!result.ok) {
    spinner.warn(pc.yellow("Skipped git init"));
    return;
  }

  spinner.succeed(pc.green("Git repository initialized"));
}

export async function runPrismaGenerate(projectPath) {
  const spinner = ora("Generating Prisma client...").start();

  const npmExecCommand = npmBinary();
  const npmExecArgs = ["exec", "--silent", "prisma", "generate"];
  const npmExecResult = await runCommand(npmExecCommand, npmExecArgs, {
    cwd: projectPath,
  });

  if (npmExecResult.ok) {
    spinner.succeed(pc.green("Prisma client generated"));
    return;
  }

  spinner.text = "Retrying Prisma generation with npx...";

  const npxCommand = npxBinary();
  const npxArgs = ["--yes", "prisma", "generate"];
  const npxResult = await runCommand(npxCommand, npxArgs, {
    cwd: projectPath,
  });

  if (!npxResult.ok) {
    spinner.fail(pc.red("Failed to generate Prisma client"));
    const output =
      npxResult.stderr || npxResult.stdout || npxResult.error?.message || "";
    throw new Error(
      `Failed to generate Prisma client. Run manually: npx prisma generate\nCommands tried: ${commandToString(npmExecCommand, npmExecArgs)} | ${commandToString(npxCommand, npxArgs)}${output ? `\n${output}` : ""}`,
    );
  }

  spinner.succeed(pc.green("Prisma client generated"));
}
