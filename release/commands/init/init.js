const require_runtime = require("../../_virtual/_rolldown/runtime.js");
let _cantinc_logger = require("@cantinc/logger");
let chalk = require("chalk");
chalk = require_runtime.__toESM(chalk);
let node_child_process = require("node:child_process");
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
let node_util = require("node:util");
let adm_zip = require("adm-zip");
adm_zip = require_runtime.__toESM(adm_zip);
let axios = require("axios");
axios = require_runtime.__toESM(axios);
let cli_select = require("cli-select");
cli_select = require_runtime.__toESM(cli_select);
let node_os = require("node:os");
let node_readline = require("node:readline");
node_readline = require_runtime.__toESM(node_readline);
let node_stream = require("node:stream");
node_stream = require_runtime.__toESM(node_stream);
//#region src/commands/init/init.ts
const execAsync = (0, node_util.promisify)(node_child_process.exec);
const pipeline = (0, node_util.promisify)(node_stream.default.pipeline);
async function init(appName, { template, force = false } = {}) {
	const appPath = node_path.default.resolve(appName);
	const { data } = await _cantinc_logger.logger.start("Get templates list", async () => await axios.default.get("https://api.github.com/repos/d8corp/innetjs-templates/branches"));
	const templates = data.map(({ name }) => name).filter((name) => name !== "main");
	if (!template || !templates.includes(template)) {
		_cantinc_logger.logger.log(chalk.default.green("Select one of those templates"));
		const { value } = await (0, cli_select.default)({ values: templates });
		template = value;
		node_readline.default.moveCursor(process.stdout, 0, -1);
		const text = `Selected template: ${chalk.default.white(value)}`;
		_cantinc_logger.logger.start(text);
		_cantinc_logger.logger.end(text);
	}
	if (!force) await _cantinc_logger.logger.start("Check if app folder is available", async () => {
		if (fs_extra.default.existsSync(appPath)) {
			_cantinc_logger.logger.log(chalk.default.red(`'${appPath}' already exist, what do you want?`));
			const { id: result, value } = await (0, cli_select.default)({ values: [
				"Stop the process",
				"Remove the folder",
				"Merge with template"
			] });
			node_readline.default.moveCursor(process.stdout, 0, -1);
			_cantinc_logger.logger.log(`Already exist, selected: ${value}`);
			if (!result) throw Error(`'${appPath}' already exist`);
			if (result === 1) await fs_extra.default.remove(appPath);
		}
	});
	await _cantinc_logger.logger.start("Download template", async () => {
		const tmpPath = (0, node_os.tmpdir)();
		const zipPath = node_path.default.join(tmpPath, "template.zip");
		const unzipPath = node_path.default.join(tmpPath, `innetjs-templates-${template}`);
		const { data } = await axios.default.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, { responseType: "stream" });
		await pipeline(data, fs_extra.default.createWriteStream(zipPath));
		const zip = new adm_zip.default(zipPath);
		await new Promise((resolve, reject) => {
			zip.extractAllToAsync(tmpPath, false, false, (error) => {
				if (error) reject(error);
				else resolve(void 0);
			});
		});
		await fs_extra.default.remove(zipPath);
		await fs_extra.default.move(unzipPath, appPath, { overwrite: true });
	});
	await _cantinc_logger.logger.start("Install packages", () => execAsync(`cd ${appPath} && npm i`));
}
//#endregion
exports.init = init;
