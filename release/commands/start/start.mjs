import { __awaiter } from 'tslib';
import { logger } from '@cantinc/logger';
import autoprefixer from 'autoprefixer';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'node:path';
import { watch } from 'rolldown';
import importAssets from 'rollup-plugin-import-assets';
import livereload from 'rollup-plugin-livereload';
import polyfill from 'rollup-plugin-polyfill-node';
import { string } from 'rollup-plugin-string';
import styles from 'rollup-plugin-styles';
import { stringExcludeNode, imageInclude, stringExcludeDom } from '../../constants.mjs';

function typecheckWatchPlugin() {
    let tscProcess = null;
    return {
        name: 'type-check',
        buildStart() {
            if (tscProcess) {
                logger.end('Check TypeScript');
                tscProcess.kill();
            }
            logger.start('Check TypeScript');
            tscProcess = spawn('tsc', ['--noEmit'], {
                stdio: 'inherit',
                shell: true,
            });
            tscProcess.on('close', (code) => {
                logger.end('Check TypeScript', code ? 'TypeScript has errors' : undefined);
            });
        },
    };
}
function lintCheckWatchPlugin() {
    let lintProcess = null;
    return {
        name: 'lint-check',
        buildStart() {
            if (lintProcess) {
                logger.end('Check ESLint');
                lintProcess.kill();
            }
            logger.start('Check ESLint');
            lintProcess = spawn('eslint', ['src'], {
                stdio: 'inherit',
                shell: true,
            });
            lintProcess.on('close', (code) => {
                logger.end('Check ESLint', code ? 'ESLint has errors' : undefined);
            });
        },
    };
}
function start(_a, instance_1) {
    return __awaiter(this, arguments, void 0, function* ({ node = false, inject = false, error = false, typeCheck = false, lintCheck = false, usualConsoleOutput = false, index = 'index', }, instance) {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob.sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.start('Remove build', () => fs.remove(params.devBuildFolder));
        const plugins = [];
        const output = {
            dir: params.devBuildFolder,
            sourcemap: true,
        };
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output,
            plugins,
        };
        let preset;
        if (node) {
            preset = { NODE_ENV: 'dev' };
            output.format = 'cjs';
            options.external = Object.keys((pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) || {});
            plugins.push(string({
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
            output.format = 'es';
            plugins.push(polyfill(), importAssets({
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
        if (typeCheck) {
            plugins.push(typecheckWatchPlugin());
        }
        if (lintCheck) {
            plugins.push(lintCheckWatchPlugin());
        }
        instance.withEnv(options, true, preset);
        const watcher = watch(options);
        watcher.on('event', (e) => __awaiter(this, void 0, void 0, function* () {
            if (e.code === 'ERROR') {
                logger.end('Bundling', error ? e.error.stack : e.error.message);
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

export { lintCheckWatchPlugin, start, typecheckWatchPlugin };
