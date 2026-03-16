import { execFileSync } from "node:child_process";
import fs from "node:fs";

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

	try {
		execFileSync("npm", ["install"], { cwd: projectPath, stdio: "inherit" });
	} catch {
		console.error("Failed to install dependencies");
		process.exit(1);
	}
}

export function runPrismaGenerate(projectPath) {
	console.log("Generating Prisma client...");

	try {
		execFileSync("npx", ["prisma", "generate"], { cwd: projectPath, stdio: "inherit" });
	} catch {
		console.error("Failed to generate Prisma client. Run manually: npx prisma generate");
	}
}
