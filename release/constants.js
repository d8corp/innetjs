'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

exports.imageInclude = imageInclude;
exports.lintInclude = lintInclude;
exports.stringExcludeDom = stringExcludeDom;
exports.stringExcludeNode = stringExcludeNode;
