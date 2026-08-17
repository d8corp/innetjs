'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var node_child_process = require('node:child_process');
var rolldown = require('rolldown');
var tmp = require('tmp');
var helpers = require('../../helpers.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var tmp__default = /*#__PURE__*/_interopDefaultLegacy(tmp);

function run(file_1) {
    return tslib.__awaiter(this, arguments, void 0, function* (file, { config = '', exposeGc = false, typeCheck } = {}) {
        const input = yield logger.logger.start('Check file', () => helpers.getFile(file));
        if (!input.length) {
            throw Error('index file is not detected');
        }
        if (typeCheck) {
            yield logger.logger.start('Check TypeScript', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { resolve, reject, promise } = Promise.withResolvers();
                const params = ['--noEmit'];
                if (config) {
                    params.push('-p', config);
                }
                const process = node_child_process.spawn('tsc', params, {
                    stdio: 'inherit',
                    shell: true,
                });
                process.on('close', (code) => {
                    if (code) {
                        reject();
                    }
                    else {
                        resolve(undefined);
                    }
                });
                yield promise;
            }));
        }
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
        yield logger.logger.start('Build bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const inputOptions = {
                input,
                plugins: [],
            };
            const outputOptions = {
                format: 'cjs',
                file: jsFilePath,
                sourcemap: true,
            };
            const bundle = yield rolldown.rolldown(inputOptions);
            yield bundle.write(outputOptions);
            yield bundle.close();
        }));
        yield logger.logger.start('Running of the script', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const flags = [];
            if (exposeGc) {
                flags.push('--expose-gc');
            }
            node_child_process.spawn('node', [...flags, '-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
        }));
    });
}

exports.run = run;
