const require_constants = require("../../constants.js");
//#region src/utils/getNpmTag/getNpmTag.ts
function getNpmTag(version) {
	const match = version.match(require_constants.NPM_TAG);
	return match ? match[1] : "latest";
}
//#endregion
exports.getNpmTag = getNpmTag;
