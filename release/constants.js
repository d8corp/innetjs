'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const SCRIPT_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx'];
const REG_CLEAR_TEXT = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const REG_RPT_ERROR_FILE = /(src[^:]+):(\d+):(\d+)/;
const REG_TJSX = /\.[tj]sx?$/;
const REG_EXT = /\.([^.]+)$/;
const NPM_TAG = /-(.+?)(?:\.|$)/;
const lintInclude = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.mjs',
];
const imageInclude = [
    '**/*.gif',
    '**/*.png',
    '**/*.jpeg',
    '**/*.jpg',
    '**/*.svg',
    '**/*.webp',
];
const stringExcludeDom = [
    ...lintInclude,
    '**/*.json',
    '**/*.css',
    '**/*.scss',
    '**/*.webp',
    ...imageInclude,
];
const stringExcludeNode = [
    ...lintInclude,
    '**/*.json',
];

exports.NPM_TAG = NPM_TAG;
exports.REG_CLEAR_TEXT = REG_CLEAR_TEXT;
exports.REG_EXT = REG_EXT;
exports.REG_RPT_ERROR_FILE = REG_RPT_ERROR_FILE;
exports.REG_TJSX = REG_TJSX;
exports.SCRIPT_EXTENSIONS = SCRIPT_EXTENSIONS;
exports.imageInclude = imageInclude;
exports.lintInclude = lintInclude;
exports.stringExcludeDom = stringExcludeDom;
exports.stringExcludeNode = stringExcludeNode;
