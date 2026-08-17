//#region src/constants.ts
const SCRIPT_EXTENSIONS = [
	"ts",
	"js",
	"tsx",
	"jsx"
];
const REG_TJSX = /\.[tj]sx?$/;
const REG_EXT = /\.([^.]+)$/;
const NPM_TAG = /-(.+?)(?:\.|$)/;
const lintInclude = [
	"**/*.ts",
	"**/*.tsx",
	"**/*.js",
	"**/*.jsx",
	"**/*.mjs"
];
const imageInclude = [
	"**/*.gif",
	"**/*.png",
	"**/*.jpeg",
	"**/*.jpg",
	"**/*.svg",
	"**/*.webp"
];
const stringExcludeDom = [
	...lintInclude,
	"**/*.json",
	"**/*.css",
	"**/*.scss",
	"**/*.webp",
	...imageInclude
];
const stringExcludeNode = [...lintInclude, "**/*.json"];
//#endregion
exports.NPM_TAG = NPM_TAG;
exports.REG_EXT = REG_EXT;
exports.REG_TJSX = REG_TJSX;
exports.SCRIPT_EXTENSIONS = SCRIPT_EXTENSIONS;
exports.imageInclude = imageInclude;
exports.lintInclude = lintInclude;
exports.stringExcludeDom = stringExcludeDom;
exports.stringExcludeNode = stringExcludeNode;
