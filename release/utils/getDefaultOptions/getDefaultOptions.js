const require_runtime = require("../../_virtual/_rolldown/runtime.js");
const require_constants = require("../../constants.js");
let node_path = require("node:path");
node_path = require_runtime.__toESM(node_path);
//#region src/utils/getDefaultOptions/getDefaultOptions.ts
function getDefaultOptions({ envPrefix = process.env.INNETJS_ENV_PREFIX || "INNETJS_", projectFolder = process.env.PROJECT_FOLDER || "", baseUrl = process.env.BASE_URL || "", publicFolder = process.env.PUBLIC_FOLDER || "public", releaseFolder = process.env.RELEASE_FOLDER || "release", buildFolder = process.env.BUILD_FOLDER || "build", srcFolder = process.env.SRC_FOLDER || "src", sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === "true" : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === "true" : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === "true" : true, sslKey = process.env.SSL_KEY || "localhost.key", sslCrt = process.env.SSL_CRT || "localhost.crt", proxy = process.env.PROXY || "", simulateIP = process.env.IP, port = process.env.PORT ? +process.env.PORT : 3e3, api = process.env.API || "/api/?*", tsconfig = process.env.TSCONFIG, buildTSConfig = process.env.BUILD_TSCONFIG ?? tsconfig, releaseTSConfig = process.env.RELEASE_TSCONFIG ?? tsconfig, startTSConfig = process.env.START_TSCONFIG ?? tsconfig, indexExt = require_constants.SCRIPT_EXTENSIONS.join(",") }) {
	const devBuildFolder = node_path.default.resolve(projectFolder, "node_modules", ".cache", "innetjs", "build");
	return {
		projectFolder: node_path.default.resolve(projectFolder),
		publicFolder: node_path.default.resolve(publicFolder),
		releaseFolder: node_path.default.resolve(releaseFolder),
		buildFolder: node_path.default.resolve(buildFolder),
		srcFolder: node_path.default.resolve(srcFolder),
		licenseFile: node_path.default.join(projectFolder, "LICENSE"),
		licenseReleaseFile: node_path.default.join(releaseFolder, "LICENSE"),
		readmeFile: node_path.default.join(projectFolder, "README.md"),
		readmeReleaseFile: node_path.default.join(releaseFolder, "README.md"),
		declarationFile: node_path.default.join(srcFolder, "declaration.d.ts"),
		declarationReleaseFile: node_path.default.join(releaseFolder, "declaration.d.ts"),
		publicIndexFile: node_path.default.join(publicFolder, "index.html"),
		buildIndexFile: node_path.default.join(buildFolder, "index.html"),
		devBuildFolder,
		devBuildIndexFile: node_path.default.join(devBuildFolder, "index.html"),
		sourcemap,
		cssModules,
		cssInJs,
		sslKey,
		sslCrt,
		port,
		proxy,
		api,
		baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
		envPrefix,
		simulateIP,
		tsconfig,
		buildTSConfig,
		releaseTSConfig,
		startTSConfig,
		indexExt
	};
}
//#endregion
exports.getDefaultOptions = getDefaultOptions;
