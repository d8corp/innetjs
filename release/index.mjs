import './_virtual/_rollup-plugin-process-env.mjs';
import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from '@rollup/plugin-typescript';
import address from 'address';
import Zip from 'adm-zip';
import autoprefixer from 'autoprefixer';
import axios from 'axios';
import chalk from 'chalk';
import selector from 'cli-select';
import express from 'express';
import proxy from 'express-http-proxy';
import fs, { promises } from 'fs-extra';
import glob from 'glob';
import http from 'node:http';
import https from 'node:https';
import { LinesAndColumns } from 'lines-and-columns';
import { tmpdir } from 'node:os';
import path from 'node:path';
import prompt from 'prompts';
import rollup from 'rollup';
import external from 'rollup-plugin-external-node-modules';
import filesize from 'rollup-plugin-filesize';
import jsx from 'rollup-plugin-innet-jsx';
import externals from 'rollup-plugin-node-externals';
import polyfill from 'rollup-plugin-polyfill-node';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import env from 'rollup-plugin-process-env';
import styles from 'rollup-plugin-styles';
import { terser } from 'rollup-plugin-terser';
import stream from 'node:stream';
import tmp from 'tmp';
import { promisify } from 'node:util';
import { stringExcludeNode, imageInclude, stringExcludeDom, lintInclude } from './constants.mjs';
import { reporter, convertIndexFile, getFile } from './helpers.mjs';
import { updateDotenv } from './updateDotenv.mjs';

const livereload = require('rollup-plugin-livereload');
const { string } = require('rollup-plugin-string');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const importAssets = require('rollup-plugin-import-assets');
const execAsync = promisify(exec);
const copyFiles = promisify(fs.copy);
const pipeline = promisify(stream.pipeline);
updateDotenv();
const REG_CLEAR_TEXT = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const REG_RPT_ERROR_FILE = /(src[^:]+):(\d+):(\d+)/;
const REG_TJSX = /\.[tj]sx?$/;
const REG_EXT = /\.([^.]+)$/;
const NPM_TAG = /-(.+?)(?:\.|$)/;
function getNpmTag(version) {
    const match = version.match(NPM_TAG);
    return match ? match[1] : 'latest';
}
const scriptExtensions = ['ts', 'js', 'tsx', 'jsx'];
const indexExt = scriptExtensions.join(',');
class InnetJS {
    constructor({ envPrefix = process.env.INNETJS_ENV_PREFIX || 'INNETJS_', projectFolder = process.env.PROJECT_FOLDER || '', baseUrl = process.env.BASE_URL || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', releaseFolder = process.env.RELEASE_FOLDER || 'release', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', simulateIP = process.env.IP, port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '/api/?*', tsconfig = process.env.TSCONFIG, } = {}) {
        this.projectFolder = path.resolve(projectFolder);
        this.publicFolder = path.resolve(publicFolder);
        this.releaseFolder = path.resolve(releaseFolder);
        this.buildFolder = path.resolve(buildFolder);
        this.srcFolder = path.resolve(srcFolder);
        this.licenseFile = path.join(projectFolder, 'LICENSE');
        this.licenseReleaseFile = path.join(releaseFolder, 'LICENSE');
        this.readmeFile = path.join(projectFolder, 'README.md');
        this.readmeReleaseFile = path.join(releaseFolder, 'README.md');
        this.declarationFile = path.join(srcFolder, 'declaration.d.ts');
        this.declarationReleaseFile = path.join(releaseFolder, 'declaration.d.ts');
        this.publicIndexFile = path.join(publicFolder, 'index.html');
        this.buildIndexFile = path.join(buildFolder, 'index.html');
        this.devBuildFolder = path.resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build');
        this.devBuildIndexFile = path.join(this.devBuildFolder, 'index.html');
        this.sourcemap = sourcemap;
        this.cssModules = cssModules;
        this.cssInJs = cssInJs;
        this.sslKey = sslKey;
        this.sslCrt = sslCrt;
        this.port = port;
        this.proxy = proxy;
        this.api = api;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        this.envPrefix = envPrefix;
        this.simulateIP = simulateIP;
        this.tsconfig = tsconfig;
    }
    // Methods
    init(appName, { template, force = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPath = path.resolve(appName);
            const { data } = yield logger.start('Get templates list', () => __awaiter(this, void 0, void 0, function* () { return yield axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
            const templates = data.map(({ name }) => name).filter(name => name !== 'main');
            if (!template || !templates.includes(template)) {
                logger.log(chalk.green('Select one of those templates'));
                const { value } = yield selector({
                    values: templates,
                });
                template = value;
                readline.moveCursor(process.stdout, 0, -1);
                const text = `Selected template: ${chalk.white(value)}`;
                logger.start(text);
                logger.end(text);
            }
            if (!force) {
                yield logger.start('Check if app folder is available', () => __awaiter(this, void 0, void 0, function* () {
                    if (fs.existsSync(appPath)) {
                        logger.log(chalk.red(`'${appPath}' already exist, what do you want?`));
                        const { id: result, value } = yield selector({
                            values: ['Stop the process', 'Remove the folder', 'Merge with template'],
                        });
                        readline.moveCursor(process.stdout, 0, -1);
                        logger.log(`Already exist, selected: ${value}`);
                        if (!result) {
                            throw Error(`'${appPath}' already exist`);
                        }
                        if (result === 1) {
                            yield fs.remove(appPath);
                        }
                    }
                }));
            }
            yield logger.start('Download template', () => __awaiter(this, void 0, void 0, function* () {
                const tmpPath = tmpdir();
                const zipPath = path.join(tmpPath, 'template.zip');
                const unzipPath = path.join(tmpPath, `innetjs-templates-${template}`);
                const { data } = yield axios.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                    responseType: 'stream',
                });
                yield pipeline(data, fs.createWriteStream(zipPath));
                const zip = new Zip(zipPath);
                yield new Promise((resolve, reject) => {
                    zip.extractAllToAsync(tmpPath, false, false, (error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(undefined);
                        }
                    });
                });
                yield fs.remove(zipPath);
                yield fs.move(unzipPath, appPath, { overwrite: true });
            }));
            yield logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false, inject = false, index = 'index' } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = glob.sync(`src/${index}.{${indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            yield logger.start('Remove build', () => fs.remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const options = {
                input,
                preserveEntrySignatures: 'strict',
                plugins: [
                    commonjs(),
                    json(),
                    ts({
                        noEmitOnError: true,
                        compilerOptions: {
                            declaration: false,
                        },
                    }),
                    jsx(),
                ],
                onwarn(warning, warn) {
                    if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                        return;
                    warn(warning);
                },
            };
            this.withLint(options, true);
            const outputOptions = {
                dir: this.buildFolder,
                sourcemap: this.sourcemap,
            };
            if (node) {
                outputOptions.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(nodeResolve(), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }));
            }
            else {
                options.plugins.push(nodeResolve({
                    browser: true,
                }), polyfill(), importAssets({
                    include: imageInclude.map(img => `src/${img}`),
                    publicPath: this.baseUrl,
                }), styles({
                    sass: {
                        outputStyle: 'compressed',
                    },
                    mode: this.cssInJs ? 'inject' : 'extract',
                    url: {
                        inline: false,
                        publicPath: `${this.baseUrl}assets`,
                    },
                    plugins: [autoprefixer()],
                    autoModules: this.cssModules ? (id) => !id.includes('.global.') : true,
                    sourceMap: this.sourcemap,
                    minimize: true,
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeDom,
                }));
                outputOptions.format = 'es';
                outputOptions.plugins = [
                    terser(),
                    filesize({
                        reporter,
                    }),
                ];
            }
            this.withEnv(options, true);
            yield logger.start('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup.rollup(options);
                yield bundle.write(outputOptions);
                yield bundle.close();
                if (!node) {
                    yield copyFiles(this.publicFolder, this.buildFolder);
                    const data = yield promises.readFile(this.publicIndexFile);
                    const pkg = yield this.getPackage();
                    yield promises.writeFile(this.buildIndexFile, yield convertIndexFile(data, pkg.version, this.baseUrl, path.parse(input[0]).name, inject));
                }
            }));
            if (pkg) {
                yield logger.start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                    const data = Object.assign({}, pkg);
                    delete data.private;
                    delete data.devDependencies;
                    yield fs.writeFile(path.resolve(this.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
                }));
                const pkgLockPath = path.resolve(this.projectFolder, 'package-lock.json');
                if (fs.existsSync(pkgLockPath)) {
                    yield logger.start('Copy package-lock.json', () => {
                        return fs.copy(pkgLockPath, path.resolve(this.buildFolder, 'package-lock.json'));
                    });
                }
            }
        });
    }
    start({ node = false, inject = false, error = false, index = 'index', } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const pkg = yield this.getPackage();
            const input = glob.sync(`src/${index}.{${indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            yield logger.start('Remove build', () => fs.remove(this.devBuildFolder));
            const options = {
                input,
                preserveEntrySignatures: 'strict',
                output: {
                    dir: this.devBuildFolder,
                    sourcemap: true,
                },
                plugins: [
                    commonjs(),
                    json(),
                    ts({
                        compilerOptions: {
                            declaration: false,
                            sourceMap: true,
                        },
                    }),
                    jsx(),
                ],
                onwarn(warning, warn) {
                    if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                        return;
                    if (warning.plugin === 'typescript') {
                        const { loc: { line, column, file }, frame, message } = warning;
                        console.log(`ERROR in ${file}:${line}:${column}`);
                        console.log(message);
                        console.log(frame);
                        return;
                    }
                    warn(warning);
                },
            };
            let preset;
            this.withLint(options);
            if (node) {
                preset = { NODE_ENV: 'dev' };
                // @ts-expect-error
                options.output.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(nodeResolve(), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }), this.createServer(input));
            }
            else {
                const key = path.basename(this.sslKey) !== this.sslKey
                    ? this.sslKey
                    : fs.existsSync(this.sslKey)
                        ? fs.readFileSync(this.sslKey)
                        : undefined;
                const cert = path.basename(this.sslCrt) !== this.sslCrt
                    ? this.sslCrt
                    : fs.existsSync(this.sslCrt)
                        ? fs.readFileSync(this.sslCrt)
                        : undefined;
                // @ts-expect-error
                options.output.format = 'es';
                options.plugins.push(nodeResolve({
                    browser: true,
                }), polyfill(), importAssets({
                    include: imageInclude.map(img => `src/${img}`),
                    publicPath: this.baseUrl,
                }), styles({
                    mode: this.cssInJs ? 'inject' : 'extract',
                    url: {
                        inline: false,
                        publicPath: `${this.baseUrl}assets`,
                    },
                    sass: {
                        silenceDeprecations: ['legacy-js-api'],
                    },
                    plugins: [autoprefixer()],
                    autoModules: this.cssModules ? (id) => !id.includes('.global.') : true,
                    sourceMap: true,
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeDom,
                }), this.createClient(key, cert, pkg, path.parse(input[0]).name, inject), livereload(Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [this.devBuildFolder, this.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
            }
            this.withEnv(options, true, preset);
            const watcher = rollup.watch(options);
            watcher.on('event', (e) => __awaiter(this, void 0, void 0, function* () {
                if (e.code === 'ERROR') {
                    if (e.error.code === 'UNRESOLVED_IMPORT') {
                        const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || [];
                        const text = (yield fs.readFile(file)).toString();
                        const lines = new LinesAndColumns(text);
                        const { line, column } = lines.locationForIndex(text.indexOf(importer));
                        logger.end('Bundling', e.error.message);
                        console.log(`ERROR in ${file}:${line + 1}:${column + 1}`);
                    }
                    else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs', 'typescript'].includes(e.error.plugin)) {
                        const [, file, line, column] = e.error.message
                            .replace(REG_CLEAR_TEXT, '')
                            .match(REG_RPT_ERROR_FILE) || [];
                        logger.end('Bundling', e.error.message);
                        if (file) {
                            console.log(`ERROR in ${file}:${line}:${column}`);
                        }
                        else if (e.error.loc) {
                            console.log(`ERROR in ${e.error.loc.file}:${e.error.loc.line}:${e.error.loc.column}`);
                            console.log(e.error.frame);
                        }
                    }
                    else {
                        logger.end('Bundling', error ? e.error.stack : e.error.message);
                    }
                }
                else if (e.code === 'BUNDLE_START') {
                    logger.start('Bundling');
                }
                else if (e.code === 'BUNDLE_END') {
                    logger.end('Bundling');
                }
            }));
        });
    }
    run(file, { config = '' } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = yield logger.start('Check file', () => getFile(file));
            const folder = yield new Promise((resolve, reject) => {
                tmp.dir((err, folder) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(folder);
                    }
                });
            });
            const jsFilePath = `${folder}/index.js`;
            yield logger.start('Build bundle', () => __awaiter(this, void 0, void 0, function* () {
                const inputOptions = {
                    input,
                    plugins: [
                        commonjs(),
                        nodeResolve(),
                        json(),
                        ts({
                            tsconfig: config || false,
                            compilerOptions: {
                                sourceMap: true,
                                declaration: false,
                            },
                        }),
                    ],
                };
                const outputOptions = {
                    format: 'cjs',
                    file: jsFilePath,
                    sourcemap: true,
                };
                const bundle = yield rollup.rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            yield logger.start('Running of the script', () => __awaiter(this, void 0, void 0, function* () {
                spawn('node', ['-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
            }));
        });
    }
    release({ index = 'index', pub, min } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { releaseFolder, cssModules } = this;
            yield logger.start('Remove previous release', () => fs.remove(releaseFolder));
            const pkg = yield this.getPackage();
            const build = (format) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const ext = format === 'es'
                    ? ((_a = (pkg.module || pkg.esnext || pkg['jsnext:main'])) === null || _a === void 0 ? void 0 : _a.replace('index', '')) || '.mjs'
                    : ((_b = pkg.main) === null || _b === void 0 ? void 0 : _b.replace('index', '')) || '.js';
                const input = glob.sync(`src/${index}.{${indexExt}}`);
                if (!input.length) {
                    throw Error('index file is not detected');
                }
                const output = format === 'iife'
                    ? {
                        file: path.join(releaseFolder, pkg.browser || 'index.min.js'),
                        inlineDynamicImports: true,
                        name: pkg.browserName || pkg.name
                            .split('-')
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(''),
                    }
                    : {
                        dir: releaseFolder,
                        preserveModules: true,
                        exports: 'named',
                        entryFileNames: ({ name, facadeModuleId }) => {
                            if (REG_TJSX.test(facadeModuleId)) {
                                return `${name}${ext}`;
                            }
                            const match = facadeModuleId.match(REG_EXT);
                            return match ? `${name}${match[0]}${ext}` : `${name}${ext}`;
                        },
                    };
                const options = {
                    input,
                    external: ['tslib'],
                    treeshake: false,
                    output: Object.assign(Object.assign({}, output), { format }),
                    plugins: [
                        json(),
                        ts({
                            tsconfig: this.tsconfig,
                            compilerOptions: {
                                sourceMap: false,
                                outDir: releaseFolder,
                            },
                        }),
                        jsx(),
                        externals(),
                        string({
                            include: '**/*.*',
                            exclude: stringExcludeDom,
                        }),
                        image(),
                        styles({
                            mode: this.cssInJs ? 'inject' : 'extract',
                            plugins: [autoprefixer()],
                            autoModules: cssModules ? (id) => !id.includes('.global.') : true,
                            minimize: true,
                        }),
                        nodeResolve(),
                        external(),
                    ],
                };
                if (format === 'iife') {
                    options.plugins.push(terser());
                }
                this.withLint(options);
                this.withEnv(options, true);
                const bundle = yield rollup.rollup(options);
                yield bundle.write(options.output);
                yield bundle.close();
            });
            yield logger.start('Build cjs bundle', () => __awaiter(this, void 0, void 0, function* () {
                yield build('cjs');
            }));
            yield logger.start('Build es6 bundle', () => __awaiter(this, void 0, void 0, function* () {
                yield build('es');
            }));
            if (min) {
                yield logger.start('Build min bundle', () => __awaiter(this, void 0, void 0, function* () {
                    yield build('iife');
                }));
            }
            yield logger.start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                const data = Object.assign({}, pkg);
                delete data.private;
                delete data.devDependencies;
                yield fs.writeFile(path.resolve(this.releaseFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
            }));
            if (pkg.bin) {
                yield logger.start('Build bin', () => __awaiter(this, void 0, void 0, function* () {
                    const { bin } = pkg;
                    for (const name in bin) {
                        const value = bin[name];
                        const input = glob.sync(`src/${value}.{${indexExt}}`);
                        const file = path.join(this.releaseFolder, value);
                        const options = {
                            input,
                            external: [...Object.keys(pkg.dependencies), 'tslib'],
                            output: {
                                file,
                                format: 'cjs',
                            },
                            plugins: [
                                preserveShebangs(),
                                json(),
                                ts({
                                    compilerOptions: {
                                        declaration: false,
                                    },
                                }),
                                externals(),
                                jsx(),
                            ],
                        };
                        this.withLint(options);
                        this.withEnv(options);
                        const bundle = yield rollup.rollup(options);
                        yield bundle.write(options.output);
                        yield bundle.close();
                    }
                }));
            }
            if (fs.existsSync(this.licenseFile)) {
                yield logger.start('Copy license', () => __awaiter(this, void 0, void 0, function* () {
                    yield promises.copyFile(this.licenseFile, this.licenseReleaseFile);
                }));
            }
            if (fs.existsSync(this.readmeFile)) {
                yield logger.start('Copy readme', () => __awaiter(this, void 0, void 0, function* () {
                    yield promises.copyFile(this.readmeFile, this.readmeReleaseFile);
                }));
            }
            if (fs.existsSync(this.declarationFile)) {
                yield logger.start('Copy declaration', () => __awaiter(this, void 0, void 0, function* () {
                    yield promises.copyFile(this.declarationFile, this.declarationReleaseFile);
                }));
            }
            if (pub) {
                const date = (Date.now() / 1000) | 0;
                yield logger.start(`publishing v${pkg.version} ${date}`, () => __awaiter(this, void 0, void 0, function* () {
                    yield execAsync(`npm publish ${this.releaseFolder} --tag ${getNpmTag(pkg.version)}`);
                }));
            }
        });
    }
    withLint(options, prod = false) {
        if (this._lintUsage === undefined) {
            this._lintUsage = fs.existsSync(path.join(this.projectFolder, '.eslintrc'));
        }
        if (this._lintUsage) {
            options.plugins.push(eslint({
                include: lintInclude,
                throwOnError: prod,
            }));
        }
    }
    withEnv(options, virtual, preset) {
        options.plugins.push(env(this.envPrefix, {
            include: options.input,
            virtual,
            preset,
        }));
    }
    increaseVersion(release) {
        return __awaiter(this, void 0, void 0, function* () {
            const pkg = yield this.getPackage();
            yield logger.start('Prepare package.json', () => __awaiter(this, void 0, void 0, function* () {
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
                yield fs.writeFile(path.resolve(this.projectFolder, 'package.json'), JSON.stringify(pkg, undefined, 2), 'UTF-8');
            }));
        });
    }
    getPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.package) {
                return this.package;
            }
            const packageFolder = path.resolve(this.projectFolder, 'package.json');
            yield logger.start('Check package.json', () => __awaiter(this, void 0, void 0, function* () {
                if (fs.existsSync(packageFolder)) {
                    this.package = yield fs.readJson(packageFolder);
                }
            }));
            return this.package;
        });
    }
    createClient(key, cert, pkg, index, inject) {
        let app;
        return {
            name: 'client',
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (!app) {
                    app = express();
                    const update = () => __awaiter(this, void 0, void 0, function* () {
                        const data = yield promises.readFile(this.publicIndexFile);
                        yield promises.writeFile(this.devBuildIndexFile, yield convertIndexFile(data, pkg.version, this.baseUrl, index, inject));
                    });
                    fs.watch(this.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(this.baseUrl, express.static(this.devBuildFolder));
                    app.use(this.baseUrl, express.static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        if (this.simulateIP) {
                            app.use((req, res, next) => {
                                req.headers['X-Real-IP'] = this.simulateIP;
                                next();
                            });
                        }
                        app.use(this.api, proxy(this.proxy, {
                            https: httpsUsing,
                            limit: '1000mb',
                            proxyReqPathResolver: req => req.originalUrl,
                        }));
                    }
                    app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
                        res.sendFile(this.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app);
                    let port = this.port;
                    const listener = () => {
                        const baseUrl = this.baseUrl === '/' ? '' : this.baseUrl;
                        console.log(`${chalk.green('➤')} Started on http${httpsUsing ? 's' : ''}://localhost:${port}${baseUrl} and http${httpsUsing ? 's' : ''}://${address.ip()}:${port}${baseUrl}`);
                    };
                    server.listen(port, listener);
                    server.on('error', (e) => __awaiter(this, void 0, void 0, function* () {
                        if (e.code === 'EADDRINUSE') {
                            port++;
                            const { userPort } = yield prompt({
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
    createServer(input) {
        const apps = {};
        return {
            name: 'server',
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                for (const file of input) {
                    const { name } = path.parse(file);
                    (_a = apps[name]) === null || _a === void 0 ? void 0 : _a.kill();
                    const filePath = path.resolve(this.devBuildFolder, `${name}.js`);
                    apps[name] = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
                }
            }),
        };
    }
}

export { InnetJS, indexExt, scriptExtensions };
