import { __awaiter } from 'tslib';
import { logger } from '@cantinc/logger';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import ts from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import { promises } from 'node:fs';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'node:path';
import { rollup } from 'rollup';
import external from 'rollup-plugin-external-node-modules';
import jsx from 'rollup-plugin-innet-jsx';
import { externals } from 'rollup-plugin-node-externals';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import { string } from 'rollup-plugin-string';
import styles from 'rollup-plugin-styles';
import { promisify } from 'node:util';
import { REG_TJSX, REG_EXT, stringExcludeDom } from '../../constants.mjs';
import '../../utils/index.mjs';
import { getNpmTag } from '../../utils/getNpmTag/getNpmTag.mjs';

const { exec } = require('child_process');
const execAsync = promisify(exec);
function release(_a, instance_1) {
    return __awaiter(this, arguments, void 0, function* ({ index = 'index', pub, min }, instance) {
        const { releaseFolder, cssModules } = instance.params;
        yield logger.start('Remove previous release', () => fs.remove(releaseFolder));
        const pkg = yield instance.getPackage();
        const build = (format) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const ext = format === 'es'
                ? ((_a = (pkg.module || pkg.esnext || pkg['jsnext:main'])) === null || _a === void 0 ? void 0 : _a.replace('index', '')) || '.mjs'
                : ((_b = pkg.main) === null || _b === void 0 ? void 0 : _b.replace('index', '')) || '.js';
            const input = glob.sync(`src/${index}.{${instance.params.indexExt}}`);
            if (!input.length) {
                throw Error('index file is not detected');
            }
            const output = format === 'iife'
                ? {
                    file: path.join(releaseFolder, pkg.browser || 'index.min.js'),
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
                        if (REG_TJSX.test(facadeModuleId)) {
                            return `${name}${ext}`;
                        }
                        const match = facadeModuleId.match(REG_EXT);
                        return match ? `${name}${match[0]}${ext}` : `${name}${ext}`;
                    },
                };
            const options = {
                input,
                external: ['tslib'],
                treeshake: false,
                output: Object.assign(Object.assign({}, output), { format }),
                plugins: [
                    json(),
                    ts({
                        tsconfig: instance.params.tsconfig,
                        compilerOptions: {
                            sourceMap: false,
                            outDir: releaseFolder,
                        },
                    }),
                    jsx(),
                    externals(),
                    string({
                        include: '**/*.*',
                        exclude: stringExcludeDom,
                    }),
                    image(),
                    styles({
                        mode: instance.params.cssInJs ? 'inject' : 'extract',
                        plugins: [autoprefixer()],
                        autoModules: cssModules ? (id) => !id.includes('.global.') : true,
                        minimize: true,
                    }),
                    nodeResolve(),
                    external(),
                ],
            };
            if (format === 'iife') {
                options.plugins.push(terser());
            }
            instance.withLint(options);
            instance.withEnv(options, true);
            const bundle = yield rollup(options);
            yield bundle.write(options.output);
            yield bundle.close();
        });
        if (!pkg.type || pkg.type === 'commonjs') {
            yield logger.start('Build cjs bundle', () => __awaiter(this, void 0, void 0, function* () {
                yield build('cjs');
            }));
        }
        if (!pkg.type || pkg.type === 'module') {
            yield logger.start('Build es6 bundle', () => __awaiter(this, void 0, void 0, function* () {
                yield build('es');
            }));
        }
        if (min) {
            yield logger.start('Build min bundle', () => __awaiter(this, void 0, void 0, function* () {
                yield build('iife');
            }));
        }
        yield logger.start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({}, pkg);
            delete data.private;
            delete data.devDependencies;
            fs.writeFile(path.resolve(instance.params.releaseFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
        }));
        if (pkg.bin) {
            yield logger.start('Build bin', () => __awaiter(this, void 0, void 0, function* () {
                const { bin, type } = pkg;
                for (const name in bin) {
                    const value = bin[name];
                    const input = glob.sync(`src/${value}.{${instance.params.indexExt}}`);
                    const file = path.join(instance.params.releaseFolder, value);
                    const options = {
                        input,
                        external: [...Object.keys(pkg.dependencies), 'tslib'],
                        output: {
                            file,
                            format: type === 'module' ? 'es' : 'cjs',
                        },
                        plugins: [
                            preserveShebangs(),
                            json(),
                            ts({
                                compilerOptions: {
                                    declaration: false,
                                },
                            }),
                            externals(),
                            jsx(),
                        ],
                    };
                    instance.withLint(options);
                    instance.withEnv(options);
                    const bundle = yield rollup(options);
                    yield bundle.write(options.output);
                    yield bundle.close();
                }
            }));
        }
        if (fs.existsSync(instance.params.licenseFile)) {
            yield logger.start('Copy license', () => __awaiter(this, void 0, void 0, function* () {
                yield promises.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile);
            }));
        }
        if (fs.existsSync(instance.params.readmeFile)) {
            yield logger.start('Copy readme', () => __awaiter(this, void 0, void 0, function* () {
                yield promises.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile);
            }));
        }
        if (fs.existsSync(instance.params.declarationFile)) {
            yield logger.start('Copy declaration', () => __awaiter(this, void 0, void 0, function* () {
                yield promises.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile);
            }));
        }
        if (pub) {
            const date = (Date.now() / 1000) | 0;
            yield logger.start(`publishing v${pkg.version} ${date}`, () => __awaiter(this, void 0, void 0, function* () {
                yield execAsync(`npm publish ${instance.params.releaseFolder} --tag ${getNpmTag(pkg.version)}`);
            }));
        }
    });
}

export { release };
