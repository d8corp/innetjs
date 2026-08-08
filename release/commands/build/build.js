'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var commonjs = require('@rollup/plugin-commonjs');
var json = require('@rollup/plugin-json');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var ts = require('@rollup/plugin-typescript');
var autoprefixer = require('autoprefixer');
var node_fs = require('node:fs');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('node:path');
var rollup = require('rollup');
var filesize = require('rollup-plugin-filesize');
var importAssets = require('rollup-plugin-import-assets');
var jsx = require('rollup-plugin-innet-jsx');
var polyfill = require('rollup-plugin-polyfill-node');
var rollupPluginString = require('rollup-plugin-string');
var styles = require('rollup-plugin-styles');
var rollupPluginTerser = require('rollup-plugin-terser');
var node_util = require('node:util');
var constants = require('../../constants.js');
var helpers = require('../../helpers.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var filesize__default = /*#__PURE__*/_interopDefaultLegacy(filesize);
var importAssets__default = /*#__PURE__*/_interopDefaultLegacy(importAssets);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);
var polyfill__default = /*#__PURE__*/_interopDefaultLegacy(polyfill);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

const copyFiles = node_util.promisify(fs__default["default"].copy);
function build({ node = false, inject = false, index = 'index' }, instance) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const input = glob__default["default"].sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(params.buildFolder));
        const pkg = node && (yield instance.getPackage());
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            plugins: [
                commonjs__default["default"]({
                    transformMixedEsModules: !node,
                }),
                json__default["default"](),
                ts__default["default"]({
                    noEmitOnError: true,
                    compilerOptions: {
                        declaration: false,
                    },
                }),
                jsx__default["default"](),
            ],
            onwarn(warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                    return;
                warn(warning);
            },
        };
        instance.withLint(options, true);
        const outputOptions = {
            dir: params.buildFolder,
            sourcemap: params.sourcemap,
        };
        if (node) {
            outputOptions.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            options.plugins.push(pluginNodeResolve.nodeResolve(), rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeNode,
            }));
        }
        else {
            options.plugins.push(pluginNodeResolve.nodeResolve({
                browser: true,
            }), polyfill__default["default"](), importAssets__default["default"]({
                include: constants.imageInclude.map(img => `src/${img}`),
                publicPath: params.baseUrl,
            }), styles__default["default"]({
                sass: {
                    outputStyle: 'compressed',
                },
                mode: params.cssInJs ? 'inject' : 'extract',
                url: {
                    inline: false,
                    publicPath: `${params.baseUrl}assets`,
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
                rollupPluginTerser.terser(),
                filesize__default["default"]({
                    reporter: helpers.reporter,
                }),
            ];
        }
        instance.withEnv(options, true);
        yield logger__default["default"].start('Build production bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const bundle = yield rollup__default["default"].rollup(options);
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
            yield logger__default["default"].start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const data = Object.assign({}, pkg);
                delete data.private;
                delete data.devDependencies;
                yield fs__default["default"].writeFile(path__default["default"].resolve(params.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
            }));
            const pkgLockPath = path__default["default"].resolve(params.projectFolder, 'package-lock.json');
            if (fs__default["default"].existsSync(pkgLockPath)) {
                yield logger__default["default"].start('Copy package-lock.json', () => {
                    return fs__default["default"].copy(pkgLockPath, path__default["default"].resolve(params.buildFolder, 'package-lock.json'));
                });
            }
        }
    });
}

exports.build = build;
