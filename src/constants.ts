export const lintInclude = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
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
