import { convertIndexFile } from "../helpers.mjs";
import { build } from "../commands/build/build.mjs";
import { init } from "../commands/init/init.mjs";
import { getDefaultOptions } from "../utils/getDefaultOptions/getDefaultOptions.mjs";
import { printErrorWithFrame } from "../utils/printErrorWithFrame/printErrorWithFrame.mjs";
import "../utils/index.mjs";
import { release } from "../commands/release/release.mjs";
import { run } from "../commands/run/run.mjs";
import { start } from "../commands/start/start.mjs";
import "../commands/index.mjs";
import { logger } from "@cantinc/logger";
import address from "address";
import chalk from "chalk";
import { spawn } from "node:child_process";
import express from "express";
import proxy from "express-http-proxy";
import fs, { promises } from "fs-extra";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import prompt from "prompts";
import promptStyles from "prompts/lib/util/style";
//#region src/InnetJs/InnetJs.ts
const originSymbol = promptStyles.symbol;
promptStyles.symbol = function(...rest) {
	return `\u001b[32m${"│".repeat(logger.deep.length)}\u001b[39m ${originSymbol.apply(this, rest)}`;
};
var InnetJS = class {
	constructor(options = {}) {
		this.params = getDefaultOptions(options);
	}
	async init(appName, options) {
		await init(appName, options);
	}
	async build(options = {}) {
		await build(options, this);
	}
	async start(options = {}) {
		await start(options, this);
	}
	async run(file, options = {}) {
		await run(file, options);
	}
	async release(options = {}) {
		await release(options, this);
	}
	async getPackage() {
		if (this.package) return this.package;
		const packageFolder = path.resolve(this.params.projectFolder, "package.json");
		await logger.start("Check package.json", async () => {
			if (fs.existsSync(packageFolder)) this.package = await fs.readJson(packageFolder);
		});
		return this.package;
	}
	createClient(key, cert, pkg, index, inject) {
		let app;
		return {
			name: "client",
			writeBundle: async () => {
				if (!app) {
					app = express();
					const update = async () => {
						const data = await promises.readFile(this.params.publicIndexFile);
						await promises.writeFile(this.params.devBuildIndexFile, await convertIndexFile(data, pkg.version, this.params.baseUrl, index, inject));
					};
					fs.watch(this.params.publicIndexFile, update);
					await update();
					const httpsUsing = !!(cert && key);
					app.use(this.params.baseUrl, express.static(this.params.devBuildFolder));
					app.use(this.params.baseUrl, express.static(this.params.publicFolder));
					if (this.params.proxy?.startsWith("http")) {
						if (this.params.simulateIP) app.use((req, res, next) => {
							req.headers["X-Real-IP"] = this.params.simulateIP;
							next();
						});
						if (this.params.proxy) app.use(this.params.api, proxy(this.params.proxy, {
							https: httpsUsing,
							limit: "1000mb",
							proxyReqPathResolver: (req) => req.originalUrl
						}));
					}
					app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
						res.sendFile(path.resolve(this.params.devBuildFolder, "index.html"), { dotfiles: "allow" });
					});
					const server = httpsUsing ? https.createServer({
						key,
						cert
					}, app) : http.createServer(app);
					let port = this.params.port;
					const { promise, resolve } = Promise.withResolvers();
					const listener = () => {
						const baseUrl = this.params.baseUrl === "/" ? "" : this.params.baseUrl;
						logger.log(`${chalk.green("➤")} Started on http${httpsUsing ? "s" : ""}://localhost:${port}${baseUrl} and http${httpsUsing ? "s" : ""}://${address.ip()}:${port}${baseUrl}`);
						resolve(void 0);
					};
					server.listen(port, listener);
					server.on("error", async (e) => {
						if (e.code === "EADDRINUSE") {
							port++;
							const { userPort } = await prompt({
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
					const { name } = path.parse(file);
					apps[name]?.kill();
					const filePath = path.resolve(this.params.devBuildFolder, `${name}.js`);
					if (usualConsoleOutput) {
						apps[name] = spawn("node", [
							"-r",
							"source-map-support/register",
							filePath
						], { stdio: "inherit" });
						return;
					}
					const child = spawn("node", [
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
							console.error(printErrorWithFrame(stderrBuffer, 0, !error));
							stderrBuffer = "";
						}
					});
				}
			}
		};
	}
};
//#endregion
export { InnetJS };
