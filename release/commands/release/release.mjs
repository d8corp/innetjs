import { REG_EXT, REG_TJSX, stringExcludeDom } from "../../constants.mjs";
import { getNpmTag } from "../../utils/getNpmTag/getNpmTag.mjs";
import "../../utils/index.mjs";
import { logger } from "@cantinc/logger";
import { exec, spawn } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import autoprefixer from "autoprefixer";
import { promises as promises$1 } from "node:fs";
import glob from "glob";
import { rolldown } from "rolldown";
import env from "rollup-plugin-process-env";
import { string } from "rollup-plugin-string";
import styles from "rollup-plugin-styles";
import { promisify } from "node:util";
import image from "@rollup/plugin-image";
import external from "rollup-plugin-external-node-modules";
import { externals } from "rollup-plugin-node-externals";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
//#region src/commands/release/release.ts
const execAsync = promisify(exec);
async function release({ index = "index", pub, min, typeCheck, lintCheck }, instance) {
	const { releaseFolder, cssModules } = instance.params;
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
	await logger.start("Remove previous release", () => fs.remove(releaseFolder));
	if (typeCheck) await logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		const params = [
			"--emitDeclarationOnly",
			"--outDir",
			releaseFolder
		];
		if (instance.params.releaseTSConfig) params.push("-p", instance.params.releaseTSConfig);
		spawn("tsc", params, {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	const pkg = await instance.getPackage();
	const build = async (format) => {
		const ext = format === "es" ? (pkg.module || pkg.esnext || pkg["jsnext:main"])?.replace("index", "") || ".mjs" : pkg.main?.replace("index", "") || ".js";
		const input = glob.sync(`src/${index}.{${instance.params.indexExt}}`);
		if (!input.length) throw Error("index file is not detected");
		const output = format === "iife" ? {
			file: path.join(releaseFolder, pkg.browser || "index.min.js"),
			codeSplitting: false,
			minify: true,
			name: pkg.browserName || pkg.name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")
		} : {
			dir: releaseFolder,
			preserveModules: true,
			exports: "named",
			entryFileNames: ({ name, facadeModuleId }) => {
				if (REG_TJSX.test(facadeModuleId)) return `${name}${ext}`;
				const match = facadeModuleId.match(REG_EXT);
				return match ? `${name}${match[0]}${ext}` : `${name}${ext}`;
			}
		};
		const plugins = [
			externals(),
			string({
				include: "**/*.*",
				exclude: stringExcludeDom
			}),
			image(),
			styles({
				mode: instance.params.cssInJs ? "inject" : "extract",
				plugins: [autoprefixer()],
				autoModules: cssModules ? (id) => !id.includes(".global.") : true,
				minimize: true
			}),
			external(),
			env(instance.params.envPrefix, {
				include: input,
				virtual: true
			})
		];
		const options = {
			input,
			external: ["tslib"],
			treeshake: false,
			tsconfig: instance.params.releaseTSConfig,
			output: {
				...output,
				format
			},
			plugins
		};
		const bundle = await rolldown(options);
		await bundle.write(options.output);
		await bundle.close();
	};
	if (!pkg.type || pkg.type === "commonjs") await logger.start("Build cjs bundle", async () => {
		await build("cjs");
	});
	if (!pkg.type || pkg.type === "module") await logger.start("Build es6 bundle", async () => {
		await build("es");
	});
	if (min) await logger.start("Build min bundle", async () => {
		await build("iife");
	});
	await logger.start("Copy package.json", async () => {
		const data = { ...pkg };
		delete data.private;
		delete data.devDependencies;
		fs.writeFile(path.resolve(instance.params.releaseFolder, "package.json"), JSON.stringify(data, void 0, 2), "UTF-8");
	});
	if (pkg.bin) await logger.start("Build bin", async () => {
		const { bin, type } = pkg;
		for (const name in bin) {
			const value = bin[name];
			const input = glob.sync(`src/${value}.{${instance.params.indexExt}}`);
			const file = path.join(instance.params.releaseFolder, value);
			const plugins = [
				preserveShebangs(),
				externals(),
				env(instance.params.envPrefix, { include: input })
			];
			const options = {
				input,
				external: [...Object.keys(pkg.dependencies), "tslib"],
				tsconfig: instance.params.releaseTSConfig,
				output: {
					file,
					format: type === "module" ? "es" : "cjs"
				},
				plugins
			};
			const bundle = await rolldown(options);
			await bundle.write(options.output);
			await bundle.close();
		}
	});
	if (fs.existsSync(instance.params.licenseFile)) await logger.start("Copy license", async () => {
		await promises$1.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile);
	});
	if (fs.existsSync(instance.params.readmeFile)) await logger.start("Copy readme", async () => {
		await promises$1.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile);
	});
	if (fs.existsSync(instance.params.declarationFile)) await logger.start("Copy declaration", async () => {
		await promises$1.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile);
	});
	if (pub) {
		const date = Date.now() / 1e3 | 0;
		await logger.start(`publishing v${pkg.version} ${date}`, async () => {
			await execAsync(`npm publish ${instance.params.releaseFolder} --tag ${getNpmTag(pkg.version)}`);
		});
	}
}
//#endregion
export { release };
