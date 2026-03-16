import { execFileSync } from "node:child_process";
import fs from "node:fs";

function npmBinary() {
	return process.platform === "win32" ? "npm.cmd" : "npm";
}

function npxBinary() {
	return process.platform === "win32" ? "npx.cmd" : "npx";
}

function runCommand(command, args, options = {}) {
	const { retries = 0 } = options;
	let lastError;

	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			execFileSync(command, args, options.exec ?? {});
			return { ok: true };
		} catch (error) {
			lastError = error;
			if (attempt === retries) {
				return { ok: false, error: lastError };
			}
		}
	}

	return { ok: false, error: lastError };
}

function commandToString(command, args) {
	return [command, ...args].join(" ");
}

export function ensureProjectPathAvailable(projectPath, projectName) {
	if (fs.existsSync(projectPath)) {
		console.error(`Error: Directory '${projectName}' already exists`);
		process.exit(1);
	}
}

export function copyTemplate(templateDir, projectPath) {
	fs.cpSync(templateDir, projectPath, { recursive: true });
}

export function runInstall(projectPath) {
	console.log("Installing dependencies...");

	const command = npmBinary();
	const args = ["install", "--no-fund", "--no-audit"];
	const result = runCommand(command, args, {
		retries: 1,
		exec: { cwd: projectPath, stdio: "inherit" },
	});

	if (!result.ok) {
		console.error("Failed to install dependencies");
		console.error(`Command: ${commandToString(command, args)}`);
		if (result.error?.message) {
			console.error(`Cause: ${result.error.message}`);
		}
		process.exit(1);
	}
}

export function runPrismaGenerate(projectPath) {
	console.log("Generating Prisma client...");

	const execOptions = { cwd: projectPath, stdio: "inherit" };
	const npmExecCommand = npmBinary();
	const npmExecArgs = ["exec", "prisma", "generate"];
	const npmExecResult = runCommand(npmExecCommand, npmExecArgs, { exec: execOptions });

	if (npmExecResult.ok) {
		return;
	}

	const npxCommand = npxBinary();
	const npxArgs = ["prisma", "generate"];
	const npxResult = runCommand(npxCommand, npxArgs, { exec: execOptions });

	if (!npxResult.ok) {
		console.error("Failed to generate Prisma client. Run manually: npx prisma generate");
		console.error(
			`Commands tried: ${commandToString(npmExecCommand, npmExecArgs)} | ${commandToString(npxCommand, npxArgs)}`,
		);
		if (npxResult.error?.message) {
			console.error(`Cause: ${npxResult.error.message}`);
		}
	}
}
