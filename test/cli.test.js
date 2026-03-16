import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cliPath = path.join(process.cwd(), "bin/cli.js");
const cliPackageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
const expectedScaffoldedWith = `adorex-cli@${cliPackageJson.version}`;

function runCli(args, cwd) {
	return spawnSync(process.execPath, [cliPath, ...args], {
		cwd,
		env: {
			...process.env,
			ADOREX_SKIP_SETUP: "1",
		},
		encoding: "utf8",
	});
}

test("cli creates the project files", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adorex-"));
	const projectName = "My App";

	try {
		const result = runCli([projectName], tempDir);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Done! Next steps:/);

		const projectPath = path.join(tempDir, projectName);
		const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf8"));
		const packageLock = JSON.parse(fs.readFileSync(path.join(projectPath, "package-lock.json"), "utf8"));
		const readme = fs.readFileSync(path.join(projectPath, "README.md"), "utf8");

		assert.equal(packageJson.name, "my-app");
		assert.equal(packageJson.adorex.scaffoldedWith, expectedScaffoldedWith);
		assert.equal(packageLock.name, "my-app");
		assert.equal(packageLock.packages[""].name, "my-app");
		assert.match(readme, /^# My App$/m);
		assert.match(readme, new RegExp(`Scaffolded with ${expectedScaffoldedWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
		assert.equal(fs.existsSync(path.join(projectPath, "src/index.ts")), true);
		assert.equal(fs.existsSync(path.join(projectPath, "prisma/schema.prisma")), true);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("cli fails with usage when project name is missing", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adorex-"));

	try {
		const result = runCli([], tempDir);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Usage: npx adorex-cli <project-name>/);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("cli fails when project name is invalid", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adorex-"));

	try {
		const result = runCli(["foo/bar"], tempDir);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Project name must be a single directory name/);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("cli fails when target directory already exists", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adorex-"));
	const projectName = "demo";
	fs.mkdirSync(path.join(tempDir, projectName));

	try {
		const result = runCli([projectName], tempDir);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /already exists/);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});