import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import eslint from '@rollup/plugin-eslint';
import address from 'address';
import chalk from 'chalk';
import express from 'express';
import proxy from 'express-http-proxy';
import fs, { promises } from 'fs-extra';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import prompt from 'prompts';
import env from 'rollup-plugin-process-env';
import '../commands/index.mjs';
import { lintInclude } from '../constants.mjs';
import { convertIndexFile } from '../helpers.mjs';
import '../utils/index.mjs';
import { updateDotenv } from '../utils/updateDotenv/updateDotenv.mjs';
import { getDefaultOptions } from '../utils/getDefaultOptions/getDefaultOptions.mjs';
import { init } from '../commands/init/init.mjs';
import { build } from '../commands/build/build.mjs';
import { start } from '../commands/start/start.mjs';
import { run } from '../commands/run/run.mjs';
import { release } from '../commands/release/release.mjs';
import { printErrorWithFrame } from '../utils/printErrorWithFrame/printErrorWithFrame.mjs';

const { spawn } = require('child_process');
updateDotenv();
class InnetJS {
    constructor(options = {}) {
        this.params = getDefaultOptions(options);
    }
    // Methods
    init(appName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield init(appName, options);
        });
    }
    build(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield build(options, this);
        });
    }
    start(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield start(options, this);
        });
    }
    run(file, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield run(file, options);
        });
    }
    release(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield release(options, this);
        });
    }
    withLint(options, prod = false) {
        if (this._lintUsage === undefined) {
            this._lintUsage = fs.existsSync(path.join(this.params.projectFolder, '.eslintrc'));
        }
        if (this._lintUsage) {
            options.plugins.push(eslint({
                include: lintInclude,
                throwOnError: prod,
            }));
        }
    }
    withEnv(options, virtual, preset) {
        options.plugins.push(env(this.params.envPrefix, {
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
                yield fs.writeFile(path.resolve(this.params.projectFolder, 'package.json'), JSON.stringify(pkg, undefined, 2), 'UTF-8');
            }));
        });
    }
    getPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.package) {
                return this.package;
            }
            const packageFolder = path.resolve(this.params.projectFolder, 'package.json');
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
                        const data = yield promises.readFile(this.params.publicIndexFile);
                        yield promises.writeFile(this.params.devBuildIndexFile, yield convertIndexFile(data, pkg.version, this.params.baseUrl, index, inject));
                    });
                    fs.watch(this.params.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(this.params.baseUrl, express.static(this.params.devBuildFolder));
                    app.use(this.params.baseUrl, express.static(this.params.publicFolder));
                    if ((_a = this.params.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        if (this.params.simulateIP) {
                            app.use((req, res, next) => {
                                req.headers['X-Real-IP'] = this.params.simulateIP;
                                next();
                            });
                        }
                        app.use(this.params.api, proxy(this.params.proxy, {
                            https: httpsUsing,
                            limit: '1000mb',
                            proxyReqPathResolver: req => req.originalUrl,
                        }));
                    }
                    app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
                        res.sendFile(this.params.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app);
                    let port = this.params.port;
                    const listener = () => {
                        const baseUrl = this.params.baseUrl === '/' ? '' : this.params.baseUrl;
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
    createServer(input, error = false, usualConsoleOutput = false) {
        const apps = {};
        return {
            name: 'server',
            writeBundle: () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                for (const file of input) {
                    let stderrBuffer = '';
                    const { name } = path.parse(file);
                    (_a = apps[name]) === null || _a === void 0 ? void 0 : _a.kill();
                    const filePath = path.resolve(this.params.devBuildFolder, `${name}.js`);
                    if (usualConsoleOutput) {
                        apps[name] = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' });
                        return;
                    }
                    const child = spawn('node', ['-r', 'source-map-support/register', filePath], {
                        stdio: ['inherit', 'inherit'],
                    });
                    apps[name] = child;
                    child.stderr.on('data', (chunk) => {
                        stderrBuffer += chunk.toString();
                    });
                    child.on('close', (code) => {
                        if (code !== 0 && stderrBuffer) {
                            console.error(printErrorWithFrame(stderrBuffer, 0, !error));
                            stderrBuffer = '';
                        }
                    });
                }
            }),
        };
    }
}

export { InnetJS };
