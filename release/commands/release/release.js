'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var image = require('@rollup/plugin-image');
var terser = require('@rollup/plugin-terser');
var autoprefixer = require('autoprefixer');
var node_child_process = require('node:child_process');
var node_fs = require('node:fs');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('node:path');
var rolldown = require('rolldown');
var external = require('rollup-plugin-external-node-modules');
var rollupPluginNodeExternals = require('rollup-plugin-node-externals');
var rollupPluginPreserveShebangs = require('rollup-plugin-preserve-shebangs');
var env = require('rollup-plugin-process-env');
var rollupPluginString = require('rollup-plugin-string');
var styles = require('rollup-plugin-styles');
var node_util = require('node:util');
var constants = require('../../constants.js');
require('../../utils/index.js');
var getNpmTag = require('../../utils/getNpmTag/getNpmTag.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var image__default = /*#__PURE__*/_interopDefaultLegacy(image);
var terser__default = /*#__PURE__*/_interopDefaultLegacy(terser);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var external__default = /*#__PURE__*/_interopDefaultLegacy(external);
var env__default = /*#__PURE__*/_interopDefaultLegacy(env);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);

const execAsync = node_util.promisify(node_child_process.exec);
function release(_a, instance_1) {
    return tslib.__awaiter(this, arguments, void 0, function* ({ index = 'index', pub, min, typeCheck, lintCheck }, instance) {
        const { releaseFolder, cssModules } = instance.params;
        if (typeCheck) {
            yield logger.logger.start('Check TypeScript', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { resolve, reject, promise } = Promise.withResolvers();
                const params = ['--emitDeclarationOnly'];
                if (instance.params.tsconfig) {
                    params.push('-p', instance.params.tsconfig);
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
        if (lintCheck) {
            yield logger.logger.start('Check ESLint', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { resolve, reject, promise } = Promise.withResolvers();
                const process = node_child_process.spawn('eslint', ['src'], {
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
        yield logger.logger.start('Remove previous release', () => fs__default["default"].remove(releaseFolder));
        const pkg = yield instance.getPackage();
        const build = (format) => tslib.__awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const ext = format === 'es'
                ? ((_a = (pkg.module || pkg.esnext || pkg['jsnext:main'])) === null || _a === void 0 ? void 0 : _a.replace('index', '')) || '.mjs'
                : ((_b = pkg.main) === null || _b === void 0 ? void 0 : _b.replace('index', '')) || '.js';
            const input = glob__default["default"].sync(`src/${index}.{${instance.params.indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            const output = format === 'iife'
                ? {
                    file: path__default["default"].join(releaseFolder, pkg.browser || 'index.min.js'),
                    codeSplitting: false,
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
                        if (constants.REG_TJSX.test(facadeModuleId)) {
                            return `${name}${ext}`;
                        }
                        const match = facadeModuleId.match(constants.REG_EXT);
                        return match ? `${name}${match[0]}${ext}` : `${name}${ext}`;
                    },
                };
            const plugins = [
                rollupPluginNodeExternals.externals(),
                rollupPluginString.string({
                    include: '**/*.*',
                    exclude: constants.stringExcludeDom,
                }),
                image__default["default"](),
                styles__default["default"]({
                    mode: instance.params.cssInJs ? 'inject' : 'extract',
                    plugins: [autoprefixer__default["default"]()],
                    autoModules: cssModules ? (id) => !id.includes('.global.') : true,
                    minimize: true,
                }),
                external__default["default"](),
                env__default["default"](instance.params.envPrefix, {
                    include: input,
                    virtual: true,
                }),
            ];
            const options = {
                input,
                external: ['tslib'],
                treeshake: false,
                output: Object.assign(Object.assign({}, output), { format }),
                plugins,
            };
            if (format === 'iife') {
                plugins.push(terser__default["default"]());
            }
            const bundle = yield rolldown.rolldown(options);
            yield bundle.write(options.output);
            yield bundle.close();
        });
        if (!pkg.type || pkg.type === 'commonjs') {
            yield logger.logger.start('Build cjs bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('cjs');
            }));
        }
        if (!pkg.type || pkg.type === 'module') {
            yield logger.logger.start('Build es6 bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('es');
            }));
        }
        if (min) {
            yield logger.logger.start('Build min bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('iife');
            }));
        }
        yield logger.logger.start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({}, pkg);
            delete data.private;
            delete data.devDependencies;
            fs__default["default"].writeFile(path__default["default"].resolve(instance.params.releaseFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
        }));
        if (pkg.bin) {
            yield logger.logger.start('Build bin', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { bin, type } = pkg;
                for (const name in bin) {
                    const value = bin[name];
                    const input = glob__default["default"].sync(`src/${value}.{${instance.params.indexExt}}`);
                    const file = path__default["default"].join(instance.params.releaseFolder, value);
                    const plugins = [
                        rollupPluginPreserveShebangs.preserveShebangs(),
                        rollupPluginNodeExternals.externals(),
                        env__default["default"](instance.params.envPrefix, {
                            include: input,
                        }),
                    ];
                    const options = {
                        input,
                        external: [...Object.keys(pkg.dependencies), 'tslib'],
                        output: {
                            file,
                            format: type === 'module' ? 'es' : 'cjs',
                        },
                        plugins,
                    };
                    const bundle = yield rolldown.rolldown(options);
                    yield bundle.write(options.output);
                    yield bundle.close();
                }
            }));
        }
        if (fs__default["default"].existsSync(instance.params.licenseFile)) {
            yield logger.logger.start('Copy license', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile);
            }));
        }
        if (fs__default["default"].existsSync(instance.params.readmeFile)) {
            yield logger.logger.start('Copy readme', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile);
            }));
        }
        if (fs__default["default"].existsSync(instance.params.declarationFile)) {
            yield logger.logger.start('Copy declaration', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile);
            }));
        }
        if (pub) {
            const date = (Date.now() / 1000) | 0;
            yield logger.logger.start(`publishing v${pkg.version} ${date}`, () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield execAsync(`npm publish ${instance.params.releaseFolder} --tag ${getNpmTag.getNpmTag(pkg.version)}`);
            }));
        }
    });
}

exports.release = release;
