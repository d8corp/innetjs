'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var Zip = require('adm-zip');
var axios = require('axios');
var chalk = require('chalk');
var node_child_process = require('node:child_process');
var selector = require('cli-select');
var fs = require('fs-extra');
var node_os = require('node:os');
var path = require('node:path');
var readline = require('node:readline');
var stream = require('node:stream');
var node_util = require('node:util');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var Zip__default = /*#__PURE__*/_interopDefaultLegacy(Zip);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var selector__default = /*#__PURE__*/_interopDefaultLegacy(selector);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var readline__default = /*#__PURE__*/_interopDefaultLegacy(readline);
var stream__default = /*#__PURE__*/_interopDefaultLegacy(stream);

const execAsync = node_util.promisify(node_child_process.exec);
const pipeline = node_util.promisify(stream__default["default"].pipeline);
function init(appName, { template, force = false } = {}) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const appPath = path__default["default"].resolve(appName);
        const { data } = yield logger__default["default"].start('Get templates list', () => tslib.__awaiter(this, void 0, void 0, function* () { return yield axios__default["default"].get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
        const templates = data.map(({ name }) => name).filter((name) => name !== 'main');
        if (!template || !templates.includes(template)) {
            logger__default["default"].log(chalk__default["default"].green('Select one of those templates'));
            const { value } = yield selector__default["default"]({
                values: templates,
            });
            template = value;
            readline__default["default"].moveCursor(process.stdout, 0, -1);
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
                    readline__default["default"].moveCursor(process.stdout, 0, -1);
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
            const tmpPath = node_os.tmpdir();
            const zipPath = path__default["default"].join(tmpPath, 'template.zip');
            const unzipPath = path__default["default"].join(tmpPath, `innetjs-templates-${template}`);
            const { data } = yield axios__default["default"].get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                responseType: 'stream',
            });
            yield pipeline(data, fs__default["default"].createWriteStream(zipPath));
            const zip = new Zip__default["default"](zipPath);
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
            yield fs__default["default"].remove(zipPath);
            yield fs__default["default"].move(unzipPath, appPath, { overwrite: true });
        }));
        yield logger__default["default"].start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
    });
}

exports.init = init;
