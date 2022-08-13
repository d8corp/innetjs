import path$1 from 'path';
import fs, { promises } from 'fs-extra';
import http from 'http';
import https from 'https';
import { promisify } from 'util';
import axios from 'axios';
import logger from '@cantinc/logger';
import chalk from 'chalk';
import rollup from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import styles from 'rollup-plugin-styles';
import autoprefixer from 'autoprefixer';
import express from 'express';
import json from '@rollup/plugin-json';
import tmp from 'tmp';
import proxy from 'express-http-proxy';
import selector from 'cli-select';
import jsx from 'rollup-plugin-innet-jsx';
import filesize from 'rollup-plugin-filesize';
import image from '@rollup/plugin-image';
import eslint from '@rollup/plugin-eslint';
import { LinesAndColumns } from 'lines-and-columns';
import { Parse } from 'unzipper';

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
    const parser = new Parse(opts);
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
    file = path$1.resolve(file);
    if (!fs.existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    if (fs.lstatSync(file).isDirectory()) {
        let tmpFile = file;
        if (!fs.existsSync(tmpFile = path$1.join(file, 'index.ts')) &&
            !fs.existsSync(tmpFile = path$1.join(file, 'index.tsx')) &&
            !fs.existsSync(tmpFile = path$1.join(file, 'index.js'))) {
            throw Error('Cannot find index file in: ' + file);
        }
        file = tmpFile;
    }
    else if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) {
        throw Error('File should has `.ts` or `.tsx` or `.js` extension: ' + file);
    }
    if (!fs.existsSync(file)) {
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
    logger.log(`${chalk.yellow(info.fileName)} ${chalk.green(info.bundleSize)} [ gzip: ${chalk.green(info.gzipSize)} ]`);
    return '';
};

const livereload = require('rollup-plugin-livereload');
const { string } = require('rollup-plugin-string');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const execAsync = promisify(exec);
const copyFiles = promisify(fs.copy);
require('dotenv').config();
class InnetJS {
    constructor({ projectFolder = process.env.PROJECT_FOLDER || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '*', } = {}) {
        this.projectFolder = path$1.resolve(projectFolder);
        this.publicFolder = path$1.resolve(publicFolder);
        this.buildFolder = path$1.resolve(buildFolder);
        this.srcFolder = path$1.resolve(srcFolder);
        this.publicIndexFile = path$1.join(publicFolder, 'index.html');
        this.buildIndexFile = path$1.join(buildFolder, 'index.html');
        this.devBuildFolder = path$1.resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build');
        this.devBuildIndexFile = path$1.join(this.devBuildFolder, 'index.html');
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
            const appPath = path$1.resolve(appName);
            const { data } = yield logger.start('Get templates list', () => __awaiter(this, void 0, void 0, function* () { return yield axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
            const templates = data.map(({ name }) => name).filter(name => name !== 'main');
            if (!template || !templates.includes(template)) {
                logger.log(chalk.green(`Select one of those templates`));
                const { value } = yield selector({
                    values: templates
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
                            values: ['Stop the process', 'Remove the folder', 'Merge with template']
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
                const { data } = yield axios.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                    responseType: 'stream'
                });
                yield new Promise((resolve, reject) => {
                    data.pipe(Extract({
                        path: appPath,
                    }, template)).on('finish', resolve).on('error', reject);
                });
            }));
            yield logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            yield logger.start('Remove build', () => fs.remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const inputOptions = {
                input: path$1.resolve(this.srcFolder, `index.${indexExtension}`),
                preserveEntrySignatures: 'strict',
                plugins: [
                    commonjs(),
                    json(),
                    typescript(),
                    jsx(),
                ]
            };
            const outputOptions = {
                dir: this.buildFolder,
                sourcemap: this.sourcemap
            };
            if (node) {
                outputOptions.format = 'cjs';
                inputOptions.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                inputOptions.plugins.push(nodeResolve({
                    moduleDirectories: [path$1.resolve(this.buildFolder, 'node_modules')]
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }));
            }
            else {
                inputOptions.plugins = [
                    eslint({
                        include: lintIncludeDom,
                    }),
                    ...inputOptions.plugins,
                    nodeResolve(),
                    image(),
                    styles({
                        mode: this.cssInJs ? 'inject' : 'extract',
                        url: true,
                        plugins: [autoprefixer()],
                        modules: this.cssModules,
                        sourceMap: this.sourcemap,
                        minimize: true,
                    }),
                    string({
                        include: '**/*.*',
                        exclude: stringExcludeDom,
                    }),
                ];
                outputOptions.format = 'es';
                outputOptions.plugins = [
                    terser(),
                    filesize({
                        reporter,
                    }),
                ];
            }
            yield logger.start('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup.rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
                if (!node) {
                    yield copyFiles(this.publicFolder, this.buildFolder);
                    const data = yield promises.readFile(this.publicIndexFile);
                    const pkg = yield this.getPackage();
                    yield promises.writeFile(this.buildIndexFile, yield convertIndexFile(data, pkg.version));
                }
            }));
            if (pkg) {
                yield logger.start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                    const data = Object.assign({}, pkg);
                    delete data.private;
                    delete data.devDependencies;
                    yield fs.writeFile(path$1.resolve(this.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
                }));
                const pkgLockPath = path$1.resolve(this.projectFolder, 'package-lock.json');
                if (fs.existsSync(pkgLockPath)) {
                    yield logger.start('Copy package-lock.json', () => {
                        return fs.copy(pkgLockPath, path$1.resolve(this.buildFolder, 'package-lock.json'));
                    });
                }
            }
        });
    }
    start({ node = false, error = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            const pkg = yield this.getPackage();
            yield logger.start('Remove build', () => fs.remove(this.devBuildFolder));
            const options = {
                input: path$1.resolve(this.srcFolder, `index.${indexExtension}`),
                preserveEntrySignatures: 'strict',
                output: {
                    dir: this.devBuildFolder,
                    sourcemap: true
                },
                plugins: [
                    commonjs(),
                    json(),
                    typescript({
                        tsconfigOverride: {
                            compilerOptions: {
                                sourceMap: true
                            }
                        }
                    }),
                    jsx(),
                ],
            };
            if (node) {
                options.output.format = 'cjs';
                options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
                options.plugins.push(nodeResolve({
                    moduleDirectories: [path$1.resolve(this.srcFolder, 'node_modules')]
                }), string({
                    include: '**/*.*',
                    exclude: stringExcludeNode,
                }), this.createServer(options.external));
            }
            else {
                const key = path$1.basename(this.sslKey) !== this.sslKey
                    ? this.sslKey
                    : fs.existsSync(this.sslKey)
                        ? fs.readFileSync(this.sslKey)
                        : undefined;
                const cert = path$1.basename(this.sslCrt) !== this.sslCrt
                    ? this.sslCrt
                    : fs.existsSync(this.sslCrt)
                        ? fs.readFileSync(this.sslCrt)
                        : undefined;
                options.output.format = 'es';
                options.plugins = [
                    eslint({
                        include: lintIncludeDom,
                    }),
                    ...options.plugins,
                    nodeResolve(),
                    image(),
                    styles({
                        mode: this.cssInJs ? 'inject' : 'extract',
                        url: true,
                        plugins: [autoprefixer()],
                        modules: this.cssModules,
                        sourceMap: true,
                    }),
                    string({
                        include: '**/*.*',
                        exclude: stringExcludeDom,
                    }),
                    this.createClient(key, cert, pkg),
                    livereload(Object.assign({ watch: this.publicFolder, verbose: false }, (key && cert ? { https: { key, cert } } : {})))
                ];
            }
            const watcher = rollup.watch(options);
            watcher.on('event', (e) => __awaiter(this, void 0, void 0, function* () {
                if (e.code == 'ERROR') {
                    if (e.error.code === 'UNRESOLVED_IMPORT') {
                        const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/);
                        const text = (yield fs.readFile(file)).toString();
                        const lines = new LinesAndColumns(text);
                        const { line, column } = lines.locationForIndex(text.indexOf(importer));
                        logger.end('Bundling', e.error.message);
                        console.log(`ERROR in ${file}:${line + 1}:${column + 1}`);
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
    run(file) {
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
                        typescript({
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
                const bundle = yield rollup.rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            yield logger.start('Running of the script', () => __awaiter(this, void 0, void 0, function* () {
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
            yield logger.start('Check src', () => {
                if (!fs.existsSync(this.srcFolder)) {
                    throw Error('src folder is missing');
                }
            });
            yield logger.start('Detection of index file', () => {
                if (fs.existsSync(path$1.join(this.srcFolder, 'index.js'))) {
                    this.projectExtension = 'js';
                }
                else if (fs.existsSync(path$1.join(this.srcFolder, 'index.ts'))) {
                    this.projectExtension = 'ts';
                }
                else if (fs.existsSync(path$1.join(this.srcFolder, 'index.tsx'))) {
                    this.projectExtension = 'tsx';
                }
                else if (fs.existsSync(path$1.join(this.srcFolder, 'index.jsx'))) {
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
            const packageFolder = path$1.resolve(this.projectFolder, 'package.json');
            yield logger.start('Check package.json', () => __awaiter(this, void 0, void 0, function* () {
                if (fs.existsSync(packageFolder)) {
                    this.package = yield fs.readJson(packageFolder);
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
                    app = express();
                    const update = () => __awaiter(this, void 0, void 0, function* () {
                        const data = yield promises.readFile(this.publicIndexFile);
                        yield promises.writeFile(this.devBuildIndexFile, yield convertIndexFile(data, pkg.version));
                    });
                    fs.watch(this.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(express.static(this.devBuildFolder));
                    app.use(express.static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        app.use(this.api, proxy(this.proxy, {
                            https: httpsUsing,
                            proxyReqPathResolver: req => req.originalUrl
                        }));
                    }
                    app.use(/^[^.]+$/, (req, res) => {
                        res.sendFile(this.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app);
                    server.listen(this.port, () => {
                        console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${this.port}`);
                    });
                }
            })
        };
    }
    createServer(external) {
        let app;
        return {
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                app === null || app === void 0 ? void 0 : app.kill();
                const filePath = path$1.resolve(this.buildFolder, 'index.js');
                let data = yield fs.readFile(filePath, 'UTF-8');
                const regExp = new RegExp(`require\\('(${external.join('|')})'\\)`, 'g');
                data = data.replace(regExp, `require('${path$1.resolve(this.projectFolder, 'node_modules', '$1')}')`);
                yield fs.writeFile(filePath, data);
                app = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
            })
        };
    }
}

export { InnetJS as default };
