import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from '@rollup/plugin-typescript';
import rollup from 'rollup';
import tmp from 'tmp';
import { getFile } from '../../helpers.mjs';

const { spawn } = require('child_process');
function run(file, { config = '', exposeGc = false } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = yield logger.start('Check file', () => getFile(file));
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
                plugins: [
                    commonjs(),
                    nodeResolve(),
                    json(),
                    ts({
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
            const bundle = yield rollup.rollup(inputOptions);
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
