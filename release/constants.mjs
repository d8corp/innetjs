const SCRIPT_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx'];
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

export { NPM_TAG, REG_EXT, REG_TJSX, SCRIPT_EXTENSIONS, imageInclude, lintInclude, stringExcludeDom, stringExcludeNode };
