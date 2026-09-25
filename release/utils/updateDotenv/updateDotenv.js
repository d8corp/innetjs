//#region src/utils/updateDotenv/updateDotenv.ts
function updateDotenv(envFile) {
	const { __INNETJS__PACKAGE_VERSION: before } = process.env;
	delete process.env.__INNETJS__PACKAGE_VERSION;
	require("dotenv-expand").expand(require("dotenv").config({ path: [".env", `.env.${envFile}`] }));
	if (!("__INNETJS__PACKAGE_VERSION" in process.env)) process.env.__INNETJS__PACKAGE_VERSION = before;
	while ("__ENV_EXTENDS" in process.env) {
		const path = process.env.__ENV_EXTENDS;
		delete process.env.__ENV_EXTENDS;
		require("dotenv-expand").expand(require("dotenv").config({ path }));
	}
}
//#endregion
exports.updateDotenv = updateDotenv;
