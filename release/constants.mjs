import './_virtual/_rollup-plugin-inject-process-env.mjs';

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

export { lintInclude, stringExcludeDom, stringExcludeNode };
