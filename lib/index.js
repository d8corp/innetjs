'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var fs = require('fs-extra');
var ora = require('ora');
var chalk = require('chalk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

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

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var util = require('util');
var exec = util.promisify(require('child_process').exec);
function task(name, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var task, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    task = ora__default['default'](name).start();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, callback(task)];
                case 2:
                    _a.sent();
                    task.succeed();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    task.fail();
                    console.log(chalk__default['default'].red('└ ' + ((e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || e_1)));
                    return [2 /*return*/, Promise.reject(e_1)];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function init(appName) {
    return __awaiter(this, void 0, void 0, function () {
        var appPath, libPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    appPath = path__default['default'].resolve(appName);
                    libPath = __dirname;
                    return [4 /*yield*/, task('Check if app folder is available', function () {
                            if (fs__default['default'].existsSync(appPath)) {
                                throw Error("'" + appPath + "' already exist");
                            }
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, task('Copy files', function () { return fs__default['default'].copy(libPath + "/template", appPath); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, task('Install packages', function () { return exec("cd " + appPath + " && npm i"); })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function start() {
}
function build() {
}

exports.build = build;
exports.init = init;
exports.start = start;
