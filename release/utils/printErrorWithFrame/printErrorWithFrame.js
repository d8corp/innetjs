const require_runtime = require("../../_virtual/_rolldown/runtime.js");
let chalk = require("chalk");
chalk = require_runtime.__toESM(chalk);
let fs_extra = require("fs-extra");
fs_extra = require_runtime.__toESM(fs_extra);
let _babel_code_frame = require("@babel/code-frame");
//#region src/utils/printErrorWithFrame/printErrorWithFrame.ts
function printErrorWithFrame(output, deep = 0, hide = false) {
	if (!output) return "";
	const input = output.split("\n");
	const start = input.findIndex((line) => line.trim().startsWith(deep ? "[cause]: Error:" : "Error:"));
	if (!~start) return output;
	const inputFrame = input.slice(0, start);
	const end = input.slice(start + 1).findIndex((line) => line.trim().startsWith("[cause]: Error:"));
	const inputBody = input.slice(start, ~end ? start + end - 1 : void 0);
	const inputCauses = ~end ? input.slice(start + end - 1) : [];
	const bodyStackStart = inputBody.findIndex((line) => line.trim().startsWith("at "));
	const bodyText = ~bodyStackStart ? inputBody.slice(0, bodyStackStart).join("\n") : inputBody.join("\n");
	const bodyStack = ~bodyStackStart ? inputBody.slice(bodyStackStart) : [];
	const splitFilePath = (bodyStack.length ? bodyStack[0].match(/\(([^(]+)\)$/)?.[1] : void 0)?.split(":") ?? [];
	const filePath = splitFilePath[0]?.trim();
	const line = Number(splitFilePath[1] ?? 1);
	const column = Number(splitFilePath[2] ?? 1);
	let frame = "";
	if (filePath && !filePath.includes("node_modules")) try {
		const source = fs_extra.default.readFileSync(filePath, "utf8");
		frame = (0, _babel_code_frame.codeFrameColumns)(source, { start: {
			line,
			column
		} }, { highlightCode: true });
	} catch (e) {}
	else frame = inputFrame.join("\n");
	const title = bodyText.trim();
	const baseOffset = " ".repeat(2);
	const offset = baseOffset.repeat(deep);
	const titleOffset = offset + baseOffset + baseOffset;
	let hiddenCount = 0;
	let collapse = titleOffset + "at ... (0 more node_modules calls)";
	const stack = hide ? bodyStack.slice(1).reduce((cur, line) => {
		if (line.includes("node_modules")) {
			if (cur.at(-1) === collapse) {
				collapse = collapse.replace(`${hiddenCount} more`, `${++hiddenCount} more`);
				return [...cur.slice(0, -1), collapse];
			}
			collapse = collapse.replace(`${hiddenCount} more`, `${++hiddenCount} more`);
			return [...cur, collapse];
		}
		hiddenCount = 0;
		collapse = titleOffset + "at ... (0 more node_modules calls)";
		return [...cur, line];
	}, []) : bodyStack.slice(1);
	return [
		chalk.default.red(`${titleOffset}${title}`),
		bodyStack[0],
		frame && `${offset}${frame.replaceAll("\n", `\n${offset}`)}`,
		...stack.filter((line) => line.trim() !== "}").map((line) => line.includes("node_modules") ? chalk.default.gray(line) : line),
		printErrorWithFrame(inputCauses.join("\n"), deep + 1, hide)
	].filter(Boolean).join("\n");
}
//#endregion
exports.printErrorWithFrame = printErrorWithFrame;
