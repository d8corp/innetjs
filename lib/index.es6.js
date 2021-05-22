import path from 'path';
import fs from 'fs-extra';
import http from 'http';
import https from 'https';
import ora from 'ora';
import chalk from 'chalk';
import util from 'util';
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

require('dotenv').config();
const publicFolder = process.env.PUBLIC_FOLDER || 'public';
const livereload = require('rollup-plugin-livereload');
const exec = util.promisify(require('child_process').exec);
const proxy = require('express-http-proxy');
function task(name, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = ora(name).start();
        try {
            const result = yield callback(task);
            task.succeed();
            return result;
        }
        catch (e) {
            task.fail();
            console.log(chalk.red('└ ' + ((e === null || e === void 0 ? void 0 : e.message) || e)));
            return Promise.reject(e);
        }
    });
}
function init(appName) {
    return __awaiter(this, void 0, void 0, function* () {
        const appPath = path.resolve(appName);
        const libPath = path.resolve(__dirname + '/..');
        yield task('Check if app folder is available', () => {
            if (fs.existsSync(appPath)) {
                throw Error(`'${appPath}' already exist`);
            }
        });
        yield task('Copy files', () => fs.copy(`${libPath}/template`, appPath));
        yield task('Install packages', () => exec(`cd ${appPath} && npm i`));
    });
}
function check(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const srcPath = `${projectPath}/src`;
        const publicPath = `${projectPath}/${publicFolder}`;
        let indexExtension;
        yield task('Check src', () => {
            if (!fs.existsSync(srcPath)) {
                throw Error('src folder is missing');
            }
        });
        yield task('Check public', () => {
            if (!fs.existsSync(publicPath)) {
                throw Error(`public folder is missing here ${publicPath}`);
            }
        });
        yield task('Check index.html', () => {
            if (!fs.existsSync(`${publicPath}/index.html`)) {
                throw Error('index.html is missing');
            }
        });
        yield task('Detection of index file', () => {
            if (fs.existsSync(`${srcPath}/index.js`)) {
                indexExtension = 'js';
            }
            else if (fs.existsSync(`${srcPath}/index.ts`)) {
                indexExtension = 'ts';
            }
            else if (fs.existsSync(`${srcPath}/index.tsx`)) {
                indexExtension = 'tsx';
            }
            else {
                throw Error('index file is not detected');
            }
        });
        return indexExtension;
    });
}
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
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const projectPath = path.resolve();
        let cert;
        let key;
        try {
            cert = fs.readFileSync(process.env.SSL_CRT_FILE || 'localhost.crt');
        }
        catch (e) { }
        try {
            key = fs.readFileSync(process.env.SSL_KEY_FILE || 'localhost.key');
        }
        catch (e) { }
        const indexExtension = yield check(projectPath);
        const options = {
            input: `src/index.${indexExtension}`,
            output: {
                sourcemap: true,
                format: 'iife',
                dir: `${publicFolder}/build`
            },
            plugins: [
                commonjs(),
                nodeResolve(),
                json(),
                postcss({
                    plugins: [autoprefixer()],
                    modules: process.env.CSS_MODULES === 'true',
                    sourceMap: true,
                    extract: process.env.CSS_EXTRACT === 'true' && path.resolve(`${publicFolder}/build/index.css`),
                }),
                typescript(),
                server(`${projectPath}/${publicFolder}`, cert, key),
                livereload(Object.assign({ watch: publicFolder, verbose: false }, (key && cert ? { https: { key, cert } } : {})))
            ],
        };
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
function build() {
    return __awaiter(this, void 0, void 0, function* () {
        const projectPath = path.resolve();
        const indexExtension = yield check(projectPath);
        yield task('Remove build', () => fs.remove(`${projectPath}/${publicFolder}/build`));
        yield task('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
            const inputOptions = {
                input: `src/index.${indexExtension}`,
                plugins: [
                    commonjs(),
                    nodeResolve(),
                    json(),
                    postcss({
                        plugins: [autoprefixer()],
                        extract: process.env.CSS_EXTRACT === 'true' && path.resolve(`${publicFolder}/build/index.css`),
                        modules: process.env.CSS_MODULES === 'true',
                        sourceMap: process.env.GENERATE_SOURCEMAP === 'true'
                    }),
                    typescript()
                ]
            };
            const outputOptions = {
                format: 'iife',
                dir: `${publicFolder}/build`,
                plugins: [terser()],
                sourcemap: process.env.GENERATE_SOURCEMAP === 'true'
            };
            const bundle = yield rollup.rollup(inputOptions);
            yield bundle.write(outputOptions);
            yield bundle.close();
        }));
    });
}
function run(file) {
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
            require('child_process').spawn('node', ['-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
        }));
    });
}
function server(rootPath, cert, key) {
    let app;
    return {
        writeBundle() {
            var _a;
            if (!app) {
                const httpsUsing = !!(cert && key);
                const port = process.env.PORT || 3000;
                app = express();
                app.use(express.static(rootPath));
                if ((_a = process.env.PROXY) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                    app.use(proxy(process.env.PROXY, {
                        https: httpsUsing
                    }));
                }
                const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app);
                server.listen(port, () => {
                    console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${port}`);
                });
            }
        }
    };
}

export { build, init, run, server, start };
