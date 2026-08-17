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
var env = require('rollup-plugin-process-env');
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
var env__default = /*#__PURE__*/_interopDefaultLegacy(env);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

function typecheckWatchPlugin() {
    let tscProcess = null;
    return {
        name: 'type-check',
        buildStart() {
            if (tscProcess) {
                logger.logger.end('Check TypeScript');
                tscProcess.kill();
            }
            logger.logger.start('Check TypeScript');
            tscProcess = node_child_process.spawn('tsc', ['--noEmit'], {
                stdio: 'inherit',
                shell: true,
            });
            tscProcess.on('close', (code) => {
                logger.logger.end('Check TypeScript', code ? 'TypeScript has errors' : undefined);
            });
        },
    };
}
function lintCheckWatchPlugin() {
    let lintProcess = null;
    return {
        name: 'lint-check',
        buildStart() {
            if (lintProcess) {
                logger.logger.end('Check ESLint');
                lintProcess.kill();
            }
            logger.logger.start('Check ESLint');
            lintProcess = node_child_process.spawn('eslint', ['src'], {
                stdio: 'inherit',
                shell: true,
            });
            lintProcess.on('close', (code) => {
                logger.logger.end('Check ESLint', code ? 'ESLint has errors' : undefined);
            });
        },
    };
}
function start(_a, instance_1) {
    return tslib.__awaiter(this, arguments, void 0, function* ({ node = false, inject = false, error = false, typeCheck = false, lintCheck = false, usualConsoleOutput = false, index = 'index', }, instance) {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob__default["default"].sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.logger.start('Remove build', () => fs__default["default"].remove(params.devBuildFolder));
        const plugins = [];
        const output = {
            dir: params.devBuildFolder,
            sourcemap: true,
        };
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output,
            plugins,
        };
        let preset;
        if (node) {
            preset = { NODE_ENV: 'dev' };
            output.format = 'cjs';
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
            output.format = 'es';
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
        }
        if (typeCheck) {
            plugins.push(typecheckWatchPlugin());
        }
        if (lintCheck) {
            plugins.push(lintCheckWatchPlugin());
        }
        plugins.push(env__default["default"](this.params.envPrefix, {
            include: input,
            virtual: true,
            preset,
        }));
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

exports.lintCheckWatchPlugin = lintCheckWatchPlugin;
exports.start = start;
exports.typecheckWatchPlugin = typecheckWatchPlugin;
