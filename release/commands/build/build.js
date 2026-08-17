const require_runtime = require("../../_virtual/_rolldown/runtime.js");
const require_constants = require("../../constants.js");
const require_helpers = require("../../helpers.js");
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
let rollup_plugin_filesize = require("rollup-plugin-filesize");
rollup_plugin_filesize = require_runtime.__toESM(rollup_plugin_filesize);
let rollup_plugin_import_assets = require("rollup-plugin-import-assets");
rollup_plugin_import_assets = require_runtime.__toESM(rollup_plugin_import_assets);
let rollup_plugin_polyfill_node = require("rollup-plugin-polyfill-node");
rollup_plugin_polyfill_node = require_runtime.__toESM(rollup_plugin_polyfill_node);
let rollup_plugin_process_env = require("rollup-plugin-process-env");
rollup_plugin_process_env = require_runtime.__toESM(rollup_plugin_process_env);
let rollup_plugin_string = require("rollup-plugin-string");
let rollup_plugin_styles = require("rollup-plugin-styles");
rollup_plugin_styles = require_runtime.__toESM(rollup_plugin_styles);
//#region src/commands/build/build.ts
const copyFiles = (0, require("node:util").promisify)(fs_extra.default.copy);
async function build({ node = false, inject = false, index = "index", typeCheck, lintCheck }, instance) {
	const params = instance.params;
	const input = glob.default.sync(`src/${index}.{${params.indexExt}}`);
	if (!input.length) throw Error("index file is not detected");
	if (typeCheck) await _cantinc_logger.logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		(0, node_child_process.spawn)("tsc", ["--noEmit"], {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
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
	await _cantinc_logger.logger.start("Remove build", () => fs_extra.default.remove(params.buildFolder));
	const pkg = node && await instance.getPackage();
	const plugins = [(0, rollup_plugin_process_env.default)(instance.params.envPrefix, {
		include: input,
		virtual: true
	})];
	const options = {
		input,
		preserveEntrySignatures: "strict",
		plugins
	};
	const outputOptions = {
		dir: params.buildFolder,
		sourcemap: params.sourcemap
	};
	if (node) {
		outputOptions.format = "cjs";
		options.external = Object.keys(pkg?.dependencies || {});
		plugins.push((0, rollup_plugin_string.string)({
			include: "**/*.*",
			exclude: require_constants.stringExcludeNode
		}));
	} else {
		plugins.push((0, rollup_plugin_polyfill_node.default)(), (0, rollup_plugin_import_assets.default)({
			include: require_constants.imageInclude.map((img) => `src/${img}`),
			publicPath: params.baseUrl
		}), (0, rollup_plugin_styles.default)({
			mode: params.cssInJs ? "inject" : "extract",
			url: {
				inline: false,
				publicPath: `${params.baseUrl}assets`
			},
			sass: {
				outputStyle: "compressed",
				silenceDeprecations: ["legacy-js-api"]
			},
			plugins: [(0, autoprefixer.default)()],
			autoModules: params.cssModules ? (id) => !id.includes(".global.") : true,
			sourceMap: params.sourcemap,
			minimize: true
		}), (0, rollup_plugin_string.string)({
			include: "**/*.*",
			exclude: require_constants.stringExcludeDom
		}));
		outputOptions.format = "es";
		outputOptions.plugins = [(0, _rollup_plugin_terser.default)(), (0, rollup_plugin_filesize.default)({ reporter: require_helpers.reporter })];
	}
	await _cantinc_logger.logger.start("Build production bundle", async () => {
		const bundle = await (0, rolldown.rolldown)(options);
		await bundle.write(outputOptions);
		await bundle.close();
		if (!node) {
			await copyFiles(params.publicFolder, params.buildFolder);
			const data = await node_fs.promises.readFile(params.publicIndexFile);
			const pkg = await instance.getPackage();
			await node_fs.promises.writeFile(params.buildIndexFile, await require_helpers.convertIndexFile(data, pkg.version, params.baseUrl, node_path.default.parse(input[0]).name, inject));
		}
	});
	if (pkg) {
		await _cantinc_logger.logger.start("Copy package.json", async () => {
			const data = { ...pkg };
			delete data.private;
			delete data.devDependencies;
			await fs_extra.default.writeFile(node_path.default.resolve(params.buildFolder, "package.json"), JSON.stringify(data, void 0, 2), "UTF-8");
		});
		const pkgLockPath = node_path.default.resolve(params.projectFolder, "package-lock.json");
		if (fs_extra.default.existsSync(pkgLockPath)) await _cantinc_logger.logger.start("Copy package-lock.json", () => {
			return fs_extra.default.copy(pkgLockPath, node_path.default.resolve(params.buildFolder, "package-lock.json"));
		});
	}
}
//#endregion
exports.build = build;
