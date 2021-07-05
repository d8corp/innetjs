import path from 'path';
import fs from 'fs-extra';
import http from 'http';
import https from 'https';
import ora from 'ora';
import chalk from 'chalk';
import { promisify } from 'util';
import rollup from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import express from 'express';
import json from '@rollup/plugin-json';
import tmp from 'tmp';
import proxy from 'express-http-proxy';
import selector from 'cli-select';
import jsx from 'rollup-plugin-innet-jsx';

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
const execAsync = promisify(exec);
require('dotenv').config();
function getFile(file) {
    file = path.resolve(file);
    if (!fs.existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    if (fs.lstatSync(file).isDirectory()) {
        let tmpFile = file;
        if (!fs.existsSync(tmpFile = path.join(file, 'index.ts')) &&
            !fs.existsSync(tmpFile = path.join(file, 'index.tsx')) &&
            !fs.existsSync(tmpFile = path.join(file, 'index.js'))) {
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
function task(name, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = ora(name).start();
        try {
            const result = yield callback(task);
            task.succeed();
            readline.clearLine(process.stdout, 1);
            return result;
        }
        catch (e) {
            task.fail();
            readline.clearLine(process.stdout, 1);
            console.log(chalk.red('└ ' + ((e === null || e === void 0 ? void 0 : e.message) || e)));
            return Promise.reject(e);
        }
    });
}
class InnetJS {
    constructor({ projectFolder = process.env.PROJECT_FOLDER || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', buildFolder = process.env.BUILD_FOLDER || path.join('public', 'build'), srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : false, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : false, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', port = process.env.PORT ? +process.env.PORT : 3000, } = {}) {
        this.projectFolder = path.resolve(projectFolder);
        this.publicFolder = path.resolve(publicFolder);
        this.buildFolder = path.resolve(buildFolder);
        this.srcFolder = path.resolve(srcFolder);
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
            const appPath = path.resolve(appName);
            if (!force) {
                yield task('Check if app folder is available', (task) => __awaiter(this, void 0, void 0, function* () {
                    if (fs.existsSync(appPath)) {
                        task.fail();
                        console.log(chalk.red(`└ '${appPath}' already exist, what do you want?`));
                        const { id: result } = yield selector({
                            values: ['Stop the process', 'Remove the folder', 'Merge with template']
                        });
                        readline.moveCursor(process.stdout, 0, -2);
                        if (!result) {
                            throw Error(`'${appPath}' already exist`);
                        }
                        if (result === 1) {
                            yield fs.remove(appPath);
                        }
                    }
                }));
            }
            const libPath = path.resolve(__dirname, '..');
            const templatePath = path.resolve(libPath, 'templates', template);
            yield task('Check if the template exists', () => {
                if (!fs.existsSync(templatePath)) {
                    throw Error(`The template '${template}' is not exist`);
                }
            });
            yield task('Copy files', () => fs.copy(templatePath, appPath));
            yield task('Install packages', () => execAsync(`cd ${appPath} && npm i`));
        });
    }
    build({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            yield task('Remove build', () => fs.remove(this.buildFolder));
            const pkg = node && (yield this.getPackage());
            const inputOptions = {
                input: path.resolve(this.srcFolder, `index.${indexExtension}`),
                plugins: [
                    commonjs(),
                    nodeResolve(),
                    json(),
                    typescript(),
                    jsx(),
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
                inputOptions.plugins.push(postcss({
                    plugins: [autoprefixer()],
                    extract: !this.cssInJs,
                    modules: this.cssModules,
                    sourceMap: this.sourcemap,
                    minimize: true
                }));
                outputOptions.format = 'iife';
                outputOptions.plugins = [terser()];
            }
            yield task('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
                const bundle = yield rollup.rollup(inputOptions);
                yield bundle.write(outputOptions);
                yield bundle.close();
            }));
            if (pkg) {
                yield task('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                    const data = Object.assign({}, pkg);
                    delete data.private;
                    delete data.devDependencies;
                    yield fs.writeFile(path.resolve(this.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
                }));
                const pkgLockPath = path.resolve(this.projectFolder, 'package-lock.json');
                if (fs.existsSync(pkgLockPath)) {
                    yield task('Copy package-lock.json', () => {
                        return fs.copy(pkgLockPath, path.resolve(this.buildFolder, 'package-lock.json'));
                    });
                }
            }
        });
    }
    start({ node = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexExtension = yield this.getProjectExtension();
            const pkg = node && (yield this.getPackage());
            yield task('Remove build', () => fs.remove(this.buildFolder));
            const options = {
                input: path.resolve(this.srcFolder, `index.${indexExtension}`),
                output: {
                    dir: this.buildFolder,
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
                    moduleDirectories: [path.resolve(this.srcFolder, 'node_modules')]
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
                options.output.format = 'iife';
                options.plugins.push(nodeResolve(), string({
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
                }), postcss({
                    plugins: [autoprefixer()],
                    modules: this.cssModules,
                    sourceMap: true,
                    extract: !this.cssInJs,
                }), this.createClient(key, cert), livereload(Object.assign({ watch: this.publicFolder, verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
            }
            const watcher = rollup.watch(options);
            let eventTask;
            watcher.on('event', e => {
                if (e.code == 'ERROR') {
                    eventTask.fail('Bundling is failed');
                    console.log(chalk.red('└ ' + e.error.message));
                }
                else if (e.code === 'BUNDLE_START') {
                    if (!!(eventTask === null || eventTask === void 0 ? void 0 : eventTask.isSpinning)) {
                        eventTask.stop();
                    }
                    eventTask = ora('Bundling\n').start();
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
            yield task('Build bundle', () => __awaiter(this, void 0, void 0, function* () {
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
                if (!fs.existsSync(this.srcFolder)) {
                    throw Error('src folder is missing');
                }
            });
            yield task('Detection of index file', () => {
                if (fs.existsSync(path.join(this.srcFolder, 'index.js'))) {
                    this.projectExtension = 'js';
                }
                else if (fs.existsSync(path.join(this.srcFolder, 'index.ts'))) {
                    this.projectExtension = 'ts';
                }
                else if (fs.existsSync(path.join(this.srcFolder, 'index.tsx'))) {
                    this.projectExtension = 'tsx';
                }
                else if (fs.existsSync(path.join(this.srcFolder, 'index.jsx'))) {
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
            const packageFolder = path.resolve(this.projectFolder, 'package.json');
            yield task('Check package.json', () => __awaiter(this, void 0, void 0, function* () {
                if (fs.existsSync(packageFolder)) {
                    this.package = yield fs.readJson(packageFolder);
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
                    app = express();
                    app.use(express.static(this.publicFolder));
                    if ((_a = this.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        app.use(proxy(this.proxy, {
                            https: httpsUsing
                        }));
                    }
                    const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app);
                    server.listen(this.port, () => {
                        console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${this.port}`);
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
                const filePath = path.resolve(this.buildFolder, 'index.js');
                let data = yield fs.readFile(filePath, 'UTF-8');
                const regExp = new RegExp(`require\\('(${external.join('|')})'\\)`, 'g');
                data = data.replace(regExp, `require('${path.resolve(this.projectFolder, 'node_modules', '$1')}')`);
                yield fs.writeFile(filePath, data);
                app = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
            })
        };
    }
}

export default InnetJS;
export { task };
