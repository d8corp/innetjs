import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import Zip from 'adm-zip';
import axios from 'axios';
import chalk from 'chalk';
import { exec } from 'node:child_process';
import selector from 'cli-select';
import fs from 'fs-extra';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import stream from 'node:stream';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const pipeline = promisify(stream.pipeline);
function init(appName, { template, force = false } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const appPath = path.resolve(appName);
        const { data } = yield logger.start('Get templates list', () => __awaiter(this, void 0, void 0, function* () { return yield axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'); }));
        const templates = data.map(({ name }) => name).filter((name) => name !== 'main');
        if (!template || !templates.includes(template)) {
            logger.log(chalk.green('Select one of those templates'));
            const { value } = yield selector({
                values: templates,
            });
            template = value;
            readline.moveCursor(process.stdout, 0, -1);
            const text = `Selected template: ${chalk.white(value)}`;
            logger.start(text);
            logger.end(text);
        }
        if (!force) {
            yield logger.start('Check if app folder is available', () => __awaiter(this, void 0, void 0, function* () {
                if (fs.existsSync(appPath)) {
                    logger.log(chalk.red(`'${appPath}' already exist, what do you want?`));
                    const { id: result, value } = yield selector({
                        values: ['Stop the process', 'Remove the folder', 'Merge with template'],
                    });
                    readline.moveCursor(process.stdout, 0, -1);
                    logger.log(`Already exist, selected: ${value}`);
                    if (!result) {
                        throw Error(`'${appPath}' already exist`);
                    }
                    if (result === 1) {
                        yield fs.remove(appPath);
                    }
                }
            }));
        }
        yield logger.start('Download template', () => __awaiter(this, void 0, void 0, function* () {
            const tmpPath = tmpdir();
            const zipPath = path.join(tmpPath, 'template.zip');
            const unzipPath = path.join(tmpPath, `innetjs-templates-${template}`);
            const { data } = yield axios.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
                responseType: 'stream',
            });
            yield pipeline(data, fs.createWriteStream(zipPath));
            const zip = new Zip(zipPath);
            yield new Promise((resolve, reject) => {
                zip.extractAllToAsync(tmpPath, false, false, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(undefined);
                    }
                });
            });
            yield fs.remove(zipPath);
            yield fs.move(unzipPath, appPath, { overwrite: true });
        }));
        yield logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`));
    });
}

export { init };
