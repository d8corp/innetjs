import { logger } from '@cantinc/logger'
import autoprefixer from 'autoprefixer'
import { spawn } from 'child_process'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import { RolldownPluginOption, watch, WatchOptions } from 'rolldown'
import importAssets from 'rollup-plugin-import-assets'
import livereload from 'rollup-plugin-livereload'
import polyfill from 'rollup-plugin-polyfill-node'
import { EnvValues } from 'rollup-plugin-process-env'
import { string } from 'rollup-plugin-string'
import styles from 'rollup-plugin-styles'

import { imageInclude, stringExcludeDom, stringExcludeNode } from '../../constants'
import type { InnetJS } from '../../InnetJs'
import { StartOptions } from '../../types'

export function typecheckWatchPlugin () {
  let tscProcess = null

  return {
    name: 'typecheck-watch',

    buildEnd () {
      if (tscProcess) {
        logger.end('Check TypeScript')
        tscProcess.kill()
      }

      logger.start('Check TypeScript')
      tscProcess = spawn('tsc', ['--noEmit'], {
        stdio: 'inherit',
        shell: true,
      })

      tscProcess.on('close', () => {
        logger.end('Check TypeScript')
      })
    },
  }
}

export async function start ({
  node = false,
  inject = false,
  error = false,
  typeCheck = false,
  usualConsoleOutput = false,
  index = 'index',
}: StartOptions, instance: InnetJS) {
  const params = instance.params
  const pkg = await instance.getPackage()
  const input = glob.sync(`src/${index}.{${params.indexExt}}`)

  if (!input.length) {
    throw Error('index file is not detected')
  }

  await logger.start('Remove build', () => fs.remove(params.devBuildFolder))

  const plugins: RolldownPluginOption[] = []

  const options: WatchOptions = {
    input,
    preserveEntrySignatures: 'strict',
    output: {
      dir: params.devBuildFolder,
      sourcemap: true,
    },
    plugins,
  }

  let preset: EnvValues
  instance.withLint(options as any)

  if (node) {
    preset = { NODE_ENV: 'dev' }
    // @ts-expect-error
    options.output.format = 'cjs'
    options.external = Object.keys(pkg?.dependencies || {})
    plugins.push(
      string({
        include: '**/*.*',
        exclude: stringExcludeNode,
      }),
      instance.createServer(input, error, usualConsoleOutput),
    )
  } else {
    const key = path.basename(params.sslKey) !== params.sslKey
      ? params.sslKey
      : fs.existsSync(params.sslKey)
        ? fs.readFileSync(params.sslKey)
        : undefined

    const cert = path.basename(params.sslCrt) !== params.sslCrt
      ? params.sslCrt
      : fs.existsSync(params.sslCrt)
        ? fs.readFileSync(params.sslCrt)
        : undefined

    // @ts-expect-error
    options.output.format = 'es'
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
          silenceDeprecations: ['legacy-js-api'],
        },
        plugins: [autoprefixer()],
        autoModules: params.cssModules ? (id: string) => !id.includes('.global.') : true,
        sourceMap: true,
      }),
      string({
        include: '**/*.*',
        exclude: stringExcludeDom,
      }),
      instance.createClient(key, cert, pkg, path.parse(input[0]).name, inject),
      livereload({
        exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'],
        watch: [params.devBuildFolder, params.publicFolder],
        verbose: false,
        ...(key && cert ? { https: { key, cert } } : {}),
      }),
    )

    if (typeCheck) {
      plugins.push(typecheckWatchPlugin())
    }
  }

  instance.withEnv(options as any, true, preset)
  const watcher = watch(options)

  watcher.on('event', async e => {
    if (e.code === 'ERROR') {
      logger.end('Bundling', error ? e.error.stack : e.error.message)
    } else if (e.code === 'BUNDLE_START') {
      logger.start('Bundling')
    } else if (e.code === 'BUNDLE_END') {
      logger.end('Bundling')
    }
  })
}
