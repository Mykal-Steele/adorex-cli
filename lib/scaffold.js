import path from "node:path";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { spawn } from "node:child_process";
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await new Promise((resolve) => {
      const proc = spawn(command, args, { cwd, stdio, shell: false });
      const stdoutChunks = [];
      const stderrChunks = [];

      if (proc.stdout) proc.stdout.on("data", (d) => stdoutChunks.push(d));
      if (proc.stderr) proc.stderr.on("data", (d) => stderrChunks.push(d));

      proc.on("close", (code) => {
        const stdout = Buffer.concat(stdoutChunks).toString();
        const stderr = Buffer.concat(stderrChunks).toString();
        resolve({
          ok: code === 0,
          stdout,
          stderr,
          error: code !== 0 ? new Error(`exit ${code}`) : null,
        });
      });

      proc.on("error", (error) => {
        resolve({ ok: false, stdout: "", stderr: "", error });
      });
    });

    if (result.ok) return { ok: true, stdout: result.stdout, stderr: result.stderr };

    lastError = result.error;
    lastError.stdout = result.stdout;
    lastError.stderr = result.stderr;
  }

  return {
    ok: false,
    error: lastError,
    stdout: lastError?.stdout ?? "",
    stderr: lastError?.stderr ?? "",
  };
}

function commandToString(command, args) {
  return [command, ...args].join(" ");
}

function render(template, ctx) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] ?? "");
}

export async function copyTemplate(templateDir, projectPath, intoExisting = false) {
  await fsPromises.cp(templateDir, projectPath, {
    recursive: true,
    errorOnExist: !intoExisting,
    force: intoExisting,
    filter: (src) => {
      const rel = path.relative(templateDir, src);
      return !rel.startsWith("node_modules");
    },
  });

  const gitignoreSrc = path.join(projectPath, "_gitignore");
  const gitignoreDest = path.join(projectPath, ".gitignore");
  if (fs.existsSync(gitignoreSrc)) {
    await fsPromises.rename(gitignoreSrc, gitignoreDest);
  }
}

export async function renderTemplateFiles(projectPath, context) {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageLockPath = path.join(projectPath, "package-lock.json");
  const envPath = path.join(projectPath, ".env");
  const schemaPath = path.join(projectPath, "prisma", "schema.prisma");
  const readmePath = path.join(projectPath, "README.md");

  const [packageTemplate, envTemplate, schemaTemplate, readmeTemplate] =
    await Promise.all([
      fsPromises.readFile(packageJsonPath, "utf8"),
      fsPromises.readFile(envPath, "utf8"),
      fsPromises.readFile(schemaPath, "utf8"),
      fsPromises.readFile(readmePath, "utf8"),
    ]);

  const packageJson = JSON.parse(
    render(packageTemplate, { scaffoldedWith: context.scaffoldedWith }),
  );
  packageJson.name = context.packageName;
  packageJson.adorex = { scaffoldedWith: context.scaffoldedWith };

  await Promise.all([
    fsPromises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    ),
    fsPromises.writeFile(
      envPath,
      render(envTemplate, { port: "3000", databaseUrl: "file:./dev.db" }),
    ),
    fsPromises.writeFile(
      schemaPath,
      render(schemaTemplate, { dbProvider: "sqlite" }),
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
      await fsPromises.readFile(packageLockPath, "utf8"),
    );
    packageLock.name = context.packageName;
    if (packageLock.packages?.[""] !== undefined) {
      packageLock.packages[""].name = context.packageName;
    }
    await fsPromises.writeFile(
      packageLockPath,
      JSON.stringify(packageLock, null, 2) + "\n",
    );
  }
}

export async function runInstall(projectPath) {
  process.stdout.write("  Installing dependencies...\n");

  const command = npmBinary();
  const args = ["install", "--no-fund", "--no-audit", "--silent"];
  const result = await runCommand(command, args, { cwd: projectPath, retries: 1 });

  if (!result.ok) {
    const output = result.stderr || result.stdout || result.error?.message || "";
    throw new Error(
      `Failed to install dependencies\nCommand: ${commandToString(command, args)}${output ? `\n${output}` : ""}`,
    );
  }

  process.stdout.write(`  ${pc.green("✔")} Dependencies installed\n`);
}

export async function runGitInit(projectPath) {
  const result = await runCommand("git", ["init"], { cwd: projectPath });

  if (!result.ok) {
    process.stdout.write(`  ${pc.yellow("⚠")} Git init skipped\n`);
    return;
  }

  process.stdout.write(`  ${pc.green("✔")} Git repository initialized\n`);
}

export async function runPrismaGenerate(projectPath) {
  process.stdout.write("  Generating Prisma client...\n");

  const npmExecCommand = npmBinary();
  const npmExecArgs = ["exec", "--silent", "prisma", "generate"];
  const npmExecResult = await runCommand(npmExecCommand, npmExecArgs, {
    cwd: projectPath,
  });

  if (npmExecResult.ok) {
    process.stdout.write(`  ${pc.green("✔")} Prisma client generated\n`);
    return;
  }

  const npxCommand = npxBinary();
  const npxArgs = ["--yes", "prisma", "generate"];
  const npxResult = await runCommand(npxCommand, npxArgs, { cwd: projectPath });

  if (!npxResult.ok) {
    const output =
      npxResult.stderr || npxResult.stdout || npxResult.error?.message || "";
    throw new Error(
      `Failed to generate Prisma client. Run manually: npx prisma generate\nCommands tried: ${commandToString(npmExecCommand, npmExecArgs)} | ${commandToString(npxCommand, npxArgs)}${output ? `\n${output}` : ""}`,
    );
  }

  process.stdout.write(`  ${pc.green("✔")} Prisma client generated\n`);
}
