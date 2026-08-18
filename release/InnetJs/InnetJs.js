const require_runtime = require("../_virtual/_rolldown/runtime.js");
const require_helpers = require("../helpers.js");
const require_build = require("../commands/build/build.js");
const require_init = require("../commands/init/init.js");
const require_getDefaultOptions = require("../utils/getDefaultOptions/getDefaultOptions.js");
const require_printErrorWithFrame = require("../utils/printErrorWithFrame/printErrorWithFrame.js");
require("../utils/index.js");
const require_release = require("../commands/release/release.js");
const require_run = require("../commands/run/run.js");
const require_start = require("../commands/start/start.js");
require("../commands/index.js");
let _cantinc_logger = require("@cantinc/logger");
let address = require("address");
address = require_runtime.__toESM(address);
let chalk = require("chalk");
chalk = require_runtime.__toESM(chalk);
let node_child_process = require("node:child_process");
let express = require("express");
express = require_runtime.__toESM(express);
let express_http_proxy = require("express-http-proxy");
express_http_proxy = require_runtime.__toESM(express_http_proxy);
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let node_http = require("node:http");
node_http = require_runtime.__toESM(node_http);
let node_https = require("node:https");
node_https = require_runtime.__toESM(node_https);
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
let prompts = require("prompts");
prompts = require_runtime.__toESM(prompts);
let prompts_lib_util_style = require("prompts/lib/util/style");
prompts_lib_util_style = require_runtime.__toESM(prompts_lib_util_style);
//#region src/InnetJs/InnetJs.ts
const originSymbol = prompts_lib_util_style.default.symbol;
prompts_lib_util_style.default.symbol = function(...rest) {
	return `\u001b[32m${"│".repeat(_cantinc_logger.logger.deep.length)}\u001b[39m ${originSymbol.apply(this, rest)}`;
};
var InnetJS = class {
	constructor(options = {}) {
		this.params = require_getDefaultOptions.getDefaultOptions(options);
	}
	async init(appName, options) {
		await require_init.init(appName, options);
	}
	async build(options = {}) {
		await require_build.build(options, this);
	}
	async start(options = {}) {
		await require_start.start(options, this);
	}
	async run(file, options = {}) {
		await require_run.run(file, options);
	}
	async release(options = {}) {
		await require_release.release(options, this);
	}
	async getPackage() {
		if (this.package) return this.package;
		const packageFolder = node_path.default.resolve(this.params.projectFolder, "package.json");
		await _cantinc_logger.logger.start("Check package.json", async () => {
			if (fs_extra.default.existsSync(packageFolder)) this.package = await fs_extra.default.readJson(packageFolder);
		});
		return this.package;
	}
	createClient(key, cert, pkg, index, inject) {
		let app;
		return {
			name: "client",
			writeBundle: async () => {
				if (!app) {
					app = (0, express.default)();
					const update = async () => {
						const data = await fs_extra.promises.readFile(this.params.publicIndexFile);
						await fs_extra.promises.writeFile(this.params.devBuildIndexFile, await require_helpers.convertIndexFile(data, pkg.version, this.params.baseUrl, index, inject));
					};
					fs_extra.default.watch(this.params.publicIndexFile, update);
					await update();
					const httpsUsing = !!(cert && key);
					app.use(this.params.baseUrl, express.default.static(this.params.devBuildFolder));
					app.use(this.params.baseUrl, express.default.static(this.params.publicFolder));
					if (this.params.proxy?.startsWith("http")) {
						if (this.params.simulateIP) app.use((req, res, next) => {
							req.headers["X-Real-IP"] = this.params.simulateIP;
							next();
						});
						if (this.params.proxy) app.use(this.params.api, (0, express_http_proxy.default)(this.params.proxy, {
							https: httpsUsing,
							limit: "1000mb",
							proxyReqPathResolver: (req) => req.originalUrl
						}));
					}
					app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
						res.sendFile(node_path.default.resolve(this.params.devBuildFolder, "index.html"), { dotfiles: "allow" });
					});
					const server = httpsUsing ? node_https.default.createServer({
						key,
						cert
					}, app) : node_http.default.createServer(app);
					let port = this.params.port;
					const { promise, resolve } = Promise.withResolvers();
					const listener = () => {
						const baseUrl = this.params.baseUrl === "/" ? "" : this.params.baseUrl;
						_cantinc_logger.logger.log(`${chalk.default.green("➤")} Started on http${httpsUsing ? "s" : ""}://localhost:${port}${baseUrl} and http${httpsUsing ? "s" : ""}://${address.default.ip()}:${port}${baseUrl}`);
						resolve(void 0);
					};
					server.listen(port, listener);
					server.on("error", async (e) => {
						if (e.code === "EADDRINUSE") {
							port++;
							const { userPort } = await (0, prompts.default)({
								name: "userPort",
								type: "number",
								message: `Port ${e.port} is reserved, please enter another one [${port}]:`
							});
							if (userPort) port = userPort;
							server.listen(port);
						} else throw e;
					});
					await promise;
				}
			}
		};
	}
	createServer(input, error = false, usualConsoleOutput = false) {
		const apps = {};
		return {
			name: "server",
			writeBundle: async () => {
				for (const file of input) {
					let stderrBuffer = "";
					const { name } = node_path.default.parse(file);
					apps[name]?.kill();
					const filePath = node_path.default.resolve(this.params.devBuildFolder, `${name}.js`);
					if (usualConsoleOutput) {
						apps[name] = (0, node_child_process.spawn)("node", [
							"-r",
							"source-map-support/register",
							filePath
						], { stdio: "inherit" });
						return;
					}
					const child = (0, node_child_process.spawn)("node", [
						"-r",
						"source-map-support/register",
						filePath
					], { stdio: ["inherit", "inherit"] });
					apps[name] = child;
					child.stderr.on("data", (chunk) => {
						stderrBuffer += chunk.toString();
					});
					child.on("close", (code) => {
						if (code !== 0 && stderrBuffer) {
							console.error(require_printErrorWithFrame.printErrorWithFrame(stderrBuffer, 0, !error));
							stderrBuffer = "";
						}
					});
				}
			}
		};
	}
};
//#endregion
exports.InnetJS = InnetJS;
