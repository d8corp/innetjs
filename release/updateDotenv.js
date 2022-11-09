'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./_virtual/_rollup-plugin-inject-process-env.js');

function updateDotenv() {
    const { INNETJS_INNETJS_PACKAGE_VERSION } = process.env;
    delete process.env.INNETJS_INNETJS_PACKAGE_VERSION;
    require('dotenv-expand').expand(require('dotenv').config());
    if (!('INNETJS_INNETJS_PACKAGE_VERSION' in process.env)) {
        process.env.INNETJS_INNETJS_PACKAGE_VERSION = INNETJS_INNETJS_PACKAGE_VERSION;
    }
}

exports.updateDotenv = updateDotenv;
