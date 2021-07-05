'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var fs = require('fs-extra');
var http = require('http');
var https = require('https');
var ora = require('ora');
var chalk = require('chalk');
var util = require('util');
var rollup = require('rollup');
var commonjs = require('@rollup/plugin-commonjs');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var rollupPluginTerser = require('rollup-plugin-terser');
var typescript = require('rollup-plugin-typescript2');
var postcss = require('rollup-plugin-postcss');
var autoprefixer = require('autoprefixer');
var express = require('express');
var json = require('@rollup/plugin-json');
var tmp = require('tmp');
var proxy = require('express-http-proxy');
var selector = require('cli-select');
var jsx = require('rollup-plugin-innet-jsx');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
var typescript__default = /*#__PURE__*/_interopDefaultLegacy(typescript);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var tmp__default = /*#__PURE__*/_interopDefaultLegacy(tmp);
var proxy__default = /*#__PURE__*/_interopDefaultLegacy(proxy);
var selector__default = /*#__PURE__*/_interopDefaultLegacy(selector);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const livereload = require('rollup-plugin-livereload');
const { string } = require('rollup-plugin-string');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const execAsync = util.promisify(exec);
require('dotenv').config();
function getFile(file) {
    file = path__default['default'].resolve(file);
    if (!fs__default['default'].existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    if (fs__default['default'].lstatSync(file).isDirectory()) {
        let tmpFile = file;
        if (!fs__default['default'].existsSync(tmpFile = path__default['default'].join(file, 'index.ts')) &&
            !fs__default['default'].existsSync(tmpFile = path__default['default'].join(file, 'index.tsx')) &&
            !fs__default['default'].existsSync(tmpFile = path__default['default'].join(file, 'index.js'))) {
            throw Error('Cannot find index file in: ' + file);
        }
        file = tmpFile;
    }
    else if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) {
        throw Error('File should has `.ts` or `.tsx` or `.js` extension: ' + file);
    }
    if (!fs__default['default'].existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    return file;
}
function task(name, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = ora__default['default'](name).start();
        try {
            const result = yield callback(task);
            task.succeed();
            readline.clearLine(process.stdout, 1);
            return result;
        }
        catch (e) {
            task.fail();
            readline.clearLine(process.stdout, 1);
            console.log(chalk__default['default'].red('└ ' + ((e === null || e === void 0 ? void 0 : e.message) || e)));
            return Promise.reject(e);
        }
    });
}
class InnetJS {
    constructor({ projectFolder = process.env.PROJECT_FOLDER || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', buildFolder = process.env.BUILD_FOLDER || path__default['default'].join('public', 'build'), srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : false, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : false, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', port = process.env.PORT ? +process.env.PORT : 3000, } = {}) {
        this.projectFolder = path__default['default'].resolve(projectFolder);
        this.publicFolder = path__default['default'].resolve(publicFolder);
        this.buildFolder = path__default['default'].resolve(buildFolder);
        this.srcFolder = path__default['default'].resolve(srcFolder);
        this.sourcemap = sourcemap;
        this.cssModules = cssModules;
        this.cssInJs = cssInJs;
        this.sslKey = sslKey;
        this.sslCrt = sslCrt;
        this.port = port;
        this.proxy = proxy;
    }
    // Methods
    init(appName, { template = 'fe', force = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPath = path__default['default'].resolve(appName);
            if (!force) {
                yield task('Check if app folder is available', (task) => __awaiter(this, void 0, void 0, function* () {
                    if (fs__default['default'].existsSync(appPath)) {
                        task.fail();
                        console.log(chalk__default['default'].red(`└ '${appPath}' already exist, what do you want?`));
                        const { id: result } = yield selector__default['default']({
                            values: ['Stop the process', 'Remove the folder', 'Merge with template']
                        });
                        readline.moveCursor(process.stdout, 0, -2);
                        if (!result) {
                            throw Error(`'${appPath}' already exist`);
                        }
                        if (result === 1) {
                            yield fs__default['default'].remove(appPath);
                        }
                    }
                }));
            }
            const libPath = path__default['default'].resolve(__dirname, '..');
            const templatePath = path__default['default'].resolve(libPath, 'templates', template);
            yield task('Check if the template exists', () => {
                if (!fs__default['default'].existsSync(templatePath)) {
                    throw Error(`The template '${template}' is not exist`);
                }
            });
            yield task('Copy files', () => fs__default['default'].copy(templatePath, appPath));
            yield task('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            yield task('Remove build', () => fs__default['default'].remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const inputOptions = {
                input: path__default['default'].resolve(this.srcFolder, `index.${indexExtension}`),
                plugins: [
                    commonjs__default['default'](),
                    pluginNodeResolve.nodeResolve(),
                    json__default['default'](),
                    typescript__default['default'](),
                    jsx__default['default'](),
                    string({
                        include: '**/*.*',
                        exclude: [
                            '**/*.ts',
                            '**/*.tsx',
                            '**/*.js',
                            '**/*.jsx',
                            '**/*.json',
                            '**/*.css',
                            '**/*.scss',
                        ]
                    }),
                ]
            };
            const outputOptions = {
                dir: this.buildFolder,
                sourcemap: this.sourcemap
            };
            if (node) {
                inputOptions.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                outputOptions.format = 'cjs';
            }
            else {
                inputOptions.plugins.push(postcss__default['default']({
                    plugins: [autoprefixer__default['default']()],
                    extract: !this.cssInJs,
                    modules: this.cssModules,
                    sourceMap: this.sourcemap,
                    minimize: true
                }));
                outputOptions.format = 'iife';
                outputOptions.plugins = [rollupPluginTerser.terser()];
            }
            yield task('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup__default['default'].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            if (pkg) {
                yield task('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                    const data = Object.assign({}, pkg);
                    delete data.private;
                    delete data.devDependencies;
                    yield fs__default['default'].writeFile(path__default['default'].resolve(this.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
                }));
                const pkgLockPath = path__default['default'].resolve(this.projectFolder, 'package-lock.json');
                if (fs__default['default'].existsSync(pkgLockPath)) {
                    yield task('Copy package-lock.json', () => {
                        return fs__default['default'].copy(pkgLockPath, path__default['default'].resolve(this.buildFolder, 'package-lock.json'));
                    });
                }
            }
        });
    }
    start({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            const pkg = node && (yield this.getPackage());
            yield task('Remove build', () => fs__default['default'].remove(this.buildFolder));
            const options = {
                input: path__default['default'].resolve(this.srcFolder, `index.${indexExtension}`),
                output: {
                    dir: this.buildFolder,
                    sourcemap: true
                },
                plugins: [
                    commonjs__default['default'](),
                    json__default['default'](),
                    typescript__default['default']({
                        tsconfigOverride: {
                            compilerOptions: {
                                sourceMap: true
                            }
                        }
                    }),
                    jsx__default['default'](),
                ],
            };
            if (node) {
                options.output.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(pluginNodeResolve.nodeResolve({
                    moduleDirectories: [path__default['default'].resolve(this.srcFolder, 'node_modules')]
                }), string({
                    include: '**/*.*',
                    exclude: [
                        '**/*.ts',
                        '**/*.tsx',
                        '**/*.js',
                        '**/*.jsx',
                        '**/*.json',
                    ]
                }), this.createServer(options.external));
            }
            else {
                const key = path__default['default'].basename(this.sslKey) !== this.sslKey
                    ? this.sslKey
                    : fs__default['default'].existsSync(this.sslKey)
                        ? fs__default['default'].readFileSync(this.sslKey)
                        : undefined;
                const cert = path__default['default'].basename(this.sslCrt) !== this.sslCrt
                    ? this.sslCrt
                    : fs__default['default'].existsSync(this.sslCrt)
                        ? fs__default['default'].readFileSync(this.sslCrt)
                        : undefined;
                options.output.format = 'iife';
                options.plugins.push(pluginNodeResolve.nodeResolve(), string({
                    include: '**/*.*',
                    exclude: [
                        '**/*.ts',
                        '**/*.tsx',
                        '**/*.js',
                        '**/*.jsx',
                        '**/*.json',
                        '**/*.css',
                        '**/*.scss',
                    ]
                }), postcss__default['default']({
                    plugins: [autoprefixer__default['default']()],
                    modules: this.cssModules,
                    sourceMap: true,
                    extract: !this.cssInJs,
                }), this.createClient(key, cert), livereload(Object.assign({ watch: this.publicFolder, verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
            }
            const watcher = rollup__default['default'].watch(options);
            let eventTask;
            watcher.on('event', e => {
                if (e.code == 'ERROR') {
                    eventTask.fail('Bundling is failed');
                    console.log(chalk__default['default'].red('└ ' + e.error.message));
                }
                else if (e.code === 'BUNDLE_START') {
                    if (!!(eventTask === null || eventTask === void 0 ? void 0 : eventTask.isSpinning)) {
                        eventTask.stop();
                    }
                    eventTask = ora__default['default']('Bundling\n').start();
                }
                else if (e.code === 'BUNDLE_END') {
                    if (eventTask.isSpinning) {
                        eventTask.succeed('Bundle is ready');
                    }
                }
            });
        });
    }
    run(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = yield task('Check file', () => getFile(file));
            const folder = yield new Promise((resolve, reject) => {
                tmp__default['default'].dir((err, folder) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(folder);
                    }
                });
            });
            const jsFilePath = `${folder}/index.js`;
            yield task('Build bundle', () => __awaiter(this, void 0, void 0, function* () {
                const inputOptions = {
                    input,
                    plugins: [
                        commonjs__default['default'](),
                        pluginNodeResolve.nodeResolve(),
                        json__default['default'](),
                        typescript__default['default']({
                            tsconfigOverride: {
                                compilerOptions: {
                                    sourceMap: true
                                }
                            }
                        })
                    ]
                };
                const outputOptions = {
                    format: 'cjs',
                    file: jsFilePath,
                    sourcemap: true
                };
                const bundle = yield rollup__default['default'].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            yield task('Running of the script', () => __awaiter(this, void 0, void 0, function* () {
                spawn('node', ['-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
            }));
        });
    }
    // Utils
    getProjectExtension() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.projectExtension) {
                return this.projectExtension;
            }
            yield task('Check src', () => {
                if (!fs__default['default'].existsSync(this.srcFolder)) {
                    throw Error('src folder is missing');
                }
            });
            yield task('Detection of index file', () => {
                if (fs__default['default'].existsSync(path__default['default'].join(this.srcFolder, 'index.js'))) {
                    this.projectExtension = 'js';
                }
                else if (fs__default['default'].existsSync(path__default['default'].join(this.srcFolder, 'index.ts'))) {
                    this.projectExtension = 'ts';
                }
                else if (fs__default['default'].existsSync(path__default['default'].join(this.srcFolder, 'index.tsx'))) {
                    this.projectExtension = 'tsx';
                }
                else if (fs__default['default'].existsSync(path__default['default'].join(this.srcFolder, 'index.jsx'))) {
                    this.projectExtension = 'jsx';
                }
                else {
                    throw Error('index file is not detected');
                }
            });
            return this.projectExtension;
        });
    }
    getPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.package) {
                return this.package;
            }
            const packageFolder = path__default['default'].resolve(this.projectFolder, 'package.json');
            yield task('Check package.json', () => __awaiter(this, void 0, void 0, function* () {
                if (fs__default['default'].existsSync(packageFolder)) {
                    this.package = yield fs__default['default'].readJson(packageFolder);
                }
            }));
            return this.package;
        });
    }
    createClient(key, cert) {
        let app;
        return {
            writeBundle: () => {
                var _a;
                if (!app) {
                    const httpsUsing = !!(cert && key);
                    app = express__default['default']();
                    app.use(express__default['default'].static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        app.use(proxy__default['default'](this.proxy, {
                            https: httpsUsing
                        }));
                    }
                    const server = httpsUsing ? https__default['default'].createServer({ key, cert }, app) : http__default['default'].createServer(app);
                    server.listen(this.port, () => {
                        console.log(`${chalk__default['default'].green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${this.port}`);
                    });
                }
            }
        };
    }
    createServer(external) {
        let app;
        return {
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                app === null || app === void 0 ? void 0 : app.kill();
                const filePath = path__default['default'].resolve(this.buildFolder, 'index.js');
                let data = yield fs__default['default'].readFile(filePath, 'UTF-8');
                const regExp = new RegExp(`require\\('(${external.join('|')})'\\)`, 'g');
                data = data.replace(regExp, `require('${path__default['default'].resolve(this.projectFolder, 'node_modules', '$1')}')`);
                yield fs__default['default'].writeFile(filePath, data);
                app = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
            })
        };
    }
}

exports.default = InnetJS;
exports.task = task;
