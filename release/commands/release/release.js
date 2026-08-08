'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var logger = require('@cantinc/logger');
var fs = require('fs-extra');
var rollup = require('rollup');
var rollupPluginString = require('rollup-plugin-string');
var glob = require('glob');
var path = require('node:path');
var constants = require('../../constants.js');
var json = require('@rollup/plugin-json');
var ts = require('@rollup/plugin-typescript');
var jsx = require('rollup-plugin-innet-jsx');
var externals = require('rollup-plugin-node-externals');
var image = require('@rollup/plugin-image');
var styles = require('rollup-plugin-styles');
var autoprefixer = require('autoprefixer');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var external = require('rollup-plugin-external-node-modules');
var rollupPluginTerser = require('rollup-plugin-terser');
var rollupPluginPreserveShebangs = require('rollup-plugin-preserve-shebangs');
var node_fs = require('node:fs');
require('../../utils/index.js');
var node_util = require('node:util');
var getNpmTag = require('../../utils/getNpmTag/getNpmTag.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var logger__default = /*#__PURE__*/_interopDefaultLegacy(logger);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var rollup__default = /*#__PURE__*/_interopDefaultLegacy(rollup);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var jsx__default = /*#__PURE__*/_interopDefaultLegacy(jsx);
var externals__default = /*#__PURE__*/_interopDefaultLegacy(externals);
var image__default = /*#__PURE__*/_interopDefaultLegacy(image);
var styles__default = /*#__PURE__*/_interopDefaultLegacy(styles);
var autoprefixer__default = /*#__PURE__*/_interopDefaultLegacy(autoprefixer);
var external__default = /*#__PURE__*/_interopDefaultLegacy(external);

const { exec } = require('child_process');
const execAsync = node_util.promisify(exec);
function release({ index = 'index', pub, min }, instance) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const { releaseFolder, cssModules } = instance.params;
        yield logger__default["default"].start('Remove previous release', () => fs__default["default"].remove(releaseFolder));
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
                    inlineDynamicImports: true,
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
            const options = {
                input,
                external: ['tslib'],
                treeshake: false,
                output: Object.assign(Object.assign({}, output), { format }),
                plugins: [
                    json__default["default"](),
                    ts__default["default"]({
                        tsconfig: instance.params.tsconfig,
                        compilerOptions: {
                            sourceMap: false,
                            outDir: releaseFolder,
                        },
                    }),
                    jsx__default["default"](),
                    externals__default["default"](),
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
                    pluginNodeResolve.nodeResolve(),
                    external__default["default"](),
                ],
            };
            if (format === 'iife') {
                options.plugins.push(rollupPluginTerser.terser());
            }
            instance.withLint(options);
            instance.withEnv(options, true);
            const bundle = yield rollup__default["default"].rollup(options);
            yield bundle.write(options.output);
            yield bundle.close();
        });
        if (!pkg.type || pkg.type === 'commonjs') {
            yield logger__default["default"].start('Build cjs bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('cjs');
            }));
        }
        if (!pkg.type || pkg.type === 'module') {
            yield logger__default["default"].start('Build es6 bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('es');
            }));
        }
        if (min) {
            yield logger__default["default"].start('Build min bundle', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield build('iife');
            }));
        }
        yield logger__default["default"].start('Copy package.json', () => tslib.__awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({}, pkg);
            delete data.private;
            delete data.devDependencies;
            fs__default["default"].writeFile(path__default["default"].resolve(instance.params.releaseFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
        }));
        if (pkg.bin) {
            yield logger__default["default"].start('Build bin', () => tslib.__awaiter(this, void 0, void 0, function* () {
                const { bin, type } = pkg;
                for (const name in bin) {
                    const value = bin[name];
                    const input = glob__default["default"].sync(`src/${value}.{${instance.params.indexExt}}`);
                    const file = path__default["default"].join(instance.params.releaseFolder, value);
                    const options = {
                        input,
                        external: [...Object.keys(pkg.dependencies), 'tslib'],
                        output: {
                            file,
                            format: type === 'module' ? 'es' : 'cjs',
                        },
                        plugins: [
                            rollupPluginPreserveShebangs.preserveShebangs(),
                            json__default["default"](),
                            ts__default["default"]({
                                compilerOptions: {
                                    declaration: false,
                                },
                            }),
                            externals__default["default"](),
                            jsx__default["default"](),
                        ],
                    };
                    instance.withLint(options);
                    instance.withEnv(options);
                    const bundle = yield rollup__default["default"].rollup(options);
                    yield bundle.write(options.output);
                    yield bundle.close();
                }
            }));
        }
        if (fs__default["default"].existsSync(instance.params.licenseFile)) {
            yield logger__default["default"].start('Copy license', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile);
            }));
        }
        if (fs__default["default"].existsSync(instance.params.readmeFile)) {
            yield logger__default["default"].start('Copy readme', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile);
            }));
        }
        if (fs__default["default"].existsSync(instance.params.declarationFile)) {
            yield logger__default["default"].start('Copy declaration', () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield node_fs.promises.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile);
            }));
        }
        if (pub) {
            const date = (Date.now() / 1000) | 0;
            yield logger__default["default"].start(`publishing v${pkg.version} ${date}`, () => tslib.__awaiter(this, void 0, void 0, function* () {
                yield execAsync(`npm publish ${instance.params.releaseFolder} --tag ${getNpmTag.getNpmTag(pkg.version)}`);
            }));
        }
    });
}

exports.release = release;
