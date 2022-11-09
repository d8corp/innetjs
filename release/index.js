'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./_virtual/_rollup-plugin-inject-process-env.js');
var tslib = require('tslib');
var logger = require('@cantinc/logger');
var commonjs = require('@rollup/plugin-commonjs');
var eslint = require('@rollup/plugin-eslint');
var image = require('@rollup/plugin-image');
var json = require('@rollup/plugin-json');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var address = require('address');
var autoprefixer = require('autoprefixer');
var axios = require('axios');
var chalk = require('chalk');
var selector = require('cli-select');
var express = require('express');
var proxy = require('express-http-proxy');
var fs = require('fs-extra');
var glob = require('glob');
var http = require('node:http');
var https = require('node:https');
var linesAndColumns = require('lines-and-columns');
var path = require('node:path');
var prompt = require('prompts');
var rollup = require('rollup');
var filesize = require('rollup-plugin-filesize');
var injectEnv = require('rollup-plugin-inject-process-env');
var jsx = require('rollup-plugin-innet-jsx');
var externals = require('rollup-plugin-node-externals');
var polyfill = require('rollup-plugin-polyfill-node');
var rollupPluginPreserveShebangs = require('rollup-plugin-preserve-shebangs');
var styles = require('rollup-plugin-styles');
var rollupPluginTerser = require('rollup-plugin-terser');
var typescript = require('rollup-plugin-typescript2');
var tmp = require('tmp');
var node_util = require('node:util');
var constants = require('./constants.js');
var extract = require('./extract.js');
var helpers = require('./helpers.js');
var updateDotenv = require('./updateDotenv.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
var eslint__default = /*#__PURE__*/_interopDefaultLegacy(eslint);
var image__default = /*#__PURE__*/_interopDefaultLegacy(image);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var address__default = /*#__PURE__*/_interopDefaultLegacy(address);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var selector__default = /*#__PURE__*/_interopDefaultLegacy(selector);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var proxy__default = /*#__PURE__*/_interopDefaultLegacy(proxy);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var prompt__default = /*#__PURE__*/_interopDefaultLegacy(prompt);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var filesize__default = /*#__PURE__*/_interopDefaultLegacy(filesize);
var injectEnv__default = /*#__PURE__*/_interopDefaultLegacy(injectEnv);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);
var externals__default = /*#__PURE__*/_interopDefaultLegacy(externals);
var polyfill__default = /*#__PURE__*/_interopDefaultLegacy(polyfill);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);
var typescript__default = /*#__PURE__*/_interopDefaultLegacy(typescript);
var tmp__default = /*#__PURE__*/_interopDefaultLegacy(tmp);

const livereload = require('rollup-plugin-livereload');
const { string } = require('rollup-plugin-string');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const execAsync = node_util.promisify(exec);
const copyFiles = node_util.promisify(fs__default["default"].copy);
updateDotenv.updateDotenv();
const REG_CLEAR_TEXT = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
function normalizeEnv(value) {
    if (value) {
        return value.replace(/\${([a-zA-Z0-9]+)}/g, (placeholder, placeholderId) => { var _a; return (_a = process.env[placeholderId]) !== null && _a !== void 0 ? _a : placeholder; });
    }
}
const innetEnv = Object.keys(process.env).reduce((result, key) => {
    if (key.startsWith('INNETJS_')) {
        result[key] = normalizeEnv(process.env[key]);
    }
    return result;
}, {});
const scriptExtensions = ['ts', 'js', 'tsx', 'jsx'];
const indexExt = scriptExtensions.join(',');
class InnetJS {
    constructor({ projectFolder = process.env.PROJECT_FOLDER || '', baseUrl = process.env.BASE_URL || '/', publicFolder = process.env.PUBLIC_FOLDER || 'public', releaseFolder = process.env.RELEASE_FOLDER || 'release', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '/api/?*', } = {}) {
        this.projectFolder = path__default["default"].resolve(projectFolder);
        this.publicFolder = path__default["default"].resolve(publicFolder);
        this.releaseFolder = path__default["default"].resolve(releaseFolder);
        this.buildFolder = path__default["default"].resolve(buildFolder);
        this.srcFolder = path__default["default"].resolve(srcFolder);
        this.licenseFile = path__default["default"].join(projectFolder, 'LICENSE');
        this.licenseReleaseFile = path__default["default"].join(releaseFolder, 'LICENSE');
        this.readmeFile = path__default["default"].join(projectFolder, 'README.md');
        this.readmeReleaseFile = path__default["default"].join(releaseFolder, 'README.md');
        this.declarationFile = path__default["default"].join(srcFolder, 'declaration.d.ts');
        this.declarationReleaseFile = path__default["default"].join(releaseFolder, 'declaration.d.ts');
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
        this.baseUrl = baseUrl;
    }
    // Methods
    init(appName, { template, force = false } = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const appPath = path__default["default"].resolve(appName);
            const { data } = yield logger__default["default"].start('Get templates list', () => tslib.__awaiter(this, void 0, void 0, function* () { return yield axios__default["default"].get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
            const templates = data.map(({ name }) => name).filter(name => name !== 'main');
            if (!template || !templates.includes(template)) {
                logger__default["default"].log(chalk__default["default"].green('Select one of those templates'));
                const { value } = yield selector__default["default"]({
                    values: templates,
                });
                template = value;
                readline.moveCursor(process.stdout, 0, -1);
                const text = `Selected template: ${chalk__default["default"].white(value)}`;
                logger__default["default"].start(text);
                logger__default["default"].end(text);
            }
            if (!force) {
                yield logger__default["default"].start('Check if app folder is available', () => tslib.__awaiter(this, void 0, void 0, function* () {
                    if (fs__default["default"].existsSync(appPath)) {
                        logger__default["default"].log(chalk__default["default"].red(`'${appPath}' already exist, what do you want?`));
                        const { id: result, value } = yield selector__default["default"]({
                            values: ['Stop the process', 'Remove the folder', 'Merge with template'],
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
            yield logger__default["default"].start('Download template', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { data } = yield axios__default["default"].get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                    responseType: 'stream',
                });
                yield new Promise((resolve, reject) => {
                    data.pipe(extract.Extract({
                        path: appPath,
                    }, template)).on('finish', resolve).on('error', reject);
                });
            }));
            yield logger__default["default"].start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false, index = 'index' } = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const input = glob__default["default"].sync(`src/${index}.{${indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const inputOptions = {
                input,
                preserveEntrySignatures: 'strict',
                plugins: [
                    commonjs__default["default"](),
                    json__default["default"](),
                    typescript__default["default"](),
                    jsx__default["default"](),
                    eslint__default["default"]({
                        include: constants.lintInclude,
                    }),
                ],
            };
            const outputOptions = {
                dir: this.buildFolder,
                sourcemap: this.sourcemap,
            };
            if (node) {
                outputOptions.format = 'cjs';
                inputOptions.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                inputOptions.plugins.push(string({
                    include: '**/*.*',
                    exclude: constants.stringExcludeNode,
                }));
            }
            else {
                inputOptions.plugins.push(pluginNodeResolve.nodeResolve({
                    browser: true,
                }), polyfill__default["default"](), image__default["default"](), styles__default["default"]({
                    mode: this.cssInJs ? 'inject' : 'extract',
                    url: true,
                    plugins: [autoprefixer__default["default"]()],
                    modules: this.cssModules,
                    sourceMap: this.sourcemap,
                    minimize: true,
                }), string({
                    include: '**/*.*',
                    exclude: constants.stringExcludeDom,
                }), injectEnv__default["default"](innetEnv));
                outputOptions.format = 'es';
                outputOptions.plugins = [
                    rollupPluginTerser.terser(),
                    filesize__default["default"]({
                        reporter: helpers.reporter,
                    }),
                ];
            }
            yield logger__default["default"].start('Build production bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup__default["default"].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
                if (!node) {
                    yield copyFiles(this.publicFolder, this.buildFolder);
                    const data = yield fs.promises.readFile(this.publicIndexFile);
                    const pkg = yield this.getPackage();
                    yield fs.promises.writeFile(this.buildIndexFile, yield helpers.convertIndexFile(data, pkg.version, this.baseUrl));
                }
            }));
            if (pkg) {
                yield logger__default["default"].start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
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
    start({ node = false, error = false, index = 'index' } = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const pkg = yield this.getPackage();
            const input = glob__default["default"].sync(`src/${index}.{${indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            yield logger__default["default"].start('Remove build', () => fs__default["default"].remove(this.devBuildFolder));
            const options = {
                input,
                preserveEntrySignatures: 'strict',
                output: {
                    dir: this.devBuildFolder,
                    sourcemap: true,
                },
                plugins: [
                    commonjs__default["default"](),
                    json__default["default"](),
                    typescript__default["default"]({
                        tsconfigOverride: {
                            compilerOptions: {
                                sourceMap: true,
                            },
                        },
                    }),
                    jsx__default["default"](),
                    eslint__default["default"]({
                        include: constants.lintInclude,
                    }),
                ],
            };
            if (node) {
                // @ts-expect-error
                options.output.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(string({
                    include: '**/*.*',
                    exclude: constants.stringExcludeNode,
                }), this.createServer());
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
                // @ts-expect-error
                options.output.format = 'es';
                options.plugins.push(pluginNodeResolve.nodeResolve({
                    browser: true,
                }), polyfill__default["default"](), image__default["default"](), styles__default["default"]({
                    mode: this.cssInJs ? 'inject' : 'extract',
                    url: true,
                    plugins: [autoprefixer__default["default"]()],
                    modules: this.cssModules,
                    sourceMap: true,
                }), string({
                    include: '**/*.*',
                    exclude: constants.stringExcludeDom,
                }), this.createClient(key, cert, pkg), livereload(Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [this.devBuildFolder, this.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))), injectEnv__default["default"](innetEnv));
            }
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
                    else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs'].includes(e.error.plugin)) {
                        const [, file, line, column] = e.error.message
                            .replace(REG_CLEAR_TEXT, '')
                            .match(/^(src[^:]+):(\d+):(\d+)/) || [];
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
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const input = yield logger__default["default"].start('Check file', () => helpers.getFile(file));
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
            yield logger__default["default"].start('Build bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const inputOptions = {
                    input,
                    plugins: [
                        commonjs__default["default"](),
                        pluginNodeResolve.nodeResolve(),
                        json__default["default"](),
                        typescript__default["default"]({
                            tsconfigOverride: {
                                compilerOptions: {
                                    sourceMap: true,
                                },
                            },
                        }),
                    ],
                };
                const outputOptions = {
                    format: 'cjs',
                    file: jsFilePath,
                    sourcemap: true,
                };
                const bundle = yield rollup__default["default"].rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            yield logger__default["default"].start('Running of the script', () => tslib.__awaiter(this, void 0, void 0, function* () {
                spawn('node', ['-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
            }));
        });
    }
    release({ node = false, index = 'index', pub } = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const { releaseFolder, cssModules } = this;
            yield logger__default["default"].start('Remove previous release', () => fs__default["default"].remove(releaseFolder));
            const pkg = yield this.getPackage();
            function build(format) {
                var _a, _b;
                return tslib.__awaiter(this, void 0, void 0, function* () {
                    const ext = format === 'es'
                        ? ((_a = (pkg.module || pkg.esnext || pkg['jsnext:main'])) === null || _a === void 0 ? void 0 : _a.replace('index', '')) || '.mjs'
                        : ((_b = pkg.main) === null || _b === void 0 ? void 0 : _b.replace('index', '')) || '.js';
                    const indexFiles = scriptExtensions.map(ext => `src/${index}.${ext}`).join(',');
                    const otherFiles = scriptExtensions.map(ext => `src/**/index.${ext}`).join(',');
                    const input = glob__default["default"].sync(`{${indexFiles},${otherFiles}}`);
                    if (!input.length) {
                        throw Error('index file is not detected');
                    }
                    const options = {
                        input,
                        preserveEntrySignatures: 'strict',
                        output: {
                            dir: releaseFolder,
                            entryFileNames: `[name]${ext}`,
                            format,
                            preserveModules: true,
                        },
                        plugins: [
                            json__default["default"](),
                            typescript__default["default"]({
                                rollupCommonJSResolveHack: false,
                                clean: true,
                            }),
                            jsx__default["default"](),
                            eslint__default["default"]({
                                include: constants.lintInclude,
                            }),
                            injectEnv__default["default"](innetEnv),
                        ],
                    };
                    if (node) {
                        options.external = [...Object.keys(pkg.dependencies), 'tslib'];
                        options.plugins = [
                            ...options.plugins,
                            externals__default["default"](),
                            string({
                                include: '**/*.*',
                                exclude: constants.stringExcludeNode,
                            }),
                        ];
                    }
                    else {
                        options.plugins = [
                            ...options.plugins,
                            string({
                                include: '**/*.*',
                                exclude: constants.stringExcludeDom,
                            }),
                            polyfill__default["default"](),
                            image__default["default"](),
                            styles__default["default"]({
                                mode: 'inject',
                                url: true,
                                plugins: [autoprefixer__default["default"]()],
                                modules: cssModules,
                                minimize: true,
                            }),
                        ];
                    }
                    const bundle = yield rollup__default["default"].rollup(options);
                    yield bundle.write(options.output);
                    yield bundle.close();
                });
            }
            yield logger__default["default"].start('Build cjs bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('cjs');
            }));
            yield logger__default["default"].start('Build es6 bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('es');
            }));
            yield logger__default["default"].start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const data = Object.assign({}, pkg);
                delete data.private;
                delete data.devDependencies;
                yield fs__default["default"].writeFile(path__default["default"].resolve(this.releaseFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
            }));
            if (pkg.bin) {
                yield logger__default["default"].start('Build bin', () => tslib.__awaiter(this, void 0, void 0, function* () {
                    const { bin } = pkg;
                    for (const name in bin) {
                        const value = bin[name];
                        const input = glob__default["default"].sync(`src/${value}.{${scriptExtensions.join(',')}}`);
                        const file = path__default["default"].join(this.releaseFolder, value);
                        const options = {
                            input,
                            external: [...Object.keys(pkg.dependencies), 'tslib'],
                            output: {
                                file,
                                format: 'cjs',
                            },
                            plugins: [
                                rollupPluginPreserveShebangs.preserveShebangs(),
                                json__default["default"](),
                                typescript__default["default"]({
                                    clean: true,
                                    tsconfigOverride: {
                                        compilerOptions: {
                                            declaration: false,
                                        },
                                    },
                                }),
                                externals__default["default"](),
                                jsx__default["default"](),
                                injectEnv__default["default"](innetEnv),
                            ],
                        };
                        const bundle = yield rollup__default["default"].rollup(options);
                        yield bundle.write(options.output);
                        yield bundle.close();
                    }
                }));
            }
            if (fs__default["default"].existsSync(this.licenseFile)) {
                yield logger__default["default"].start('Copy license', () => tslib.__awaiter(this, void 0, void 0, function* () {
                    yield fs.promises.copyFile(this.licenseFile, this.licenseReleaseFile);
                }));
            }
            if (fs__default["default"].existsSync(this.readmeFile)) {
                yield logger__default["default"].start('Copy readme', () => tslib.__awaiter(this, void 0, void 0, function* () {
                    yield fs.promises.copyFile(this.readmeFile, this.readmeReleaseFile);
                }));
            }
            if (fs__default["default"].existsSync(this.declarationFile)) {
                yield logger__default["default"].start('Copy declaration', () => tslib.__awaiter(this, void 0, void 0, function* () {
                    yield fs.promises.copyFile(this.declarationFile, this.declarationReleaseFile);
                }));
            }
            if (pub) {
                const date = (Date.now() / 1000) | 0;
                yield logger__default["default"].start(`publishing v${pkg.version} ${date}`, () => tslib.__awaiter(this, void 0, void 0, function* () {
                    yield execAsync(`npm publish ${this.releaseFolder}`);
                }));
            }
        });
    }
    increaseVersion(release) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const pkg = yield this.getPackage();
            yield logger__default["default"].start('Prepare package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const version = pkg.version.split('.');
                switch (release) {
                    case 'patch': {
                        version[2]++;
                        break;
                    }
                    case 'minor': {
                        version[1]++;
                        version[2] = 0;
                        break;
                    }
                    case 'major': {
                        version[1] = 0;
                        version[2] = 0;
                        version[0]++;
                        break;
                    }
                    default: return;
                }
                pkg.version = version.join('.');
                yield fs__default["default"].writeFile(path__default["default"].resolve(this.projectFolder, 'package.json'), JSON.stringify(pkg, undefined, 2), 'UTF-8');
            }));
        });
    }
    getPackage() {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (this.package) {
                return this.package;
            }
            const packageFolder = path__default["default"].resolve(this.projectFolder, 'package.json');
            yield logger__default["default"].start('Check package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
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
            name: 'client',
            writeBundle: () => tslib.__awaiter(this, void 0, void 0, function* () {
                var _a;
                if (!app) {
                    app = express__default["default"]();
                    const update = () => tslib.__awaiter(this, void 0, void 0, function* () {
                        const data = yield fs.promises.readFile(this.publicIndexFile);
                        yield fs.promises.writeFile(this.devBuildIndexFile, yield helpers.convertIndexFile(data, pkg.version, this.baseUrl));
                    });
                    fs__default["default"].watch(this.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(express__default["default"].static(this.devBuildFolder));
                    app.use(express__default["default"].static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        app.use(this.api, proxy__default["default"](this.proxy, {
                            https: httpsUsing,
                            proxyReqPathResolver: req => req.originalUrl,
                        }));
                    }
                    app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
                        res.sendFile(this.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https__default["default"].createServer({ key, cert }, app) : http__default["default"].createServer(app);
                    let port = this.port;
                    const listener = () => {
                        console.log(`${chalk__default["default"].green('➤')} Started on http${httpsUsing ? 's' : ''}://localhost:${port} and http${httpsUsing ? 's' : ''}://${address__default["default"].ip()}:${port}`);
                    };
                    server.listen(port, listener);
                    server.on('error', (e) => tslib.__awaiter(this, void 0, void 0, function* () {
                        if (e.code === 'EADDRINUSE') {
                            port++;
                            const { userPort } = yield prompt__default["default"]({
                                name: 'userPort',
                                type: 'number',
                                message: `Port ${e.port} is reserved, please enter another one [${port}]:`,
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
            }),
        };
    }
    createServer() {
        let app;
        return {
            name: 'server',
            writeBundle: () => tslib.__awaiter(this, void 0, void 0, function* () {
                app === null || app === void 0 ? void 0 : app.kill();
                const filePath = path__default["default"].resolve(this.devBuildFolder, 'index.js');
                app = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
            }),
        };
    }
}

exports.InnetJS = InnetJS;
exports.indexExt = indexExt;
exports.scriptExtensions = scriptExtensions;