import './_virtual/_rollup-plugin-inject-process-env.mjs';
import { __awaiter } from 'tslib';
import logger from '@cantinc/logger';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';

function getFile(file) {
    file = path.resolve(file);
    if (!fs.existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    if (fs.lstatSync(file).isDirectory()) {
        let tmpFile = file;
        if (!fs.existsSync(tmpFile = path.join(file, 'index.ts')) &&
            !fs.existsSync(tmpFile = path.join(file, 'index.tsx')) &&
            !fs.existsSync(tmpFile = path.join(file, 'index.js'))) {
            throw Error('Cannot find index file in: ' + file);
        }
        file = tmpFile;
    }
    else if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) {
        throw Error('File should has `.ts` or `.tsx` or `.js` extension: ' + file);
    }
    if (!fs.existsSync(file)) {
        throw Error('Cannot find the file: ' + file);
    }
    return file;
}
function convertIndexFile(data, version, baseUrl, index) {
    return __awaiter(this, void 0, void 0, function* () {
        return data
            .toString()
            .replace('</head>', `<script type="module" defer src="${baseUrl}${index}.js${version ? `?v=${version}` : ''}"></script></head>`);
    });
}
const reporter = (options, outputOptions, info) => {
    logger.log(`${chalk.yellow(info.fileName)} ${chalk.green(info.bundleSize)} [ gzip: ${chalk.green(info.gzipSize)} ]`);
    return '';
};

export { convertIndexFile, getFile, reporter };
