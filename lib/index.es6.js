import path from 'path';
import fs from 'fs-extra';
import { Listr } from 'listr2';

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
function init(appName) {
    const appPath = path.resolve(appName);
    const libPath = __dirname;
    return new Listr([
        {
            title: 'Check if app folder is available',
            task() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (fs.existsSync(appPath)) {
                        throw Error(`'${appPath}' already exist`);
                    }
                });
            }
        },
        {
            title: 'Copy files',
            task() {
                return __awaiter(this, void 0, void 0, function* () {
                    return fs.copy(`${libPath}/template`, appPath);
                });
            }
        },
        {
            title: 'Install packages',
            task() {
                return __awaiter(this, void 0, void 0, function* () {
                    return exec(`cd ${appPath} && npm i`);
                });
            }
        },
    ], {}).run();
}
function start() {
}
function build() {
}

export { build, init, start };
