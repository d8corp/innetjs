import { __require } from "../../_virtual/_rolldown/runtime.mjs";
//#region src/utils/updateDotenv/updateDotenv.ts
function updateDotenv() {
	const { __INNETJS__PACKAGE_VERSION: before } = process.env;
	delete process.env.__INNETJS__PACKAGE_VERSION;
	__require("dotenv-expand").expand(__require("dotenv").config());
	if (!("__INNETJS__PACKAGE_VERSION" in process.env)) process.env.__INNETJS__PACKAGE_VERSION = before;
}
//#endregion
export { updateDotenv };
