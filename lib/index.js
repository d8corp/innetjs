'use strict';

var path$1 = require('path');
var fs = require('fs-extra');
var http = require('http');
var https = require('https');
var util = require('util');
var axios = require('axios');
var logger = require('@cantinc/logger');
var chalk = require('chalk');
var rollup = require('rollup');
var commonjs = require('@rollup/plugin-commonjs');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var rollupPluginTerser = require('rollup-plugin-terser');
var typescript = require('rollup-plugin-typescript2');
var styles = require('rollup-plugin-styles');
var autoprefixer = require('autoprefixer');
var express = require('express');
var json = require('@rollup/plugin-json');
var tmp = require('tmp');
var proxy = require('express-http-proxy');
var selector = require('cli-select');
var prompt = require('prompts');
var jsx = require('rollup-plugin-innet-jsx');
var filesize = require('rollup-plugin-filesize');
var image = require('@rollup/plugin-image');
var eslint = require('@rollup/plugin-eslint');
var injectEnv = require('rollup-plugin-inject-process-env');
var linesAndColumns = require('lines-and-columns');
var unzipper = require('unzipper');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path$1);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
var typescript__default = /*#__PURE__*/_interopDefaultLegacy(typescript);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var tmp__default = /*#__PURE__*/_interopDefaultLegacy(tmp);
var proxy__default = /*#__PURE__*/_interopDefaultLegacy(proxy);
var selector__default = /*#__PURE__*/_interopDefaultLegacy(selector);
var prompt__default = /*#__PURE__*/_interopDefaultLegacy(prompt);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);
var filesize__default = /*#__PURE__*/_interopDefaultLegacy(filesize);
var image__default = /*#__PURE__*/_interopDefaultLegacy(image);
var eslint__default = /*#__PURE__*/_interopDefaultLegacy(eslint);
var injectEnv__default = /*#__PURE__*/_interopDefaultLegacy(injectEnv);

/******************************************************************************
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

const Writer = require('fstream').Writer;
const path = require('path');
const stream = require('stream');
const duplexer2 = require('duplexer2');
const Promise$1 = require('bluebird');
function Extract(opts, template) {
    const reduceCount = 19 + template.length;
    // make sure path is normalized before using it
    opts.path = path.resolve(path.normalize(opts.path));
    // @ts-ignore
    const parser = new unzipper.Parse(opts);
    const outStream = new stream.Writable({ objectMode: true });
    outStream._write = function (entry, encoding, cb) {
        if (entry.type === 'Directory')
            return cb();
        const extractPath = path.join(opts.path, entry.path.slice(reduceCount));
        if (extractPath.indexOf(opts.path) !== 0) {
            return cb();
        }
        const writer = opts.getWriter ? opts.getWriter({ path: extractPath }) : Writer({ path: extractPath });
        entry.pipe(writer)
            .on('error', cb)
            .on('close', cb);
    };
    const extract = duplexer2(parser, outStream);
    parser.once('crx-header', function (crxHeader) {
        extract.crxHeader = crxHeader;
    });
    parser
        .pipe(outStream)
        .on('finish', function () {
        extract.emit('close');
    });
    extract.promise = function () {
        return new Promise$1(function (resolve, reject) {
            extract.on('close', resolve);
            extract.on('error', reject);
        });
    };
    return extract;
}

const lintIncludeDom = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
];
const stringExcludeDom = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
    '**/*.css',
    '**/*.scss',
    '**/*.webp',
    '**/*.gif',
    '**/*.png',
    '**/*.jpeg',
    '**/*.jpg',
    '**/*.svg',
];
const stringExcludeNode = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
];

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
function convertIndexFile(data, version) {
    return __awaiter(this, void 0, void 0, function* () {
        return data
            .toString()
            .replace('</head>', `<script type="module" defer src="index.js${version ? `?v=${version}` : ''}"></script></head>`);
    });
}
const reporter = (options, outputOptions, info) => {
    logger__default["default"].log(`${chalk__default["default"].yellow(info.fileName)} ${chalk__default["default"].green(info.bundleSize)} [ gzip: ${chalk__default["default"].green(info.gzipSize)} ]`);
    return '';
};

const livereload = require('rollup-plugin-livereload');
const { string } = require('rollup-plugin-string');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const execAsync = util.promisify(exec);
const copyFiles = util.promisify(fs__default["default"].copy);
require('dotenv').config();
const innetEnv = Object.keys(process.env).reduce((result, key) => {
    if (key.startsWith('INNETJS_')) {
        result[key] = process.env[key];
    }
    return result;
}, {});
class InnetJS {
    constructor({ projectFolder = process.env.PROJECT_FOLDER || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '/api/?*', } = {}) {
        this.projectFolder = path__default["default"].resolve(projectFolder);
        this.publicFolder = path__default["default"].resolve(publicFolder);
        this.buildFolder = path__default["default"].resolve(buildFolder);
        this.srcFolder = path__default["default"].resolve(srcFolder);
        this.publicIndexFile = path__default["default"].join(publicFolder, 'index.html');
        this.buildIndexFile = path__default["default"].join(buildFolder, 'index.html');
        this.devBuildFolder = path__default["default"].resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build');
        this.devBuildIndexFile = path__default["default"].join(this.devBuildFolder, 'index.html');
        this.sourcemap = sourcemap;
        this.cssModules = cssModules;
        this.cssInJs = cssInJs;
        this.sslKey = sslKey;
        this.sslCrt = sslCrt;
        this.port = port;
        this.proxy = proxy;
        this.api = api;
    }
    // Methods
    init(appName, { template, force = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPath = path__default["default"].resolve(appName);
            const { data } = yield logger__default["default"].start('Get templates list', () => __awaiter(this, void 0, void 0, function* () { return yield axios__default["default"].get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
            const templates = data.map(({ name }) => name).filter(name => name !== 'main');
            if (!template || !templates.includes(template)) {
                logger__default["default"].log(chalk__default["default"].green(`Select one of those templates`));
                const { value } = yield selector__default["default"]({
                    values: templates
                });
                template = value;
                readline.moveCursor(process.stdout, 0, -1);
                const text = `Selected template: ${chalk__default["default"].white(value)}`;
                logger__default["default"].start(text);
                logger__default["default"].end(text);
            }
            if (!force) {
                yield logger__default["default"].start('Check if app folder is available', () => __awaiter(this, void 0, void 0, function* () {
                    if (fs__default["default"].existsSync(appPath)) {
                        logger__default["default"].log(chalk__default["default"].red(`'${appPath}' already exist, what do you want?`));
                        const { id: result, value } = yield selector__default["default"]({
                            values: ['Stop the process', 'Remove the folder', 'Merge with template']
                        });
                        readline.moveCursor(process.stdout, 0, -1);
                        logger__default["default"].log(`Already exist, selected: ${value}`);
                        if (!result) {
                            throw Error(`'${appPath}' already exist`);
                        }
                        if (result === 1) {
                            yield fs__default["default"].remove(appPath);
                        }
                    }
                }));
            }
            yield logger__default["default"].start('Download template', () => __awaiter(this, void 0, void 0, function* () {
                const { data } = yield axios__default["default"].get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                    responseType: 'stream'
                });
                yield new Promise((resolve, reject) => {
                    data.pipe(Extract({
                        path: appPath,
                    }, template)).on('finish', resolve).on('error', reject);
                });
            }));
            yield logger__default["default"].start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const inputOptions = {
                input: path__default["default"].resolve(this.srcFolder, `index.${indexExtension}`),
                preserveEntrySignatures: 'strict',
                plugins: [
                    commonjs__default["default"](),
                    json__default["default"](),
                    typescript__default["default"](),
                    jsx__default["default"](),
                ]
            };
            const outputOptions = {
                dir: this.buildFolder,
                sourcemap: this.sourcemap
            };
            if (node) {
                outputOptions.format = 'cjs';
                inputOptions.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                inputOptions.plugins.push(pluginNodeResolve.nodeResolve({
                    moduleDirectories: [path__default["default"].resolve(this.buildFolder, 'node_modules')]
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }));
            }
            else {
                inputOptions.plugins = [
                    eslint__default["default"]({
                        include: lintIncludeDom,
                    }),
                    ...inputOptions.plugins,
                    pluginNodeResolve.nodeResolve(),
                    image__default["default"](),
                    styles__default["default"]({
                        mode: this.cssInJs ? 'inject' : 'extract',
                        url: true,
                        plugins: [autoprefixer__default["default"]()],
                        modules: this.cssModules,
                        sourceMap: this.sourcemap,
                        minimize: true,
                    }),
                    string({
                        include: '**/*.*',
                        exclude: stringExcludeDom,
                    }),
                    injectEnv__default["default"](innetEnv),
                ];
                outputOptions.format = 'es';
                outputOptions.plugins = [
                    rollupPluginTerser.terser(),
                    filesize__default["default"]({
                        reporter,
                    }),
                ];
            }
            yield logger__default["default"].start('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup__default["default"].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
                if (!node) {
                    yield copyFiles(this.publicFolder, this.buildFolder);
                    const data = yield fs.promises.readFile(this.publicIndexFile);
                    const pkg = yield this.getPackage();
                    yield fs.promises.writeFile(this.buildIndexFile, yield convertIndexFile(data, pkg.version));
                }
            }));
            if (pkg) {
                yield logger__default["default"].start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                    const data = Object.assign({}, pkg);
                    delete data.private;
                    delete data.devDependencies;
                    yield fs__default["default"].writeFile(path__default["default"].resolve(this.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
                }));
                const pkgLockPath = path__default["default"].resolve(this.projectFolder, 'package-lock.json');
                if (fs__default["default"].existsSync(pkgLockPath)) {
                    yield logger__default["default"].start('Copy package-lock.json', () => {
                        return fs__default["default"].copy(pkgLockPath, path__default["default"].resolve(this.buildFolder, 'package-lock.json'));
                    });
                }
            }
        });
    }
    start({ node = false, error = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            const pkg = yield this.getPackage();
            yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(this.devBuildFolder));
            const options = {
                input: path__default["default"].resolve(this.srcFolder, `index.${indexExtension}`),
                preserveEntrySignatures: 'strict',
                output: {
                    dir: this.devBuildFolder,
                    sourcemap: true
                },
                plugins: [
                    commonjs__default["default"](),
                    json__default["default"](),
                    typescript__default["default"]({
                        tsconfigOverride: {
                            compilerOptions: {
                                sourceMap: true
                            }
                        }
                    }),
                    jsx__default["default"](),
                ],
            };
            if (node) {
                options.output.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(pluginNodeResolve.nodeResolve({
                    moduleDirectories: [path__default["default"].resolve(this.srcFolder, 'node_modules')]
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }), this.createServer(options.external));
            }
            else {
                const key = path__default["default"].basename(this.sslKey) !== this.sslKey
                    ? this.sslKey
                    : fs__default["default"].existsSync(this.sslKey)
                        ? fs__default["default"].readFileSync(this.sslKey)
                        : undefined;
                const cert = path__default["default"].basename(this.sslCrt) !== this.sslCrt
                    ? this.sslCrt
                    : fs__default["default"].existsSync(this.sslCrt)
                        ? fs__default["default"].readFileSync(this.sslCrt)
                        : undefined;
                options.output.format = 'es';
                options.plugins = [
                    eslint__default["default"]({
                        include: lintIncludeDom,
                    }),
                    ...options.plugins,
                    pluginNodeResolve.nodeResolve(),
                    image__default["default"](),
                    styles__default["default"]({
                        mode: this.cssInJs ? 'inject' : 'extract',
                        url: true,
                        plugins: [autoprefixer__default["default"]()],
                        modules: this.cssModules,
                        sourceMap: true,
                    }),
                    string({
                        include: '**/*.*',
                        exclude: stringExcludeDom,
                    }),
                    this.createClient(key, cert, pkg),
                    livereload(Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [this.devBuildFolder, this.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))),
                    injectEnv__default["default"](innetEnv),
                ];
            }
            const watcher = rollup__default["default"].watch(options);
            watcher.on('event', (e) => __awaiter(this, void 0, void 0, function* () {
                if (e.code == 'ERROR') {
                    if (e.error.code === 'UNRESOLVED_IMPORT') {
                        const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || [];
                        const text = (yield fs__default["default"].readFile(file)).toString();
                        const lines = new linesAndColumns.LinesAndColumns(text);
                        const { line, column } = lines.locationForIndex(text.indexOf(importer));
                        logger__default["default"].end('Bundling', e.error.message);
                        console.log(`ERROR in ${file}:${line + 1}:${column + 1}`);
                    }
                    else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs'].includes(e.error.plugin)) {
                        const [, file, line, column] = e.error.message.match(/^[^(]+(src[^(]+)\((\d+),(\d+)\)/) || [];
                        logger__default["default"].end('Bundling', e.error.message);
                        if (file) {
                            console.log(`ERROR in ${file}:${line}:${column}`);
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
    run(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = yield logger__default["default"].start('Check file', () => getFile(file));
            const folder = yield new Promise((resolve, reject) => {
                tmp__default["default"].dir((err, folder) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(folder);
                    }
                });
            });
            const jsFilePath = `${folder}/index.js`;
            yield logger__default["default"].start('Build bundle', () => __awaiter(this, void 0, void 0, function* () {
                const inputOptions = {
                    input,
                    plugins: [
                        commonjs__default["default"](),
                        pluginNodeResolve.nodeResolve(),
                        json__default["default"](),
                        typescript__default["default"]({
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
                const bundle = yield rollup__default["default"].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            yield logger__default["default"].start('Running of the script', () => __awaiter(this, void 0, void 0, function* () {
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
            yield logger__default["default"].start('Check src', () => {
                if (!fs__default["default"].existsSync(this.srcFolder)) {
                    throw Error('src folder is missing');
                }
            });
            yield logger__default["default"].start('Detection of index file', () => {
                if (fs__default["default"].existsSync(path__default["default"].join(this.srcFolder, 'index.js'))) {
                    this.projectExtension = 'js';
                }
                else if (fs__default["default"].existsSync(path__default["default"].join(this.srcFolder, 'index.ts'))) {
                    this.projectExtension = 'ts';
                }
                else if (fs__default["default"].existsSync(path__default["default"].join(this.srcFolder, 'index.tsx'))) {
                    this.projectExtension = 'tsx';
                }
                else if (fs__default["default"].existsSync(path__default["default"].join(this.srcFolder, 'index.jsx'))) {
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
            const packageFolder = path__default["default"].resolve(this.projectFolder, 'package.json');
            yield logger__default["default"].start('Check package.json', () => __awaiter(this, void 0, void 0, function* () {
                if (fs__default["default"].existsSync(packageFolder)) {
                    this.package = yield fs__default["default"].readJson(packageFolder);
                }
            }));
            return this.package;
        });
    }
    createClient(key, cert, pkg) {
        let app;
        return {
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (!app) {
                    app = express__default["default"]();
                    const update = () => __awaiter(this, void 0, void 0, function* () {
                        const data = yield fs.promises.readFile(this.publicIndexFile);
                        yield fs.promises.writeFile(this.devBuildIndexFile, yield convertIndexFile(data, pkg.version));
                    });
                    fs__default["default"].watch(this.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(express__default["default"].static(this.devBuildFolder));
                    app.use(express__default["default"].static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        app.use(this.api, proxy__default["default"](this.proxy, {
                            https: httpsUsing,
                            proxyReqPathResolver: req => req.originalUrl
                        }));
                    }
                    app.use(/^[^.]+$/, (req, res) => {
                        res.sendFile(this.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https__default["default"].createServer({ key, cert }, app) : http__default["default"].createServer(app);
                    let port = this.port;
                    const listener = () => {
                        console.log(`${chalk__default["default"].green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${port}`);
                    };
                    server.listen(port, listener);
                    server.on('error', (e) => __awaiter(this, void 0, void 0, function* () {
                        if (e.code === 'EADDRINUSE') {
                            port++;
                            const { userPort } = yield prompt__default["default"]({
                                name: 'userPort',
                                type: 'number',
                                message: `Port ${e.port} is reserved, please enter another one [${port}]:`
                            });
                            if (userPort) {
                                port = userPort;
                            }
                            server.listen(port);
                        }
                        else {
                            throw e;
                        }
                    }));
                }
            })
        };
    }
    createServer(external) {
        let app;
        return {
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                app === null || app === void 0 ? void 0 : app.kill();
                const filePath = path__default["default"].resolve(this.buildFolder, 'index.js');
                let data = yield fs__default["default"].readFile(filePath, 'UTF-8');
                const regExp = new RegExp(`require\\('(${external.join('|')})'\\)`, 'g');
                data = data.replace(regExp, `require('${path__default["default"].resolve(this.projectFolder, 'node_modules', '$1')}')`);
                yield fs__default["default"].writeFile(filePath, data);
                app = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
            })
        };
    }
}

module.exports = InnetJS;
