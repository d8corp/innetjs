'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var commonjs = require('@rollup/plugin-commonjs');
var json = require('@rollup/plugin-json');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var ts = require('@rollup/plugin-typescript');
var rollup = require('rollup');
var tmp = require('tmp');
var helpers = require('../../helpers.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var tmp__default = /*#__PURE__*/_interopDefaultLegacy(tmp);

const { spawn } = require('child_process');
function run(file, { config = '', exposeGc = false } = {}) {
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
                    ts__default["default"]({
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
            const bundle = yield rollup__default["default"].rollup(inputOptions);
            yield bundle.write(outputOptions);
            yield bundle.close();
        }));
        yield logger__default["default"].start('Running of the script', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const flags = [];
            if (exposeGc) {
                flags.push('--expose-gc');
            }
            spawn('node', [...flags, '-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
        }));
    });
}

exports.run = run;
