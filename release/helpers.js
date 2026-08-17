const require_runtime = require("./_virtual/_rolldown/runtime.js");
let _cantinc_logger = require("@cantinc/logger");
let chalk = require("chalk");
chalk = require_runtime.__toESM(chalk);
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
//#region src/helpers.ts
function getFile(file) {
	file = node_path.default.resolve(file);
	if (!fs_extra.default.existsSync(file)) throw Error("Cannot find the file: " + file);
	if (fs_extra.default.lstatSync(file).isDirectory()) {
		let tmpFile = file;
		if (!fs_extra.default.existsSync(tmpFile = node_path.default.join(file, "index.ts")) && !fs_extra.default.existsSync(tmpFile = node_path.default.join(file, "index.tsx")) && !fs_extra.default.existsSync(tmpFile = node_path.default.join(file, "index.js"))) throw Error("Cannot find index file in: " + file);
		file = tmpFile;
	} else if (!file.endsWith(".ts") && !file.endsWith(".tsx") && !file.endsWith(".js")) throw Error("File should has `.ts` or `.tsx` or `.js` extension: " + file);
	if (!fs_extra.default.existsSync(file)) throw Error("Cannot find the file: " + file);
	return file;
}
async function convertIndexFile(data, version, baseUrl, index, inject) {
	const { env } = process;
	const indexString = data.toString().replace(/%([A-Z0-9_]+)%/g, (placeholder, placeholderId) => env[placeholderId] ?? placeholder);
	return inject ? indexString.replace("</head>", `<script type="module" defer src="${baseUrl}${index}.js${version ? `?v=${version}` : ""}"><\/script></head>`) : indexString;
}
const reporter = (options, outputOptions, info) => {
	_cantinc_logger.logger.log(`${chalk.default.yellow(info.fileName)} ${chalk.default.green(info.bundleSize)} [ gzip: ${chalk.default.green(info.gzipSize)} ]`);
	return "";
};
//#endregion
exports.convertIndexFile = convertIndexFile;
exports.getFile = getFile;
exports.reporter = reporter;
