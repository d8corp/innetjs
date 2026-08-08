'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
var constants = require('../../constants.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

function getDefaultOptions({ envPrefix = process.env.INNETJS_ENV_PREFIX || 'INNETJS_', projectFolder = process.env.PROJECT_FOLDER || '', baseUrl = process.env.BASE_URL || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', releaseFolder = process.env.RELEASE_FOLDER || 'release', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', simulateIP = process.env.IP, port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '/api/?*', tsconfig = process.env.TSCONFIG, indexExt = constants.SCRIPT_EXTENSIONS.join(','), }) {
    const devBuildFolder = path__default["default"].resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build');
    return {
        projectFolder: path__default["default"].resolve(projectFolder),
        publicFolder: path__default["default"].resolve(publicFolder),
        releaseFolder: path__default["default"].resolve(releaseFolder),
        buildFolder: path__default["default"].resolve(buildFolder),
        srcFolder: path__default["default"].resolve(srcFolder),
        licenseFile: path__default["default"].join(projectFolder, 'LICENSE'),
        licenseReleaseFile: path__default["default"].join(releaseFolder, 'LICENSE'),
        readmeFile: path__default["default"].join(projectFolder, 'README.md'),
        readmeReleaseFile: path__default["default"].join(releaseFolder, 'README.md'),
        declarationFile: path__default["default"].join(srcFolder, 'declaration.d.ts'),
        declarationReleaseFile: path__default["default"].join(releaseFolder, 'declaration.d.ts'),
        publicIndexFile: path__default["default"].join(publicFolder, 'index.html'),
        buildIndexFile: path__default["default"].join(buildFolder, 'index.html'),
        devBuildFolder,
        devBuildIndexFile: path__default["default"].join(devBuildFolder, 'index.html'),
        sourcemap,
        cssModules,
        cssInJs,
        sslKey,
        sslCrt,
        port,
        proxy,
        api,
        baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
        envPrefix,
        simulateIP,
        tsconfig,
        indexExt,
    };
}

exports.getDefaultOptions = getDefaultOptions;
