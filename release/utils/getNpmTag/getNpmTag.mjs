import { NPM_TAG } from "../../constants.mjs";
//#region src/utils/getNpmTag/getNpmTag.ts
function getNpmTag(version) {
	const match = version.match(NPM_TAG);
	return match ? match[1] : "latest";
}
//#endregion
export { getNpmTag };
