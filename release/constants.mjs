const lintInclude = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
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

export { imageInclude, lintInclude, stringExcludeDom, stringExcludeNode };
