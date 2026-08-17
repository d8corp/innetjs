'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var autoprefixer = require('autoprefixer');
var node_child_process = require('node:child_process');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('node:path');
var rolldown = require('rolldown');
var importAssets = require('rollup-plugin-import-assets');
var livereload = require('rollup-plugin-livereload');
var polyfill = require('rollup-plugin-polyfill-node');
var rollupPluginString = require('rollup-plugin-string');
var styles = require('rollup-plugin-styles');
var constants = require('../../constants.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var importAssets__default = /*#__PURE__*/_interopDefaultLegacy(importAssets);
var livereload__default = /*#__PURE__*/_interopDefaultLegacy(livereload);
var polyfill__default = /*#__PURE__*/_interopDefaultLegacy(polyfill);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

function typecheckWatchPlugin() {
    let tscProcess = null;
    return {
        name: 'typecheck-watch',
        buildEnd() {
            if (tscProcess) {
                logger.logger.end('Check TypeScript');
                tscProcess.kill();
            }
            logger.logger.start('Check TypeScript');
            tscProcess = node_child_process.spawn('tsc', ['--noEmit'], {
                stdio: 'inherit',
                shell: true,
            });
            tscProcess.on('close', () => {
                logger.logger.end('Check TypeScript');
            });
        },
    };
}
function start({ node = false, inject = false, error = false, typeCheck = false, usualConsoleOutput = false, index = 'index', }, instance) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob__default["default"].sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.logger.start('Remove build', () => fs__default["default"].remove(params.devBuildFolder));
        const plugins = [];
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output: {
                dir: params.devBuildFolder,
                sourcemap: true,
            },
            plugins,
        };
        let preset;
        instance.withLint(options);
        if (node) {
            preset = { NODE_ENV: 'dev' };
            // @ts-expect-error
            options.output.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            plugins.push(rollupPluginString.string({
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
                    silenceDeprecations: ['legacy-js-api'],
                },
                plugins: [autoprefixer__default["default"]()],
                autoModules: params.cssModules ? (id) => !id.includes('.global.') : true,
                sourceMap: true,
            }), rollupPluginString.string({
                include: '**/*.*',
                exclude: constants.stringExcludeDom,
            }), instance.createClient(key, cert, pkg, path__default["default"].parse(input[0]).name, inject), livereload__default["default"](Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [params.devBuildFolder, params.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
            if (typeCheck) {
                plugins.push(typecheckWatchPlugin());
            }
        }
        instance.withEnv(options, true, preset);
        const watcher = rolldown.watch(options);
        watcher.on('event', (e) => tslib.__awaiter(this, void 0, void 0, function* () {
            if (e.code === 'ERROR') {
                logger.logger.end('Bundling', error ? e.error.stack : e.error.message);
            }
            else if (e.code === 'BUNDLE_START') {
                logger.logger.start('Bundling');
            }
            else if (e.code === 'BUNDLE_END') {
                logger.logger.end('Bundling');
            }
        }));
    });
}

exports.start = start;
exports.typecheckWatchPlugin = typecheckWatchPlugin;
