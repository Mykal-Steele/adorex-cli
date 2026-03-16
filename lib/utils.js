import fs from "node:fs";
import path from "node:path";

const SUPPORTED_GENERATED_APP_NODE_RANGES = [
	{ major: 20, minMinor: 19 },
	{ major: 22, minMinor: 12 },
	{ major: 24, minMinor: 0 },
];

const CLI_LOGO_LINES = [
	"    ___       __          _      ",
	"   /   | ____/ /___  ____(_)___  ",
	"  / /| |/ __  / __ \\/ __/ / __ \\ ",
	" / ___ / /_/ / /_/ / / / / /_/ / ",
	"/_/  |_|\\__,_/\\____/_/ /_/\\____/  ",
	"         _________  ____  ________",
	"        / ___/ __ \\/ __ ` / ___/ _ \\",
	"       (__  ) /_/ / /_/ / /__/ __/",
	"      /____/ .___/\\__,_/\\___/\\___/ ",
	"          /_/                    ",
];

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

export function printCliLogo() {
	console.log(CLI_LOGO_LINES.join("\n"));
}

export function parseNodeVersion(version = process.versions.node) {
	const [majorRaw = "0", minorRaw = "0", patchRaw = "0"] = String(version).split(".");

	return {
		major: Number.parseInt(majorRaw, 10) || 0,
		minor: Number.parseInt(minorRaw, 10) || 0,
		patch: Number.parseInt(patchRaw, 10) || 0,
	};
}

export function isGeneratedAppNodeVersionSupported(version = process.versions.node) {
	const parsed = parseNodeVersion(version);

	return SUPPORTED_GENERATED_APP_NODE_RANGES.some(
		(range) => parsed.major === range.major && parsed.minor >= range.minMinor,
	);
}

export function getGeneratedAppNodeSupportText() {
	return "^20.19 || ^22.12 || ^24.0";
}

export function warnIfUnsupportedGeneratedAppNode(version = process.versions.node) {
	if (isGeneratedAppNodeVersionSupported(version)) {
		return true;
	}

	console.warn("");
	console.warn(
		`Warning: This template is tested with Node ${getGeneratedAppNodeSupportText()} (current: ${version}).`,
	);
	console.warn("If you hit runtime issues, switch to one of those Node LTS versions.");
	console.warn("");

	return false;
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
