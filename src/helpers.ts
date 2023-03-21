import logger from '@cantinc/logger'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { FileSizeRender } from 'rollup-plugin-filesize'

export function getFile (file) {
  file = path.resolve(file)

  if (!fs.existsSync(file)) {
    throw Error('Cannot find the file: ' + file)
  }

  if (fs.lstatSync(file).isDirectory()) {
    let tmpFile = file
    if (
      !fs.existsSync(tmpFile = path.join(file, 'index.ts')) &&
      !fs.existsSync(tmpFile = path.join(file, 'index.tsx')) &&
      !fs.existsSync(tmpFile = path.join(file, 'index.js'))
    ) {
      throw Error('Cannot find index file in: ' + file)
    }

    file = tmpFile
  } else if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) {
    throw Error('File should has `.ts` or `.tsx` or `.js` extension: ' + file)
  }

  if (!fs.existsSync(file)) {
    throw Error('Cannot find the file: ' + file)
  }

  return file
}

export async function convertIndexFile (data: Buffer, version: string, baseUrl: string, index: string, inject: boolean) {
  const { env } = process

  const indexString = data
    .toString()
    .replace(
      /%([A-Z0-9_]+)%/g,
      (placeholder, placeholderId) => env[placeholderId] ?? placeholder,
    )

  return inject
    ? indexString
      .replace(
        '</head>',
      `<script type="module" defer src="${baseUrl}${index}.js${version ? `?v=${version}` : ''}"></script></head>`,
      )
    : indexString
}

export const reporter: FileSizeRender<string | Promise<string>> = (options, outputOptions, info) => {
  logger.log(`${chalk.yellow(info.fileName)} ${chalk.green(info.bundleSize)} [ gzip: ${chalk.green(info.gzipSize)} ]`)
  return ''
}
