import { imageInclude, stringExcludeDom, stringExcludeNode } from "../../constants.mjs";
import { convertIndexFile, reporter } from "../../helpers.mjs";
import { logger } from "@cantinc/logger";
import { spawn } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import autoprefixer from "autoprefixer";
import { promises as promises$1 } from "node:fs";
import glob from "glob";
import { rolldown } from "rolldown";
import filesize from "rollup-plugin-filesize";
import importAssets from "rollup-plugin-import-assets";
import polyfill from "rollup-plugin-polyfill-node";
import env from "rollup-plugin-process-env";
import { string } from "rollup-plugin-string";
import styles from "rollup-plugin-styles";
import { promisify } from "node:util";
//#region src/commands/build/build.ts
const copyFiles = promisify(fs.copy);
async function build({ node = false, inject = false, index = "index", typeCheck, lintCheck }, instance) {
	const params = instance.params;
	const input = glob.sync(`src/${index}.{${params.indexExt}}`);
	if (!input.length) throw Error("index file is not detected");
	if (typeCheck) await logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		const params = ["--noEmit"];
		if (instance.params.buildTSConfig) params.push("-p", instance.params.buildTSConfig);
		spawn("tsc", params, {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	if (lintCheck) await logger.start("Check ESLint", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		spawn("eslint", ["src"], {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	await logger.start("Remove build", () => fs.remove(params.buildFolder));
	const pkg = node && await instance.getPackage();
	const plugins = [env(instance.params.envPrefix, {
		include: input,
		virtual: true
	})];
	const options = {
		input,
		preserveEntrySignatures: "strict",
		tsconfig: instance.params.buildTSConfig,
		plugins
	};
	const outputOptions = {
		dir: params.buildFolder,
		sourcemap: params.sourcemap
	};
	if (node) {
		outputOptions.format = "cjs";
		options.external = Object.keys(pkg?.dependencies || {});
		plugins.push(string({
			include: "**/*.*",
			exclude: stringExcludeNode
		}));
	} else {
		plugins.push(polyfill(), importAssets({
			include: imageInclude.map((img) => `src/${img}`),
			publicPath: params.baseUrl
		}), styles({
			mode: params.cssInJs ? "inject" : "extract",
			url: {
				inline: false,
				publicPath: `${params.baseUrl}assets`
			},
			sass: {
				outputStyle: "compressed",
				silenceDeprecations: ["legacy-js-api"]
			},
			plugins: [autoprefixer()],
			autoModules: params.cssModules ? (id) => !id.includes(".global.") : true,
			sourceMap: params.sourcemap,
			minimize: true
		}), string({
			include: "**/*.*",
			exclude: stringExcludeDom
		}));
		outputOptions.format = "es";
		outputOptions.minify = true;
		outputOptions.plugins = [filesize({ reporter })];
	}
	await logger.start("Build production bundle", async () => {
		const bundle = await rolldown(options);
		await bundle.write(outputOptions);
		await bundle.close();
		if (!node) {
			await copyFiles(params.publicFolder, params.buildFolder);
			const data = await promises$1.readFile(params.publicIndexFile);
			const pkg = await instance.getPackage();
			await promises$1.writeFile(params.buildIndexFile, await convertIndexFile(data, pkg.version, params.baseUrl, path.parse(input[0]).name, inject));
		}
	});
	if (pkg) {
		await logger.start("Copy package.json", async () => {
			const data = { ...pkg };
			delete data.private;
			delete data.devDependencies;
			await fs.writeFile(path.resolve(params.buildFolder, "package.json"), JSON.stringify(data, void 0, 2), "UTF-8");
		});
		const pkgLockPath = path.resolve(params.projectFolder, "package-lock.json");
		if (fs.existsSync(pkgLockPath)) await logger.start("Copy package-lock.json", () => {
			return fs.copy(pkgLockPath, path.resolve(params.buildFolder, "package-lock.json"));
		});
	}
}
//#endregion
export { build };
