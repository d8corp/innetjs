'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var commonjs = require('@rollup/plugin-commonjs');
var json = require('@rollup/plugin-json');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var ts = require('@rollup/plugin-typescript');
var autoprefixer = require('autoprefixer');
var fs = require('fs-extra');
var glob = require('glob');
var linesAndColumns = require('lines-and-columns');
var path = require('node:path');
var rollup = require('rollup');
var importAssets = require('rollup-plugin-import-assets');
var jsx = require('rollup-plugin-innet-jsx');
var livereload = require('rollup-plugin-livereload');
var polyfill = require('rollup-plugin-polyfill-node');
var rollupPluginString = require('rollup-plugin-string');
var styles = require('rollup-plugin-styles');
var constants = require('../../constants.js');

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
var importAssets__default = /*#__PURE__*/_interopDefaultLegacy(importAssets);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);
var livereload__default = /*#__PURE__*/_interopDefaultLegacy(livereload);
var polyfill__default = /*#__PURE__*/_interopDefaultLegacy(polyfill);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

function start({ node = false, inject = false, error = false, usualConsoleOutput = false, index = 'index', }, instance) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob__default["default"].sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(params.devBuildFolder));
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output: {
                dir: params.devBuildFolder,
                sourcemap: true,
            },
            plugins: [
                commonjs__default["default"]({
                    transformMixedEsModules: !node,
                }),
                json__default["default"](),
                ts__default["default"]({
                    compilerOptions: {
                        declaration: false,
                        sourceMap: true,
                    },
                }),
                jsx__default["default"](),
            ],
            onwarn(warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                    return;
                if (warning.plugin === 'typescript') {
                    const { loc, frame, message } = warning;
                    if (loc) {
                        const { line, column, file } = loc;
                        console.log(`ERROR in ${file}:${line}:${column}`);
                    }
                    console.log(message);
                    console.log(frame);
                    return;
                }
                warn(warning);
            },
        };
        let preset;
        instance.withLint(options);
        if (node) {
            preset = { NODE_ENV: 'dev' };
            // @ts-expect-error
            options.output.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            options.plugins.push(pluginNodeResolve.nodeResolve(), rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeNode,
            }), instance.createServer(input, error, usualConsoleOutput));
        }
        else {
            const key = path__default["default"].basename(params.sslKey) !== params.sslKey
                ? params.sslKey
                : fs__default["default"].existsSync(params.sslKey)
                    ? fs__default["default"].readFileSync(params.sslKey)
                    : undefined;
            const cert = path__default["default"].basename(params.sslCrt) !== params.sslCrt
                ? params.sslCrt
                : fs__default["default"].existsSync(params.sslCrt)
                    ? fs__default["default"].readFileSync(params.sslCrt)
                    : undefined;
            // @ts-expect-error
            options.output.format = 'es';
            options.plugins.push(pluginNodeResolve.nodeResolve({
                browser: true,
            }), polyfill__default["default"](), importAssets__default["default"]({
                include: constants.imageInclude.map(img => `src/${img}`),
                publicPath: params.baseUrl,
            }), styles__default["default"]({
                mode: params.cssInJs ? 'inject' : 'extract',
                url: {
                    inline: false,
                    publicPath: `${params.baseUrl}assets`,
                },
                sass: {
                    silenceDeprecations: ['legacy-js-api'],
                },
                plugins: [autoprefixer__default["default"]()],
                autoModules: params.cssModules ? (id) => !id.includes('.global.') : true,
                sourceMap: true,
            }), rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeDom,
            }), instance.createClient(key, cert, pkg, path__default["default"].parse(input[0]).name, inject), livereload__default["default"](Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [params.devBuildFolder, params.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
        }
        instance.withEnv(options, true, preset);
        const watcher = rollup__default["default"].watch(options);
        watcher.on('event', (e) => tslib.__awaiter(this, void 0, void 0, function* () {
            if (e.code === 'ERROR') {
                if (e.error.code === 'UNRESOLVED_IMPORT') {
                    const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || [];
                    const text = (yield fs__default["default"].readFile(file)).toString();
                    const lines = new linesAndColumns.LinesAndColumns(text);
                    const { line, column } = lines.locationForIndex(text.indexOf(importer));
                    logger__default["default"].end('Bundling', e.error.message);
                    console.log(`ERROR in ${file}:${line + 1}:${column + 1}`);
                }
                else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs', 'typescript'].includes(e.error.plugin)) {
                    const [, file, line, column] = e.error.message
                        .replace(constants.REG_CLEAR_TEXT, '')
                        .match(constants.REG_RPT_ERROR_FILE) || [];
                    logger__default["default"].end('Bundling', e.error.message);
                    if (file) {
                        console.log(`ERROR in ${file}:${line}:${column}`);
                    }
                    else if (e.error.loc) {
                        console.log(`ERROR in ${e.error.loc.file}:${e.error.loc.line}:${e.error.loc.column}`);
                        console.log(e.error.frame);
                    }
                }
                else {
                    logger__default["default"].end('Bundling', error ? e.error.stack : e.error.message);
                }
            }
            else if (e.code === 'BUNDLE_START') {
                logger__default["default"].start('Bundling');
            }
            else if (e.code === 'BUNDLE_END') {
                logger__default["default"].end('Bundling');
            }
        }));
    });
}

exports.start = start;
