import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);
function task(name, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = ora(name).start();
        try {
            yield callback(task);
            task.succeed();
        }
        catch (e) {
            task.fail();
            console.log(chalk.red('└ ' + ((e === null || e === void 0 ? void 0 : e.message) || e)));
            return Promise.reject(e);
        }
    });
}
function init(appName) {
    return __awaiter(this, void 0, void 0, function* () {
        const appPath = path.resolve(appName);
        const libPath = __dirname;
        yield task('Check if app folder is available', () => {
            if (fs.existsSync(appPath)) {
                throw Error(`'${appPath}' already exist`);
            }
        });
        yield task('Copy files', () => fs.copy(`${libPath}/template`, appPath));
        yield task('Install packages', () => exec(`cd ${appPath} && npm i`));
    });
}
function start() {
}
function build() {
}

export { build, init, start };
