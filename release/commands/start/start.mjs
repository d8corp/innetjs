import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import fs from 'fs-extra';
import glob from 'glob';
import { LinesAndColumns } from 'lines-and-columns';
import path from 'node:path';
import rollup from 'rollup';
import importAssets from 'rollup-plugin-import-assets';
import jsx from 'rollup-plugin-innet-jsx';
import livereload from 'rollup-plugin-livereload';
import polyfill from 'rollup-plugin-polyfill-node';
import { string } from 'rollup-plugin-string';
import styles from 'rollup-plugin-styles';
import { stringExcludeNode, imageInclude, stringExcludeDom, REG_CLEAR_TEXT, REG_RPT_ERROR_FILE } from '../../constants.mjs';

function start({ node = false, inject = false, error = false, usualConsoleOutput = false, index = 'index', }, instance) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob.sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.start('Remove build', () => fs.remove(params.devBuildFolder));
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output: {
                dir: params.devBuildFolder,
                sourcemap: true,
            },
            plugins: [
                commonjs({
                    transformMixedEsModules: !node,
                }),
                json(),
                ts({
                    compilerOptions: {
                        declaration: false,
                        sourceMap: true,
                    },
                }),
                jsx(),
            ],
            onwarn(warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR')
                    return;
                if (warning.plugin === 'typescript') {
                    const { loc, frame, message } = warning;
                    if (loc) {
                        const { line, column, file } = loc;
                        console.log(`ERROR in ${file}:${line}:${column}`);
                    }
                    console.log(message);
                    console.log(frame);
                    return;
                }
                warn(warning);
            },
        };
        let preset;
        instance.withLint(options);
        if (node) {
            preset = { NODE_ENV: 'dev' };
            // @ts-expect-error
            options.output.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            options.plugins.push(nodeResolve(), string({
                include: '**/*.*',
                exclude: stringExcludeNode,
            }), instance.createServer(input, error, usualConsoleOutput));
        }
        else {
            const key = path.basename(params.sslKey) !== params.sslKey
                ? params.sslKey
                : fs.existsSync(params.sslKey)
                    ? fs.readFileSync(params.sslKey)
                    : undefined;
            const cert = path.basename(params.sslCrt) !== params.sslCrt
                ? params.sslCrt
                : fs.existsSync(params.sslCrt)
                    ? fs.readFileSync(params.sslCrt)
                    : undefined;
            // @ts-expect-error
            options.output.format = 'es';
            options.plugins.push(nodeResolve({
                browser: true,
            }), polyfill(), importAssets({
                include: imageInclude.map(img => `src/${img}`),
                publicPath: params.baseUrl,
            }), styles({
                mode: params.cssInJs ? 'inject' : 'extract',
                url: {
                    inline: false,
                    publicPath: `${params.baseUrl}assets`,
                },
                sass: {
                    silenceDeprecations: ['legacy-js-api'],
                },
                plugins: [autoprefixer()],
                autoModules: params.cssModules ? (id) => !id.includes('.global.') : true,
                sourceMap: true,
            }), string({
                include: '**/*.*',
                exclude: stringExcludeDom,
            }), instance.createClient(key, cert, pkg, path.parse(input[0]).name, inject), livereload(Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [params.devBuildFolder, params.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
        }
        instance.withEnv(options, true, preset);
        const watcher = rollup.watch(options);
        watcher.on('event', (e) => __awaiter(this, void 0, void 0, function* () {
            if (e.code === 'ERROR') {
                if (e.error.code === 'UNRESOLVED_IMPORT') {
                    const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || [];
                    const text = (yield fs.readFile(file)).toString();
                    const lines = new LinesAndColumns(text);
                    const { line, column } = lines.locationForIndex(text.indexOf(importer));
                    logger.end('Bundling', e.error.message);
                    console.log(`ERROR in ${file}:${line + 1}:${column + 1}`);
                }
                else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs', 'typescript'].includes(e.error.plugin)) {
                    const [, file, line, column] = e.error.message
                        .replace(REG_CLEAR_TEXT, '')
                        .match(REG_RPT_ERROR_FILE) || [];
                    logger.end('Bundling', e.error.message);
                    if (file) {
                        console.log(`ERROR in ${file}:${line}:${column}`);
                    }
                    else if (e.error.loc) {
                        console.log(`ERROR in ${e.error.loc.file}:${e.error.loc.line}:${e.error.loc.column}`);
                        console.log(e.error.frame);
                    }
                }
                else {
                    logger.end('Bundling', error ? e.error.stack : e.error.message);
                }
            }
            else if (e.code === 'BUNDLE_START') {
                logger.start('Bundling');
            }
            else if (e.code === 'BUNDLE_END') {
                logger.end('Bundling');
            }
        }));
    });
}

export { start };
