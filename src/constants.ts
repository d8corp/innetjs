export const SCRIPT_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx']
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
