import { logger } from '@cantinc/logger'
import terser from '@rollup/plugin-terser'
import autoprefixer from 'autoprefixer'
import { spawn } from 'child_process'
import { promises as fsx } from 'fs'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import type { OutputOptions, RolldownOptions, RolldownPluginOption } from 'rolldown'
import { rolldown } from 'rolldown'
import filesize from 'rollup-plugin-filesize'
import importAssets from 'rollup-plugin-import-assets'
import polyfill from 'rollup-plugin-polyfill-node'
import env from 'rollup-plugin-process-env'
import { string } from 'rollup-plugin-string'
import styles from 'rollup-plugin-styles'
import { promisify } from 'util'

import { imageInclude, stringExcludeDom, stringExcludeNode } from '../../constants'
import { convertIndexFile, reporter } from '../../helpers'
import type { InnetJS } from '../../InnetJs'
import type { BuildOptions } from '../../types'

const copyFiles = promisify(fs.copy)

export async function build ({ node = false, inject = false, index = 'index', typeCheck, lintCheck }: BuildOptions, instance: InnetJS) {
  const params = instance.params
  const input = glob.sync(`src/${index}.{${params.indexExt}}`)

  if (!input.length) {
    throw Error('index file is not detected')
  }

  if (typeCheck) {
    await logger.start('Check TypeScript', async () => {
      const { resolve, reject, promise } = Promise.withResolvers()

      const process = spawn('tsc', ['--noEmit'], {
        stdio: 'inherit',
        shell: true,
      })

      process.on('close', (code: number) => {
        if (code) {
          reject()
        } else {
          resolve(undefined)
        }
      })

      await promise
    })
  }

  if (lintCheck) {
    await logger.start('Check ESLint', async () => {
      const { resolve, reject, promise } = Promise.withResolvers()

      const process = spawn('eslint', ['src'], {
        stdio: 'inherit',
        shell: true,
      })

      process.on('close', (code: number) => {
        if (code) {
          reject()
        } else {
          resolve(undefined)
        }
      })

      await promise
    })
  }

  await logger.start('Remove build', () => fs.remove(params.buildFolder))

  const pkg = node && await instance.getPackage()

  const plugins: RolldownPluginOption[] = [
    env(instance.params.envPrefix, {
      include: input,
      virtual: true,
    }),
  ]

  const options: RolldownOptions = {
    input,
    preserveEntrySignatures: 'strict',
    transform: {
      jsx: 'react-jsx',
    },
    plugins,
  }

  const outputOptions: OutputOptions = {
    dir: params.buildFolder,
    sourcemap: params.sourcemap,
  }

  if (node) {
    outputOptions.format = 'cjs'
    options.external = Object.keys(pkg?.dependencies || {})

    plugins.push(
      string({
        include: '**/*.*',
        exclude: stringExcludeNode,
      }),
    )
  } else {
    plugins.push(
      polyfill(),
      importAssets({
        include: imageInclude.map(img => `src/${img}`),
        publicPath: params.baseUrl,
      }),
      styles({
        mode: params.cssInJs ? 'inject' : 'extract',
        url: {
          inline: false,
          publicPath: `${params.baseUrl}assets`,
        },
        sass: {
          outputStyle: 'compressed',
          silenceDeprecations: ['legacy-js-api'],
        },
        plugins: [autoprefixer()],
        autoModules: params.cssModules ? (id: string) => !id.includes('.global.') : true,
        sourceMap: params.sourcemap,
        minimize: true,
      }),
      string({
        include: '**/*.*',
        exclude: stringExcludeDom,
      }),
    )

    outputOptions.format = 'es'

    outputOptions.plugins = [
      terser(),
      filesize({
        reporter,
      }),
    ]
  }

  await logger.start('Build production bundle', async () => {
    const bundle = await rolldown(options)
    await bundle.write(outputOptions)
    await bundle.close()

    if (!node) {
      await copyFiles(params.publicFolder, params.buildFolder)
      const data = await fsx.readFile(params.publicIndexFile)
      const pkg = await instance.getPackage()

      await fsx.writeFile(
        params.buildIndexFile,
        await convertIndexFile(data, pkg.version, params.baseUrl, path.parse(input[0]).name, inject),
      )
    }
  })

  if (pkg) {
    await logger.start('Copy package.json', async () => {
      const data = { ...pkg }
      delete data.private
      delete data.devDependencies

      await fs.writeFile(
        path.resolve(params.buildFolder, 'package.json'),
        JSON.stringify(data, undefined, 2),
        'UTF-8',
      )
    })

    const pkgLockPath = path.resolve(params.projectFolder, 'package-lock.json')

    if (fs.existsSync(pkgLockPath)) {
      await logger.start('Copy package-lock.json', () => {
        return fs.copy(pkgLockPath, path.resolve(params.buildFolder, 'package-lock.json'))
      })
    }
  }
}
