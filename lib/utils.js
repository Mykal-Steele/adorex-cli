import fs from "node:fs";
import semver from "semver";
import validatePackageName from "validate-npm-package-name";

const SUPPORTED_GENERATED_APP_NODE_RANGE = ">=22.12.0 <23.0.0 || >=24.0.0 <25.0.0";
const SUPPORTED_GENERATED_APP_NODE_TEXT = "^22.12 || ^24.0";

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
		throw new Error("Usage: npx adorex-cli <project-name>");
	}

	if (name === "." || name === ".." || /[\\/]/.test(name)) {
		throw new Error("Project name must be a single directory name.");
	}

	const packageName = toPackageName(name);
	const validation = validatePackageName(packageName);
	if (!validation.validForNewPackages) {
		throw new Error("Project name must be a single directory name.");
	}

	return name;
}

export function printCliLogo() {
	console.log(CLI_LOGO_LINES.join("\n"));
}

export function parseNodeVersion(version = process.versions.node) {
	const parsed = semver.coerce(String(version));
	if (!parsed) {
		return { major: 0, minor: 0, patch: 0 };
	}

	return {
		major: parsed.major,
		minor: parsed.minor,
		patch: parsed.patch,
	};
}

export function isGeneratedAppNodeVersionSupported(version = process.versions.node) {
	const normalizedVersion = semver.coerce(String(version));
	if (!normalizedVersion) {
		return false;
	}

	return semver.satisfies(normalizedVersion, SUPPORTED_GENERATED_APP_NODE_RANGE);
}

export function getGeneratedAppNodeSupportText() {
	return SUPPORTED_GENERATED_APP_NODE_TEXT;
}

export function warnIfUnsupportedGeneratedAppNode(version = process.versions.node) {
	if (isGeneratedAppNodeVersionSupported(version)) {
		return null;
	}

	return `Warning: Template is tested with Node ${getGeneratedAppNodeSupportText()} (current: ${version}).\nIf you hit issues, switch to a supported LTS version.`;
}

export function printNextSteps(projectName) {
	const shellSafeProjectName = String(projectName).replace(/"/g, '\\"');
	console.log(
		`\nNext steps:\n\n  cd "${shellSafeProjectName}"\n  npx prisma migrate dev --name init\n  npm run dev\n`,
	);
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
