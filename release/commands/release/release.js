const require_runtime = require("../../_virtual/_rolldown/runtime.js");
const require_constants = require("../../constants.js");
const require_getNpmTag = require("../../utils/getNpmTag/getNpmTag.js");
require("../../utils/index.js");
let _cantinc_logger = require("@cantinc/logger");
let node_child_process = require("node:child_process");
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
let _rollup_plugin_terser = require("@rollup/plugin-terser");
_rollup_plugin_terser = require_runtime.__toESM(_rollup_plugin_terser);
let autoprefixer = require("autoprefixer");
autoprefixer = require_runtime.__toESM(autoprefixer);
let node_fs = require("node:fs");
let glob = require("glob");
glob = require_runtime.__toESM(glob);
let rolldown = require("rolldown");
let rollup_plugin_process_env = require("rollup-plugin-process-env");
rollup_plugin_process_env = require_runtime.__toESM(rollup_plugin_process_env);
let rollup_plugin_string = require("rollup-plugin-string");
let rollup_plugin_styles = require("rollup-plugin-styles");
rollup_plugin_styles = require_runtime.__toESM(rollup_plugin_styles);
let node_util = require("node:util");
let _rollup_plugin_image = require("@rollup/plugin-image");
_rollup_plugin_image = require_runtime.__toESM(_rollup_plugin_image);
let rollup_plugin_external_node_modules = require("rollup-plugin-external-node-modules");
rollup_plugin_external_node_modules = require_runtime.__toESM(rollup_plugin_external_node_modules);
let rollup_plugin_node_externals = require("rollup-plugin-node-externals");
let rollup_plugin_preserve_shebangs = require("rollup-plugin-preserve-shebangs");
//#region src/commands/release/release.ts
const execAsync = (0, node_util.promisify)(node_child_process.exec);
async function release({ index = "index", pub, min, typeCheck, lintCheck }, instance) {
	const { releaseFolder, cssModules } = instance.params;
	if (lintCheck) await _cantinc_logger.logger.start("Check ESLint", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		(0, node_child_process.spawn)("eslint", ["src"], {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	await _cantinc_logger.logger.start("Remove previous release", () => fs_extra.default.remove(releaseFolder));
	if (typeCheck) await _cantinc_logger.logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		const params = [
			"--emitDeclarationOnly",
			"--outDir",
			releaseFolder
		];
		if (instance.params.tsconfig) params.push("-p", instance.params.tsconfig);
		(0, node_child_process.spawn)("tsc", params, {
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
		const input = glob.default.sync(`src/${index}.{${instance.params.indexExt}}`);
		if (!input.length) throw Error("index file is not detected");
		const output = format === "iife" ? {
			file: node_path.default.join(releaseFolder, pkg.browser || "index.min.js"),
			codeSplitting: false,
			name: pkg.browserName || pkg.name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")
		} : {
			dir: releaseFolder,
			preserveModules: true,
			exports: "named",
			entryFileNames: ({ name, facadeModuleId }) => {
				if (require_constants.REG_TJSX.test(facadeModuleId)) return `${name}${ext}`;
				const match = facadeModuleId.match(require_constants.REG_EXT);
				return match ? `${name}${match[0]}${ext}` : `${name}${ext}`;
			}
		};
		const plugins = [
			(0, rollup_plugin_node_externals.externals)(),
			(0, rollup_plugin_string.string)({
				include: "**/*.*",
				exclude: require_constants.stringExcludeDom
			}),
			(0, _rollup_plugin_image.default)(),
			(0, rollup_plugin_styles.default)({
				mode: instance.params.cssInJs ? "inject" : "extract",
				plugins: [(0, autoprefixer.default)()],
				autoModules: cssModules ? (id) => !id.includes(".global.") : true,
				minimize: true
			}),
			(0, rollup_plugin_external_node_modules.default)(),
			(0, rollup_plugin_process_env.default)(instance.params.envPrefix, {
				include: input,
				virtual: true
			})
		];
		const options = {
			input,
			external: ["tslib"],
			treeshake: false,
			output: {
				...output,
				format
			},
			plugins
		};
		if (format === "iife") plugins.push((0, _rollup_plugin_terser.default)());
		const bundle = await (0, rolldown.rolldown)(options);
		await bundle.write(options.output);
		await bundle.close();
	};
	if (!pkg.type || pkg.type === "commonjs") await _cantinc_logger.logger.start("Build cjs bundle", async () => {
		await build("cjs");
	});
	if (!pkg.type || pkg.type === "module") await _cantinc_logger.logger.start("Build es6 bundle", async () => {
		await build("es");
	});
	if (min) await _cantinc_logger.logger.start("Build min bundle", async () => {
		await build("iife");
	});
	await _cantinc_logger.logger.start("Copy package.json", async () => {
		const data = { ...pkg };
		delete data.private;
		delete data.devDependencies;
		fs_extra.default.writeFile(node_path.default.resolve(instance.params.releaseFolder, "package.json"), JSON.stringify(data, void 0, 2), "UTF-8");
	});
	if (pkg.bin) await _cantinc_logger.logger.start("Build bin", async () => {
		const { bin, type } = pkg;
		for (const name in bin) {
			const value = bin[name];
			const input = glob.default.sync(`src/${value}.{${instance.params.indexExt}}`);
			const file = node_path.default.join(instance.params.releaseFolder, value);
			const plugins = [
				(0, rollup_plugin_preserve_shebangs.preserveShebangs)(),
				(0, rollup_plugin_node_externals.externals)(),
				(0, rollup_plugin_process_env.default)(instance.params.envPrefix, { include: input })
			];
			const options = {
				input,
				external: [...Object.keys(pkg.dependencies), "tslib"],
				output: {
					file,
					format: type === "module" ? "es" : "cjs"
				},
				plugins
			};
			const bundle = await (0, rolldown.rolldown)(options);
			await bundle.write(options.output);
			await bundle.close();
		}
	});
	if (fs_extra.default.existsSync(instance.params.licenseFile)) await _cantinc_logger.logger.start("Copy license", async () => {
		await node_fs.promises.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile);
	});
	if (fs_extra.default.existsSync(instance.params.readmeFile)) await _cantinc_logger.logger.start("Copy readme", async () => {
		await node_fs.promises.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile);
	});
	if (fs_extra.default.existsSync(instance.params.declarationFile)) await _cantinc_logger.logger.start("Copy declaration", async () => {
		await node_fs.promises.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile);
	});
	if (pub) {
		const date = Date.now() / 1e3 | 0;
		await _cantinc_logger.logger.start(`publishing v${pkg.version} ${date}`, async () => {
			await execAsync(`npm publish ${instance.params.releaseFolder} --tag ${require_getNpmTag.getNpmTag(pkg.version)}`);
		});
	}
}
//#endregion
exports.release = release;
