import fs from "node:fs";
import path from "node:path";

export function validateProjectName(name) {
	if (!name) {
		console.error("Usage: npx adorex-cli <project-name>");
		process.exit(1);
	}

	if (name === "." || name === ".." || /[\\/]/.test(name)) {
		console.error("Project name must be a single directory name.");
		process.exit(1);
	}
}

export function printNextSteps(projectName) {
	console.log("");
	console.log("Done! Next steps:");
	console.log("");
	console.log(`  cd ${projectName}`);
	console.log("  npx prisma migrate dev --name init");
	console.log("  npm run dev");
	console.log("");
}

export function personalizeTemplate(targetPath, appName, scaffoldedWith) {
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
	fs.writeFileSync(readmePath, `${readme}\n\n> Scaffolded with ${scaffoldedWith}\n`);
}

export function toPackageName(appName) {
	const name = appName
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^[._-]+|[._-]+$/g, "")
		.replace(/[._-]{2,}/g, "-");

	return name || "adorex-app";
}

export function readCliVersion(cliPackageJsonPath) {
	try {
		const pkg = JSON.parse(fs.readFileSync(cliPackageJsonPath, "utf8"));
		return pkg.version || "unknown";
	} catch {
		return "unknown";
	}
}
