export const SCRIPT_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx']
export const REG_CLEAR_TEXT = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
export const REG_RPT_ERROR_FILE = /(src[^:]+):(\d+):(\d+)/
export const REG_TJSX = /\.[tj]sx?$/
export const REG_EXT = /\.([^.]+)$/
export const NPM_TAG = /-(.+?)(?:\.|$)/

export const lintInclude = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.mjs',
]

export const imageInclude = [
  '**/*.gif',
  '**/*.png',
  '**/*.jpeg',
  '**/*.jpg',
  '**/*.svg',
  '**/*.webp',
]

export const stringExcludeDom = [
  ...lintInclude,
  '**/*.json',
  '**/*.css',
  '**/*.scss',
  '**/*.webp',
  ...imageInclude,
]

export const stringExcludeNode = [
  ...lintInclude,
  '**/*.json',
]
