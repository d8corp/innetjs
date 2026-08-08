'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var eslint = require('@rollup/plugin-eslint');
var address = require('address');
var chalk = require('chalk');
var express = require('express');
var proxy = require('express-http-proxy');
var fs = require('fs-extra');
var http = require('node:http');
var https = require('node:https');
var path = require('node:path');
var prompt = require('prompts');
var env = require('rollup-plugin-process-env');
require('../commands/index.js');
var constants = require('../constants.js');
var helpers = require('../helpers.js');
require('../utils/index.js');
var updateDotenv = require('../utils/updateDotenv/updateDotenv.js');
var getDefaultOptions = require('../utils/getDefaultOptions/getDefaultOptions.js');
var init = require('../commands/init/init.js');
var build = require('../commands/build/build.js');
var start = require('../commands/start/start.js');
var run = require('../commands/run/run.js');
var release = require('../commands/release/release.js');
var printErrorWithFrame = require('../utils/printErrorWithFrame/printErrorWithFrame.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var eslint__default = /*#__PURE__*/_interopDefaultLegacy(eslint);
var address__default = /*#__PURE__*/_interopDefaultLegacy(address);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var proxy__default = /*#__PURE__*/_interopDefaultLegacy(proxy);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var prompt__default = /*#__PURE__*/_interopDefaultLegacy(prompt);
var env__default = /*#__PURE__*/_interopDefaultLegacy(env);

const { spawn } = require('child_process');
updateDotenv.updateDotenv();
class InnetJS {
    constructor(options = {}) {
        this.params = getDefaultOptions.getDefaultOptions(options);
    }
    // Methods
    init(appName, options) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            yield init.init(appName, options);
        });
    }
    build(options = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            yield build.build(options, this);
        });
    }
    start(options = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            yield start.start(options, this);
        });
    }
    run(file, options = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            yield run.run(file, options);
        });
    }
    release(options = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            yield release.release(options, this);
        });
    }
    withLint(options, prod = false) {
        if (this._lintUsage === undefined) {
            this._lintUsage = fs__default["default"].existsSync(path__default["default"].join(this.params.projectFolder, '.eslintrc'));
        }
        if (this._lintUsage) {
            options.plugins.push(eslint__default["default"]({
                include: constants.lintInclude,
                throwOnError: prod,
            }));
        }
    }
    withEnv(options, virtual, preset) {
        options.plugins.push(env__default["default"](this.params.envPrefix, {
            include: options.input,
            virtual,
            preset,
        }));
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
                yield fs__default["default"].writeFile(path__default["default"].resolve(this.params.projectFolder, 'package.json'), JSON.stringify(pkg, undefined, 2), 'UTF-8');
            }));
        });
    }
    getPackage() {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (this.package) {
                return this.package;
            }
            const packageFolder = path__default["default"].resolve(this.params.projectFolder, 'package.json');
            yield logger__default["default"].start('Check package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
                if (fs__default["default"].existsSync(packageFolder)) {
                    this.package = yield fs__default["default"].readJson(packageFolder);
                }
            }));
            return this.package;
        });
    }
    createClient(key, cert, pkg, index, inject) {
        let app;
        return {
            name: 'client',
            writeBundle: () => tslib.__awaiter(this, void 0, void 0, function* () {
                var _a;
                if (!app) {
                    app = express__default["default"]();
                    const update = () => tslib.__awaiter(this, void 0, void 0, function* () {
                        const data = yield fs.promises.readFile(this.params.publicIndexFile);
                        yield fs.promises.writeFile(this.params.devBuildIndexFile, yield helpers.convertIndexFile(data, pkg.version, this.params.baseUrl, index, inject));
                    });
                    fs__default["default"].watch(this.params.publicIndexFile, update);
                    yield update();
                    const httpsUsing = !!(cert && key);
                    app.use(this.params.baseUrl, express__default["default"].static(this.params.devBuildFolder));
                    app.use(this.params.baseUrl, express__default["default"].static(this.params.publicFolder));
                    if ((_a = this.params.proxy) === null || _a === void 0 ? void 0 : _a.startsWith('http')) {
                        if (this.params.simulateIP) {
                            app.use((req, res, next) => {
                                req.headers['X-Real-IP'] = this.params.simulateIP;
                                next();
                            });
                        }
                        app.use(this.params.api, proxy__default["default"](this.params.proxy, {
                            https: httpsUsing,
                            limit: '1000mb',
                            proxyReqPathResolver: req => req.originalUrl,
                        }));
                    }
                    app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
                        res.sendFile(this.params.devBuildFolder + '/index.html');
                    });
                    const server = httpsUsing ? https__default["default"].createServer({ key, cert }, app) : http__default["default"].createServer(app);
                    let port = this.params.port;
                    const listener = () => {
                        const baseUrl = this.params.baseUrl === '/' ? '' : this.params.baseUrl;
                        console.log(`${chalk__default["default"].green('➤')} Started on http${httpsUsing ? 's' : ''}://localhost:${port}${baseUrl} and http${httpsUsing ? 's' : ''}://${address__default["default"].ip()}:${port}${baseUrl}`);
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
    createServer(input, error = false, usualConsoleOutput = false) {
        const apps = {};
        return {
            name: 'server',
            writeBundle: () => tslib.__awaiter(this, void 0, void 0, function* () {
                var _a;
                for (const file of input) {
                    let stderrBuffer = '';
                    const { name } = path__default["default"].parse(file);
                    (_a = apps[name]) === null || _a === void 0 ? void 0 : _a.kill();
                    const filePath = path__default["default"].resolve(this.params.devBuildFolder, `${name}.js`);
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
                            console.error(printErrorWithFrame.printErrorWithFrame(stderrBuffer, 0, !error));
                            stderrBuffer = '';
                        }
                    });
                }
            }),
        };
    }
}

exports.InnetJS = InnetJS;
