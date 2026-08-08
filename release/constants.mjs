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

export { NPM_TAG, REG_CLEAR_TEXT, REG_EXT, REG_RPT_ERROR_FILE, REG_TJSX, SCRIPT_EXTENSIONS, imageInclude, lintInclude, stringExcludeDom, stringExcludeNode };
