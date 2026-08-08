import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import { promises } from 'node:fs';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'node:path';
import rollup from 'rollup';
import filesize from 'rollup-plugin-filesize';
import importAssets from 'rollup-plugin-import-assets';
import jsx from 'rollup-plugin-innet-jsx';
import polyfill from 'rollup-plugin-polyfill-node';
import { string } from 'rollup-plugin-string';
import styles from 'rollup-plugin-styles';
import { terser } from 'rollup-plugin-terser';
import { promisify } from 'node:util';
import { stringExcludeNode, imageInclude, stringExcludeDom } from '../../constants.mjs';
import { reporter, convertIndexFile } from '../../helpers.mjs';

const copyFiles = promisify(fs.copy);
function build({ node = false, inject = false, index = 'index' }, instance) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const input = glob.sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.start('Remove build', () => fs.remove(params.buildFolder));
        const pkg = node && (yield instance.getPackage());
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            plugins: [
                commonjs({
                    transformMixedEsModules: !node,
                }),
                json(),
                ts({
                    noEmitOnError: true,
                    compilerOptions: {
                        declaration: false,
                    },
                }),
                jsx(),
            ],
            onwarn(warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                    return;
                warn(warning);
            },
        };
        instance.withLint(options, true);
        const outputOptions = {
            dir: params.buildFolder,
            sourcemap: params.sourcemap,
        };
        if (node) {
            outputOptions.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            options.plugins.push(nodeResolve(), string({
                include: '**/*.*',
                exclude: stringExcludeNode,
            }));
        }
        else {
            options.plugins.push(nodeResolve({
                browser: true,
            }), polyfill(), importAssets({
                include: imageInclude.map(img => `src/${img}`),
                publicPath: params.baseUrl,
            }), styles({
                sass: {
                    outputStyle: 'compressed',
                },
                mode: params.cssInJs ? 'inject' : 'extract',
                url: {
                    inline: false,
                    publicPath: `${params.baseUrl}assets`,
                },
                plugins: [autoprefixer()],
                autoModules: params.cssModules ? (id) => !id.includes('.global.') : true,
                sourceMap: params.sourcemap,
                minimize: true,
            }), string({
                include: '**/*.*',
                exclude: stringExcludeDom,
            }));
            outputOptions.format = 'es';
            outputOptions.plugins = [
                terser(),
                filesize({
                    reporter,
                }),
            ];
        }
        instance.withEnv(options, true);
        yield logger.start('Build production bundle', () => __awaiter(this, void 0, void 0, function* () {
            const bundle = yield rollup.rollup(options);
            yield bundle.write(outputOptions);
            yield bundle.close();
            if (!node) {
                yield copyFiles(params.publicFolder, params.buildFolder);
                const data = yield promises.readFile(params.publicIndexFile);
                const pkg = yield instance.getPackage();
                yield promises.writeFile(params.buildIndexFile, yield convertIndexFile(data, pkg.version, params.baseUrl, path.parse(input[0]).name, inject));
            }
        }));
        if (pkg) {
            yield logger.start('Copy package.json', () => __awaiter(this, void 0, void 0, function* () {
                const data = Object.assign({}, pkg);
                delete data.private;
                delete data.devDependencies;
                yield fs.writeFile(path.resolve(params.buildFolder, 'package.json'), JSON.stringify(data, undefined, 2), 'UTF-8');
            }));
            const pkgLockPath = path.resolve(params.projectFolder, 'package-lock.json');
            if (fs.existsSync(pkgLockPath)) {
                yield logger.start('Copy package-lock.json', () => {
                    return fs.copy(pkgLockPath, path.resolve(params.buildFolder, 'package-lock.json'));
                });
            }
        }
    });
}

export { build };
