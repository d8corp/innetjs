'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./_virtual/_rollup-plugin-inject-process-env.js');

const lintInclude = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
];
const stringExcludeDom = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
    '**/*.css',
    '**/*.scss',
    '**/*.webp',
    '**/*.gif',
    '**/*.png',
    '**/*.jpeg',
    '**/*.jpg',
    '**/*.svg',
];
const stringExcludeNode = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
];

exports.lintInclude = lintInclude;
exports.stringExcludeDom = stringExcludeDom;
exports.stringExcludeNode = stringExcludeNode;