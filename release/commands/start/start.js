const require_runtime = require("../../_virtual/_rolldown/runtime.js");
const require_constants = require("../../constants.js");
let _cantinc_logger = require("@cantinc/logger");
let node_child_process = require("node:child_process");
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
let autoprefixer = require("autoprefixer");
autoprefixer = require_runtime.__toESM(autoprefixer);
let glob = require("glob");
glob = require_runtime.__toESM(glob);
let rolldown = require("rolldown");
let rollup_plugin_import_assets = require("rollup-plugin-import-assets");
rollup_plugin_import_assets = require_runtime.__toESM(rollup_plugin_import_assets);
let rollup_plugin_polyfill_node = require("rollup-plugin-polyfill-node");
rollup_plugin_polyfill_node = require_runtime.__toESM(rollup_plugin_polyfill_node);
let rollup_plugin_process_env = require("rollup-plugin-process-env");
rollup_plugin_process_env = require_runtime.__toESM(rollup_plugin_process_env);
let rollup_plugin_string = require("rollup-plugin-string");
let rollup_plugin_styles = require("rollup-plugin-styles");
rollup_plugin_styles = require_runtime.__toESM(rollup_plugin_styles);
let rollup_plugin_livereload = require("rollup-plugin-livereload");
rollup_plugin_livereload = require_runtime.__toESM(rollup_plugin_livereload);
//#region src/commands/start/start.ts
function typecheckWatchPlugin(instance) {
	let tscProcess = null;
	return {
		name: "type-check",
		writeBundle() {
			if (tscProcess) {
				_cantinc_logger.logger.end("Check TypeScript");
				tscProcess.kill();
			}
			_cantinc_logger.logger.start("Check TypeScript");
			const params = ["--noEmit"];
			if (instance.params.startTSConfig) params.push("-p", instance.params.startTSConfig);
			tscProcess = (0, node_child_process.spawn)("tsc", params, {
				stdio: "inherit",
				shell: true
			});
			tscProcess.on("close", (code) => {
				_cantinc_logger.logger.end("Check TypeScript", code ? "TypeScript has errors" : void 0);
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
				_cantinc_logger.logger.end("Check ESLint");
				lintProcess.kill();
			}
			_cantinc_logger.logger.start("Check ESLint");
			lintProcess = (0, node_child_process.spawn)("eslint", ["src"], {
				stdio: "inherit",
				shell: true
			});
			lintProcess.on("close", (code) => {
				_cantinc_logger.logger.end("Check ESLint", code ? "ESLint has errors" : void 0);
			});
		}
	};
}
async function start({ node = false, inject = false, error = false, typeCheck = false, lintCheck = false, usualConsoleOutput = false, index = "index" }, instance) {
	const params = instance.params;
	const pkg = await instance.getPackage();
	const input = glob.default.sync(`src/${index}.{${params.indexExt}}`);
	if (!input.length) throw Error("index file is not detected");
	await _cantinc_logger.logger.start("Remove build", () => fs_extra.default.remove(params.devBuildFolder));
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
		plugins.push((0, rollup_plugin_string.string)({
			include: "**/*.*",
			exclude: require_constants.stringExcludeNode
		}), instance.createServer(input, error, usualConsoleOutput));
	} else {
		const key = node_path.default.basename(params.sslKey) !== params.sslKey ? params.sslKey : fs_extra.default.existsSync(params.sslKey) ? fs_extra.default.readFileSync(params.sslKey) : void 0;
		const cert = node_path.default.basename(params.sslCrt) !== params.sslCrt ? params.sslCrt : fs_extra.default.existsSync(params.sslCrt) ? fs_extra.default.readFileSync(params.sslCrt) : void 0;
		output.format = "es";
		plugins.push((0, rollup_plugin_polyfill_node.default)(), (0, rollup_plugin_import_assets.default)({
			include: require_constants.imageInclude.map((img) => `src/${img}`),
			publicPath: params.baseUrl
		}), (0, rollup_plugin_styles.default)({
			mode: params.cssInJs ? "inject" : "extract",
			url: {
				inline: false,
				publicPath: `${params.baseUrl}assets`
			},
			sass: { silenceDeprecations: ["legacy-js-api"] },
			plugins: [(0, autoprefixer.default)()],
			autoModules: params.cssModules ? (id) => !id.includes(".global.") : true,
			sourceMap: true
		}), (0, rollup_plugin_string.string)({
			include: "**/*.*",
			exclude: require_constants.stringExcludeDom
		}), instance.createClient(key, cert, pkg, node_path.default.parse(input[0]).name, inject), (0, rollup_plugin_livereload.default)({
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
	plugins.push((0, rollup_plugin_process_env.default)(instance.params.envPrefix, {
		include: input,
		virtual: true,
		preset
	}));
	(0, rolldown.watch)(options).on("event", async (e) => {
		if (e.code === "ERROR") _cantinc_logger.logger.end("Bundling", error ? e.error.stack : e.error.message);
		else if (e.code === "BUNDLE_START") _cantinc_logger.logger.start("Bundling");
		else if (e.code === "BUNDLE_END") _cantinc_logger.logger.end("Bundling");
	});
}
//#endregion
exports.lintCheckWatchPlugin = lintCheckWatchPlugin;
exports.start = start;
exports.typecheckWatchPlugin = typecheckWatchPlugin;
