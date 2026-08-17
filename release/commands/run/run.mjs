import { __awaiter } from 'tslib';
import { logger } from '@cantinc/logger';
import { spawn } from 'node:child_process';
import { rolldown } from 'rolldown';
import tmp from 'tmp';
import { getFile } from '../../helpers.mjs';

function run(file_1) {
    return __awaiter(this, arguments, void 0, function* (file, { config = '', exposeGc = false, typeCheck } = {}) {
        const input = yield logger.start('Check file', () => getFile(file));
        if (!input.length) {
            throw Error('index file is not detected');
        }
        if (typeCheck) {
            yield logger.start('Check TypeScript', () => __awaiter(this, void 0, void 0, function* () {
                const { resolve, reject, promise } = Promise.withResolvers();
                const params = ['--noEmit'];
                if (config) {
                    params.push('-p', config);
                }
                const process = spawn('tsc', params, {
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
            tmp.dir((err, folder) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(folder);
                }
            });
        });
        const jsFilePath = `${folder}/index.js`;
        yield logger.start('Build bundle', () => __awaiter(this, void 0, void 0, function* () {
            const inputOptions = {
                input,
                plugins: [],
            };
            const outputOptions = {
                format: 'cjs',
                file: jsFilePath,
                sourcemap: true,
            };
            const bundle = yield rolldown(inputOptions);
            yield bundle.write(outputOptions);
            yield bundle.close();
        }));
        yield logger.start('Running of the script', () => __awaiter(this, void 0, void 0, function* () {
            const flags = [];
            if (exposeGc) {
                flags.push('--expose-gc');
            }
            spawn('node', [...flags, '-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' });
        }));
    });
}

export { run };
