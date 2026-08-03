import logger from '@cantinc/logger'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import autoprefixer from 'autoprefixer'
import { promises as fsx } from 'fs'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import rollup from 'rollup'
import filesize from 'rollup-plugin-filesize'
import importAssets from 'rollup-plugin-import-assets'
import jsx from 'rollup-plugin-innet-jsx'
import polyfill from 'rollup-plugin-polyfill-node'
import { string } from 'rollup-plugin-string'
import styles from 'rollup-plugin-styles'
import { terser } from 'rollup-plugin-terser'
import { promisify } from 'util'

import { imageInclude, stringExcludeDom, stringExcludeNode } from '../../constants'
import { convertIndexFile, reporter } from '../../helpers'
import { InnetJS } from '../../InnetJs'
import { BuildOptions } from '../../types'

const copyFiles = promisify(fs.copy)

export async function build ({ node = false, inject = false, index = 'index' }: BuildOptions = {}, instance: InnetJS) {
  const params = instance.params
  const input = glob.sync(`src/${index}.{${params.indexExt}}`)

  if (!input.length) {
    throw Error('index file is not detected')
  }

  await logger.start('Remove build', () => fs.remove(params.buildFolder))

  const pkg = node && await instance.getPackage()
  const options: rollup.RollupOptions = {
    input,
    preserveEntrySignatures: 'strict',
    plugins: [
      commonjs(),
      json(),
      ts({
        noEmitOnError: true,
        compilerOptions: {
          declaration: false,
        },
      }),
      jsx(),
    ],
    onwarn (warning, warn) {
      if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR') return
      warn(warning)
    },
  }

  instance.withLint(options, true)

  const outputOptions = {
    dir: params.buildFolder,
    sourcemap: params.sourcemap,
  } as Record<string, any>

  if (node) {
    outputOptions.format = 'cjs'
    options.external = Object.keys(pkg?.dependencies || {})
    options.plugins.push(
      nodeResolve(),
      string({
        include: '**/*.*',
        exclude: stringExcludeNode,
      }),
    )
  } else {
    options.plugins.push(
      nodeResolve({
        browser: true,
      }),
      polyfill(),
      importAssets({
        include: imageInclude.map(img => `src/${img}`),
        publicPath: params.baseUrl,
      }),
      styles({
        sass: {
          outputStyle: 'compressed',
        },
        mode: params.cssInJs ? 'inject' : 'extract',
        url: {
          inline: false,
          publicPath: `${params.baseUrl}assets`,
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

  instance.withEnv(options, true)

  await logger.start('Build production bundle', async () => {
    const bundle = await rollup.rollup(options)
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
