import { imageInclude, stringExcludeDom, stringExcludeNode } from "../../constants.mjs";
import { logger } from "@cantinc/logger";
import { spawn } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import autoprefixer from "autoprefixer";
import glob from "glob";
import { watch } from "rolldown";
import importAssets from "rollup-plugin-import-assets";
import polyfill from "rollup-plugin-polyfill-node";
import env from "rollup-plugin-process-env";
import { string } from "rollup-plugin-string";
import styles from "rollup-plugin-styles";
import livereload from "rollup-plugin-livereload";
//#region src/commands/start/start.ts
function typecheckWatchPlugin(instance) {
	let tscProcess = null;
	return {
		name: "type-check",
		writeBundle() {
			if (tscProcess) {
				logger.end("Check TypeScript");
				tscProcess.kill();
			}
			logger.start("Check TypeScript");
			const params = ["--noEmit"];
			if (instance.params.startTSConfig) params.push("-p", instance.params.startTSConfig);
			tscProcess = spawn("tsc", params, {
				stdio: "inherit",
				shell: true
			});
			tscProcess.on("close", (code) => {
				logger.end("Check TypeScript", code ? "TypeScript has errors" : void 0);
			});
		}
	};
}
function lintCheckWatchPlugin() {
	let lintProcess = null;
	return {
		name: "lint-check",
		writeBundle() {
			if (lintProcess) {
				logger.end("Check ESLint");
				lintProcess.kill();
			}
			logger.start("Check ESLint");
			lintProcess = spawn("eslint", ["src"], {
				stdio: "inherit",
				shell: true
			});
			lintProcess.on("close", (code) => {
				logger.end("Check ESLint", code ? "ESLint has errors" : void 0);
			});
		}
	};
}
async function start({ node = false, inject = false, error = false, typeCheck = false, lintCheck = false, usualConsoleOutput = false, index = "index" }, instance) {
	const params = instance.params;
	const pkg = await instance.getPackage();
	const input = glob.sync(`src/${index}.{${params.indexExt}}`);
	if (!input.length) throw Error("index file is not detected");
	await logger.start("Remove build", () => fs.remove(params.devBuildFolder));
	const plugins = [];
	const output = {
		dir: params.devBuildFolder,
		sourcemap: true
	};
	const options = {
		input,
		preserveEntrySignatures: "strict",
		output,
		plugins,
		tsconfig: instance.params.startTSConfig
	};
	let preset;
	if (node) {
		preset = { NODE_ENV: "dev" };
		output.format = "cjs";
		options.external = Object.keys(pkg?.dependencies || {});
		plugins.push(string({
			include: "**/*.*",
			exclude: stringExcludeNode
		}), instance.createServer(input, error, usualConsoleOutput));
	} else {
		const key = path.basename(params.sslKey) !== params.sslKey ? params.sslKey : fs.existsSync(params.sslKey) ? fs.readFileSync(params.sslKey) : void 0;
		const cert = path.basename(params.sslCrt) !== params.sslCrt ? params.sslCrt : fs.existsSync(params.sslCrt) ? fs.readFileSync(params.sslCrt) : void 0;
		output.format = "es";
		plugins.push(polyfill(), importAssets({
			include: imageInclude.map((img) => `src/${img}`),
			publicPath: params.baseUrl
		}), styles({
			mode: params.cssInJs ? "inject" : "extract",
			url: {
				inline: false,
				publicPath: `${params.baseUrl}assets`
			},
			sass: { silenceDeprecations: ["legacy-js-api"] },
			plugins: [autoprefixer()],
			autoModules: params.cssModules ? (id) => !id.includes(".global.") : true,
			sourceMap: true
		}), string({
			include: "**/*.*",
			exclude: stringExcludeDom
		}), instance.createClient(key, cert, pkg, path.parse(input[0]).name, inject), livereload({
			exts: [
				"html",
				"css",
				"js",
				"png",
				"svg",
				"webp",
				"gif",
				"jpg",
				"json"
			],
			watch: [params.devBuildFolder, params.publicFolder],
			verbose: false,
			...key && cert ? { https: {
				key,
				cert
			} } : {}
		}));
	}
	if (typeCheck) plugins.push(typecheckWatchPlugin(instance));
	if (lintCheck) plugins.push(lintCheckWatchPlugin());
	plugins.push(env(instance.params.envPrefix, {
		include: input,
		virtual: true,
		preset
	}));
	watch(options).on("event", async (e) => {
		if (e.code === "ERROR") logger.end("Bundling", error ? e.error.stack : e.error.message);
		else if (e.code === "BUNDLE_START") logger.start("Bundling");
		else if (e.code === "BUNDLE_END") logger.end("Bundling");
	});
}
//#endregion
export { lintCheckWatchPlugin, start, typecheckWatchPlugin };
