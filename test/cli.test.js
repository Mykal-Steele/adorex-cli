import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { CLI_PACKAGE_JSON_PATH, TEMPLATE_DIR } from "../lib/constants.js";
import { readCliVersion, toPackageName } from "../lib/utils.js";

const cliPath = path.join(process.cwd(), "bin/cli.js");
const cliPackageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
const expectedScaffoldedWith = `adorex-cli@${cliPackageJson.version}`;
const expectedScaffoldedWithRegex = new RegExp(`Scaffolded with ${escapeRegex(expectedScaffoldedWith)}`);

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

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

function withTempDir(fn) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adorex-"));

	try {
		fn(tempDir);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

test("creates a scaffolded project", () => {
	withTempDir((tempDir) => {
		const projectName = "My App";
		const result = runCli([projectName], tempDir);

		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Done! Next steps:/);

		const projectPath = path.join(tempDir, projectName);
		const packageJson = readJson(path.join(projectPath, "package.json"));
		const packageLock = readJson(path.join(projectPath, "package-lock.json"));
		const readme = fs.readFileSync(path.join(projectPath, "README.md"), "utf8");

		assert.equal(packageJson.name, "my-app");
		assert.equal(packageJson.adorex.scaffoldedWith, expectedScaffoldedWith);
		assert.equal(packageLock.name, "my-app");
		assert.equal(packageLock.packages[""].name, "my-app");
		assert.match(readme, /^# My App$/m);
		assert.match(readme, expectedScaffoldedWithRegex);
		assert.equal(fs.existsSync(path.join(projectPath, "src/index.ts")), true);
		assert.equal(fs.existsSync(path.join(projectPath, "prisma/schema.prisma")), true);
	});
});

test("shows usage when project name is missing", () => {
	withTempDir((tempDir) => {
		const result = runCli([], tempDir);

		assert.equal(result.status, 1);
		assert.match(result.stderr, /Usage: npx adorex-cli <project-name>/);
	});
});

test("rejects project names that include a slash", () => {
	withTempDir((tempDir) => {
		const result = runCli(["foo/bar"], tempDir);

		assert.equal(result.status, 1);
		assert.match(result.stderr, /Project name must be a single directory name/);
	});
});

test("fails if target directory already exists", () => {
	withTempDir((tempDir) => {
		const projectName = "demo";
		fs.mkdirSync(path.join(tempDir, projectName));

		const result = runCli([projectName], tempDir);

		assert.equal(result.status, 1);
		assert.match(result.stderr, /already exists/);
	});
});

test("utils readCliVersion returns the current package version", () => {
	assert.equal(readCliVersion(CLI_PACKAGE_JSON_PATH), cliPackageJson.version);
});

test("utils readCliVersion returns unknown for missing package file", () => {
	const missingPath = path.join(os.tmpdir(), `adorex-missing-${Date.now()}.json`);
	assert.equal(readCliVersion(missingPath), "unknown");
});

test("utils toPackageName normalizes names", () => {
	assert.equal(toPackageName("My App"), "my-app");
	assert.equal(toPackageName("__Demo..App__"), "demo-app");
	assert.equal(toPackageName("***"), "adorex-app");
});

test("constants resolve to existing template and package paths", () => {
	assert.equal(fs.existsSync(TEMPLATE_DIR), true);
	assert.equal(fs.existsSync(CLI_PACKAGE_JSON_PATH), true);
});