'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('node:path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

function getFile(file) {
    file = path__default["default"].resolve(file);
    if (!fs__default["default"].existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    if (fs__default["default"].lstatSync(file).isDirectory()) {
        let tmpFile = file;
        if (!fs__default["default"].existsSync(tmpFile = path__default["default"].join(file, 'index.ts')) &&
            !fs__default["default"].existsSync(tmpFile = path__default["default"].join(file, 'index.tsx')) &&
            !fs__default["default"].existsSync(tmpFile = path__default["default"].join(file, 'index.js'))) {
            throw Error('Cannot find index file in: ' + file);
        }
        file = tmpFile;
    }
    else if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) {
        throw Error('File should has `.ts` or `.tsx` or `.js` extension: ' + file);
    }
    if (!fs__default["default"].existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    return file;
}
function convertIndexFile(data, version, baseUrl, index) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const { env } = process;
        return data
            .toString()
            .replace('</head>', `<script type="module" defer src="${baseUrl}${index}.js${version ? `?v=${version}` : ''}"></script></head>`)
            .replace(/%([A-Z0-9_]+)%/g, (placeholder, placeholderId) => { var _a; return (_a = env[placeholderId]) !== null && _a !== void 0 ? _a : placeholder; });
    });
}
const reporter = (options, outputOptions, info) => {
    logger__default["default"].log(`${chalk__default["default"].yellow(info.fileName)} ${chalk__default["default"].green(info.bundleSize)} [ gzip: ${chalk__default["default"].green(info.gzipSize)} ]`);
    return '';
};

exports.convertIndexFile = convertIndexFile;
exports.getFile = getFile;
exports.reporter = reporter;
