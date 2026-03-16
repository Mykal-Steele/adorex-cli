#!/usr/bin/env node
import path from "node:path";

import { CLI_PACKAGE_JSON_PATH, TEMPLATE_DIR } from "../lib/constants.js";
import {
	copyTemplate,
	ensureProjectPathAvailable,
	runInstall,
	runPrismaGenerate,
} from "../lib/scaffold.js";
import {
	personalizeTemplate,
	printCliLogo,
	printNextSteps,
	readCliVersion,
	validateProjectName,
	warnIfUnsupportedGeneratedAppNode,
} from "../lib/utils.js";

const cliVersion = readCliVersion(CLI_PACKAGE_JSON_PATH);
const scaffoldedWith = `adorex-cli@${cliVersion}`;

function main() {
	const projectName = process.argv[2]?.trim();
	const skipSetup = process.env.ADOREX_SKIP_SETUP === "1";

	printCliLogo();
	validateProjectName(projectName);
	warnIfUnsupportedGeneratedAppNode();

	const projectPath = path.join(process.cwd(), projectName);
	ensureProjectPathAvailable(projectPath, projectName);
	copyTemplate(TEMPLATE_DIR, projectPath);
	personalizeTemplate(projectPath, projectName, scaffoldedWith);

	console.log(`Created ${projectName}`);
	if (!skipSetup) {
		runInstall(projectPath);
		runPrismaGenerate(projectPath);
	}

	printNextSteps(projectName);
}

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Error: ${message}`);
	process.exit(1);
}
