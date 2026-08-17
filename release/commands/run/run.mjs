import { getFile } from "../../helpers.mjs";
import { logger } from "@cantinc/logger";
import { spawn } from "node:child_process";
import { rolldown } from "rolldown";
import tmp from "tmp";
//#region src/commands/run/run.ts
async function run(file, { config = "", exposeGc = false, typeCheck } = {}) {
	const input = await logger.start("Check file", () => getFile(file));
	if (!input.length) throw Error("index file is not detected");
	if (typeCheck) await logger.start("Check TypeScript", async () => {
		const { resolve, reject, promise } = Promise.withResolvers();
		const params = ["--noEmit"];
		if (config) params.push("-p", config);
		spawn("tsc", params, {
			stdio: "inherit",
			shell: true
		}).on("close", (code) => {
			if (code) reject();
			else resolve(void 0);
		});
		await promise;
	});
	const jsFilePath = `${await new Promise((resolve, reject) => {
		tmp.dir((err, folder) => {
			if (err) reject(err);
			else resolve(folder);
		});
	})}/index.js`;
	await logger.start("Build bundle", async () => {
		const inputOptions = {
			input,
			plugins: []
		};
		const outputOptions = {
			format: "cjs",
			file: jsFilePath,
			sourcemap: true
		};
		const bundle = await rolldown(inputOptions);
		await bundle.write(outputOptions);
		await bundle.close();
	});
	await logger.start("Running of the script", async () => {
		const flags = [];
		if (exposeGc) flags.push("--expose-gc");
		spawn("node", [
			...flags,
			"-r",
			"source-map-support/register",
			jsFilePath
		], { stdio: "inherit" });
	});
}
//#endregion
export { run };
