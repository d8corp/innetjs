'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var terser = require('@rollup/plugin-terser');
var autoprefixer = require('autoprefixer');
var node_fs = require('node:fs');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('node:path');
var rolldown = require('rolldown');
var filesize = require('rollup-plugin-filesize');
var importAssets = require('rollup-plugin-import-assets');
var polyfill = require('rollup-plugin-polyfill-node');
var rollupPluginString = require('rollup-plugin-string');
var styles = require('rollup-plugin-styles');
var node_util = require('node:util');
var constants = require('../../constants.js');
var helpers = require('../../helpers.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var terser__default = /*#__PURE__*/_interopDefaultLegacy(terser);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var filesize__default = /*#__PURE__*/_interopDefaultLegacy(filesize);
var importAssets__default = /*#__PURE__*/_interopDefaultLegacy(importAssets);
var polyfill__default = /*#__PURE__*/_interopDefaultLegacy(polyfill);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

const copyFiles = node_util.promisify(fs__default["default"].copy);
function build(_a, instance_1) {
    return tslib.__awaiter(this, arguments, void 0, function* ({ node = false, inject = false, index = 'index' }, instance) {
        const params = instance.params;
        const input = glob__default["default"].sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.logger.start('Remove build', () => fs__default["default"].remove(params.buildFolder));
        const pkg = node && (yield instance.getPackage());
        const plugins = [];
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            plugins,
        };
        const outputOptions = {
            dir: params.buildFolder,
            sourcemap: params.sourcemap,
        };
        if (node) {
            outputOptions.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            plugins.push(rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeNode,
            }));
        }
        else {
            plugins.push(polyfill__default["default"](), importAssets__default["default"]({
                include: constants.imageInclude.map(img => `src/${img}`),
                publicPath: params.baseUrl,
            }), styles__default["default"]({
                mode: params.cssInJs ? 'inject' : 'extract',
                url: {
                    inline: false,
                    publicPath: `${params.baseUrl}assets`,
                },
                sass: {
                    outputStyle: 'compressed',
                    silenceDeprecations: ['legacy-js-api'],
                },
                plugins: [autoprefixer__default["default"]()],
                autoModules: params.cssModules ? (id) => !id.includes('.global.') : true,
                sourceMap: params.sourcemap,
                minimize: true,
            }), rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeDom,
            }));
            outputOptions.format = 'es';
            outputOptions.plugins = [
                terser__default["default"](),
                filesize__default["default"]({
                    reporter: helpers.reporter,
                }),
            ];
        }
        instance.withEnv(options, true);
        yield logger.logger.start('Build production bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const bundle = yield rolldown.rolldown(options);
            yield bundle.write(outputOptions);
            yield bundle.close();
            if (!node) {
                yield copyFiles(params.publicFolder, params.buildFolder);
                const data = yield node_fs.promises.readFile(params.publicIndexFile);
                const pkg = yield instance.getPackage();
                yield node_fs.promises.writeFile(params.buildIndexFile, yield helpers.convertIndexFile(data, pkg.version, params.baseUrl, path__default["default"].parse(input[0]).name, inject));
            }
        }));
        if (pkg) {
            yield logger.logger.start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const data = Object.assign({}, pkg);
                delete data.private;
                delete data.devDependencies;
                yield fs__default["default"].writeFile(path__default["default"].resolve(params.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
            }));
            const pkgLockPath = path__default["default"].resolve(params.projectFolder, 'package-lock.json');
            if (fs__default["default"].existsSync(pkgLockPath)) {
                yield logger.logger.start('Copy package-lock.json', () => {
                    return fs__default["default"].copy(pkgLockPath, path__default["default"].resolve(params.buildFolder, 'package-lock.json'));
                });
            }
        }
    });
}

exports.build = build;
