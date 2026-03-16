#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, "../template");
const cliPackageJsonPath = path.join(__dirname, "../package.json");
const cliVersion = readCliVersion();
const scaffoldedWith = `adorex-cli@${cliVersion}`;
const projectName = process.argv[2]?.trim();
const skipSetup = process.env.ADOREX_SKIP_SETUP === "1";

if (!projectName) {
	console.error("Usage: npx adorex-cli <project-name>");
	process.exit(1);
}

if (projectName === "." || projectName === ".." || /[\\/]/.test(projectName)) {
	console.error("Project name must be a single directory name.");
	process.exit(1);
}

const projectPath = path.join(process.cwd(), projectName);

if (fs.existsSync(projectPath)) {
	console.error(`Error: Directory '${projectName}' already exists`);
	process.exit(1);
}

fs.cpSync(templateDir, projectPath, { recursive: true });
personalizeTemplate(projectPath, projectName);

console.log(`Created ${projectName}`);
if (!skipSetup) {
	console.log("Installing dependencies...");

	try {
		execFileSync("npm", ["install"], { cwd: projectPath, stdio: "inherit" });
	} catch {
		console.error("Failed to install dependencies");
		process.exit(1);
	}

	console.log("Generating Prisma client...");

	try {
		execFileSync("npx", ["prisma", "generate"], { cwd: projectPath, stdio: "inherit" });
	} catch {
		console.error("Failed to generate Prisma client. Run manually: npx prisma generate");
	}
}

console.log("");
console.log("Done! Next steps:");
console.log("");
console.log(`  cd ${projectName}`);
console.log("  npx prisma migrate dev --name init");
console.log("  npm run dev");
console.log("");

function personalizeTemplate(targetPath, appName) {
	const packageJsonPath = path.join(targetPath, "package.json");
	const packageLockPath = path.join(targetPath, "package-lock.json");
	const readmePath = path.join(targetPath, "README.md");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const packageName = toPackageName(appName);

	packageJson.name = packageName;
	packageJson.adorex = {
		scaffoldedWith,
	};

	fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

	if (fs.existsSync(packageLockPath)) {
		const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
		packageLock.name = packageName;

		if (packageLock.packages && packageLock.packages[""]) {
			packageLock.packages[""].name = packageName;
		}

		fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
	}

	const readme = fs.readFileSync(readmePath, "utf8").replace("# Adorex App", `# ${appName}`);
	const readmeWithProvenance = `${readme}\n\n> Scaffolded with ${scaffoldedWith}\n`;
	fs.writeFileSync(readmePath, readmeWithProvenance);
}

function toPackageName(appName) {
	const packageName = appName
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^[._-]+|[._-]+$/g, "")
		.replace(/[._-]{2,}/g, "-");

	return packageName || "adorex-app";
}

function readCliVersion() {
	try {
		const cliPackageJson = JSON.parse(fs.readFileSync(cliPackageJsonPath, "utf8"));
		return cliPackageJson.version || "unknown";
	} catch {
		return "unknown";
	}
}
