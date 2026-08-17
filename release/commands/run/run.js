const require_runtime = require("../../_virtual/_rolldown/runtime.js");
const require_helpers = require("../../helpers.js");
let _cantinc_logger = require("@cantinc/logger");
let node_child_process = require("node:child_process");
let rolldown = require("rolldown");
let tmp = require("tmp");
tmp = require_runtime.__toESM(tmp);
//#region src/commands/run/run.ts
async function run(file, { config = "", exposeGc = false, typeCheck } = {}) {
	const input = await _cantinc_logger.logger.start("Check file", () => require_helpers.getFile(file));
	if (!input.length) throw Error("index file is not detected");
	if (typeCheck) await _cantinc_logger.logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		const params = ["--noEmit"];
		if (config) params.push("-p", config);
		(0, node_child_process.spawn)("tsc", params, {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	const jsFilePath = `${await new Promise((resolve, reject) => {
		tmp.default.dir((err, folder) => {
			if (err) reject(err);
			else resolve(folder);
		});
	})}/index.js`;
	await _cantinc_logger.logger.start("Build bundle", async () => {
		const inputOptions = {
			input,
			plugins: []
		};
		const outputOptions = {
			format: "cjs",
			file: jsFilePath,
			sourcemap: true
		};
		const bundle = await (0, rolldown.rolldown)(inputOptions);
		await bundle.write(outputOptions);
		await bundle.close();
	});
	await _cantinc_logger.logger.start("Running of the script", async () => {
		const flags = [];
		if (exposeGc) flags.push("--expose-gc");
		(0, node_child_process.spawn)("node", [
			...flags,
			"-r",
			"source-map-support/register",
			jsFilePath
		], { stdio: "inherit" });
	});
}
//#endregion
exports.run = run;
