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
        name: 'typecheck-watch',
        buildEnd() {
            if (tscProcess) {
                logger.end('Check TypeScript');
                tscProcess.kill();
            }
            logger.start('Check TypeScript');
            tscProcess = spawn('tsc', ['--noEmit'], {
                stdio: 'inherit',
                shell: true,
            });
            tscProcess.on('close', () => {
                logger.end('Check TypeScript');
            });
        },
    };
}
function start({ node = false, inject = false, error = false, usualConsoleOutput = false, index = 'index', }, instance) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = instance.params;
        const pkg = yield instance.getPackage();
        const input = glob.sync(`src/${index}.{${params.indexExt}}`);
        if (!input.length) {
            throw Error('index file is not detected');
        }
        yield logger.start('Remove build', () => fs.remove(params.devBuildFolder));
        const plugins = [];
        const options = {
            input,
            preserveEntrySignatures: 'strict',
            output: {
                dir: params.devBuildFolder,
                sourcemap: true,
            },
            plugins,
        };
        let preset;
        instance.withLint(options);
        if (node) {
            preset = { NODE_ENV: 'dev' };
            // @ts-expect-error
            options.output.format = 'cjs';
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
            // @ts-expect-error
            options.output.format = 'es';
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
            }), instance.createClient(key, cert, pkg, path.parse(input[0]).name, inject), typecheckWatchPlugin(), livereload(Object.assign({ exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'], watch: [params.devBuildFolder, params.publicFolder], verbose: false }, (key && cert ? { https: { key, cert } } : {}))));
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

export { start, typecheckWatchPlugin };
