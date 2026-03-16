#!/usr/bin/env node
import path from "node:path";
import { cac } from "cac";
import { cancel, intro, isCancel, note, text } from "@clack/prompts";
import boxen from "boxen";
import logSymbols from "log-symbols";
import pc from "picocolors";
import updateNotifier from "update-notifier-cjs";

import { CLI_PACKAGE_JSON_PATH, TEMPLATE_DIR } from "../lib/constants.js";
import {
	copyTemplate,
	ensureProjectPathAvailable,
	renderTemplateFiles,
	runGitInit,
	runInstall,
	runPrismaGenerate,
} from "../lib/scaffold.js";
import {
	printCliLogo,
	printNextSteps,
	readCliVersion,
	toPackageName,
	validateProjectName,
	warnIfUnsupportedGeneratedAppNode,
} from "../lib/utils.js";

const cliVersion = readCliVersion(CLI_PACKAGE_JSON_PATH);
const scaffoldedWith = `adorex-cli@${cliVersion}`;

function maybeNotifyUpdates() {
	if (process.env.ADOREX_DISABLE_UPDATE_NOTIFIER === "1") {
		return;
	}

	try {
		const notifier = updateNotifier({
			pkg: {
				name: "adorex-cli",
				version: cliVersion,
			},
			updateCheckInterval: 1000 * 60 * 60 * 6,
		});

		notifier.notify({ isGlobal: true, defer: true });
	} catch {
		// Never block scaffolding because of update checks.
	}
}

async function resolveProjectName(initialName) {
	const providedName = String(initialName ?? "").trim();
	if (providedName) {
		return providedName;
	}

	if (!(process.stdin.isTTY && process.stdout.isTTY)) {
		return "";
	}

	const answer = await text({
		message: "Project name",
		placeholder: "my-app",
	});

	if (isCancel(answer)) {
		throw new Error("Operation cancelled by user.");
	}

	return String(answer).trim();
}

async function scaffold(projectName) {
	const skipSetup = process.env.ADOREX_SKIP_SETUP === "1";
	const appName = validateProjectName(projectName);
	const packageName = toPackageName(appName);
	const nodeWarning = warnIfUnsupportedGeneratedAppNode();

	printCliLogo();
	intro(pc.cyan("Scaffolding your Adorex app"));
	maybeNotifyUpdates();
	if (nodeWarning) {
		note(nodeWarning, "Node compatibility");
	}

	const projectPath = path.join(process.cwd(), appName);
	ensureProjectPathAvailable(projectPath, appName);
	await copyTemplate(TEMPLATE_DIR, projectPath);
	await renderTemplateFiles(projectPath, {
		appName,
		packageName,
		scaffoldedWith,
	});

	console.log(`${logSymbols.success} ${pc.green(`Created ${appName}`)}`);
	if (!skipSetup) {
		await runGitInit(projectPath);
		await runInstall(projectPath);
		await runPrismaGenerate(projectPath);
	}

	printNextSteps(appName);
	console.log(
		boxen(`${logSymbols.success} ${appName} is ready to go`, {
			padding: 1,
			margin: 1,
			borderStyle: "round",
			borderColor: "green",
		}),
	);
}

async function main() {
	const cli = cac("adorex");
	cli.version(cliVersion, "-v, --version");
	cli.help();

	let projectNameFromArgs;
	cli
		.command("[project-name]", "Scaffold a new Express + TypeScript + Prisma app")
		.action(async (projectName) => {
			projectNameFromArgs = projectName;
		});

	const parsed = cli.parse();
	if (parsed.options?.help || parsed.options?.version) {
		return;
	}

	const projectName = await resolveProjectName(projectNameFromArgs);
	await scaffold(projectName);
}

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	cancel(message);
	note("Scaffolding was aborted before completion.", "Status");
	process.exitCode = 1;
}
