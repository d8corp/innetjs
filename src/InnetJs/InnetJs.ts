import logger from '@cantinc/logger'
import commonjs from '@rollup/plugin-commonjs'
import eslint from '@rollup/plugin-eslint'
import image from '@rollup/plugin-image'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import address from 'address'
import autoprefixer from 'autoprefixer'
import chalk from 'chalk'
import express from 'express'
import proxy from 'express-http-proxy'
import fs, { promises as fsx } from 'fs-extra'
import glob from 'glob'
import http from 'http'
import https from 'https'
import { LinesAndColumns } from 'lines-and-columns'
import path from 'path'
import prompt from 'prompts'
import rollup, { OutputOptions } from 'rollup'
import external from 'rollup-plugin-external-node-modules'
import jsx from 'rollup-plugin-innet-jsx'
import externals from 'rollup-plugin-node-externals'
import polyfill from 'rollup-plugin-polyfill-node'
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs'
import env, { EnvValues } from 'rollup-plugin-process-env'
import styles from 'rollup-plugin-styles'
import { terser } from 'rollup-plugin-terser'
import tmp from 'tmp'
import { promisify } from 'util'

import { build, init } from '../commands'
import {
  imageInclude,
  lintInclude,
  REG_CLEAR_TEXT,
  REG_EXT,
  REG_RPT_ERROR_FILE,
  REG_TJSX,
  stringExcludeDom,
  stringExcludeNode,
} from '../constants'
import { convertIndexFile, getFile } from '../helpers'
import { BuildOptions, InitOptions, InnetJSParams, ReleaseOptions, StartOptions } from '../types'
import { getDefaultOptions, getNpmTag, printErrorWithFrame, updateDotenv } from '../utils'

const livereload = require('rollup-plugin-livereload')
const { string } = require('rollup-plugin-string')
const { exec, spawn } = require('child_process')
const importAssets = require('rollup-plugin-import-assets')
const execAsync = promisify(exec)

updateDotenv()

export class InnetJS {
  params: Required<InnetJSParams>
  private package: object

  constructor (options: InnetJSParams = {}) {
    this.params = getDefaultOptions(options)
  }

  // Methods
  async init (appName: string, options?: InitOptions) {
    await init(appName, options)
  }

  async build (options: BuildOptions = {}) {
    await build(options, this)
  }

  async start ({
    node = false,
    inject = false,
    error = false,
    usualConsoleOutput = false,
    index = 'index',
  }: StartOptions = {}) {
    const pkg = await this.getPackage()
    const input = glob.sync(`src/${index}.{${this.params.indexExt}}`)

    if (!input.length) {
      throw Error('index file is not detected')
    }

    await logger.start('Remove build', () => fs.remove(this.params.devBuildFolder))

    const options: rollup.RollupOptions = {
      input,
      preserveEntrySignatures: 'strict',
      output: {
        dir: this.params.devBuildFolder,
        sourcemap: true,
      },
      plugins: [
        commonjs(),
        json(),
        ts({
          compilerOptions: {
            declaration: false,
            sourceMap: true,
          },
        }),
        jsx(),
      ],
      onwarn (warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR') return

        if (warning.plugin === 'typescript') {
          const { loc, frame, message } = warning

          if (loc) {
            const { line, column, file } = loc
            console.log(`ERROR in ${file}:${line}:${column}`)
          }

          console.log(message)
          console.log(frame)
          return
        }

        warn(warning)
      },
    }
    let preset: EnvValues

    this.withLint(options)

    if (node) {
      preset = { NODE_ENV: 'dev' }
      // @ts-expect-error
      options.output.format = 'cjs'
      options.external = Object.keys(pkg?.dependencies || {})
      options.plugins.push(
        nodeResolve(),
        string({
          include: '**/*.*',
          exclude: stringExcludeNode,
        }),
        this.createServer(input, error, usualConsoleOutput),
      )
    } else {
      const key = path.basename(this.params.sslKey) !== this.params.sslKey
        ? this.params.sslKey
        : fs.existsSync(this.params.sslKey)
          ? fs.readFileSync(this.params.sslKey)
          : undefined

      const cert = path.basename(this.params.sslCrt) !== this.params.sslCrt
        ? this.params.sslCrt
        : fs.existsSync(this.params.sslCrt)
          ? fs.readFileSync(this.params.sslCrt)
          : undefined

      // @ts-expect-error
      options.output.format = 'es'
      options.plugins.push(
        nodeResolve({
          browser: true,
        }),
        polyfill(),
        importAssets({
          include: imageInclude.map(img => `src/${img}`),
          publicPath: this.params.baseUrl,
        }),
        styles({
          mode: this.params.cssInJs ? 'inject' : 'extract',
          url: {
            inline: false,
            publicPath: `${this.params.baseUrl}assets`,
          },
          sass: {
            silenceDeprecations: ['legacy-js-api'],
          },
          plugins: [autoprefixer()],
          autoModules: this.params.cssModules ? (id: string) => !id.includes('.global.') : true,
          sourceMap: true,
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeDom,
        }),
        this.createClient(key, cert, pkg, path.parse(input[0]).name, inject),
        livereload({
          exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'],
          watch: [this.params.devBuildFolder, this.params.publicFolder],
          verbose: false,
          ...(key && cert ? { https: { key, cert } } : {}),
        }),
      )
    }

    this.withEnv(options, true, preset)
    const watcher = rollup.watch(options)

    watcher.on('event', async e => {
      if (e.code === 'ERROR') {
        if (e.error.code === 'UNRESOLVED_IMPORT') {
          const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || []
          const text = (await fs.readFile(file)).toString()
          const lines = new LinesAndColumns(text)
          const { line, column } = lines.locationForIndex(text.indexOf(importer))
          logger.end('Bundling', e.error.message)
          console.log(`ERROR in ${file}:${line + 1}:${column + 1}`)
        } else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs', 'typescript'].includes(e.error.plugin)) {
          const [, file, line, column] = e.error.message
            .replace(REG_CLEAR_TEXT, '')
            .match(REG_RPT_ERROR_FILE) || []
          logger.end('Bundling', e.error.message)

          if (file) {
            console.log(`ERROR in ${file}:${line}:${column}`)
          } else if (e.error.loc) {
            console.log(`ERROR in ${e.error.loc.file}:${e.error.loc.line}:${e.error.loc.column}`)
            console.log(e.error.frame)
          }
        } else {
          logger.end('Bundling', error ? e.error.stack : e.error.message)
        }
      } else if (e.code === 'BUNDLE_START') {
        logger.start('Bundling')
      } else if (e.code === 'BUNDLE_END') {
        logger.end('Bundling')
      }
    })
  }

  async run (file: string, { config = '', exposeGc = false } = {}) {
    const input = await logger.start('Check file', () => getFile(file))

    const folder = await new Promise<string>((resolve, reject) => {
      tmp.dir((err, folder) => {
        if (err) {
          reject(err)
        } else {
          resolve(folder)
        }
      })
    })

    const jsFilePath = `${folder}/index.js`

    await logger.start('Build bundle', async () => {
      const inputOptions = {
        input,
        plugins: [
          commonjs(),
          nodeResolve(),
          json(),
          ts({
            tsconfig: config || false,
            compilerOptions: {
              sourceMap: true,
              declaration: false,
            },
          }),
        ],
      }

      const outputOptions = {
        format: 'cjs' as 'commonjs',
        file: jsFilePath,
        sourcemap: true,
      }

      const bundle = await rollup.rollup(inputOptions)
      await bundle.write(outputOptions)
      await bundle.close()
    })

    await logger.start('Running of the script', async () => {
      const flags = []

      if (exposeGc) {
        flags.push('--expose-gc')
      }

      spawn('node', [...flags, '-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' })
    })
  }

  async release ({ index = 'index', pub, min }: ReleaseOptions = {}) {
    const { releaseFolder, cssModules } = this.params
    await logger.start('Remove previous release', () => fs.remove(releaseFolder))

    const pkg = await this.getPackage()

    const build = async (format: rollup.ModuleFormat) => {
      const ext: string = format === 'es'
        ? (pkg.module || pkg.esnext || pkg['jsnext:main'])?.replace('index', '') || '.mjs'
        : pkg.main?.replace('index', '') || '.js'

      const input = glob.sync(`src/${index}.{${this.params.indexExt}}`)

      if (!input.length) {
        throw Error('index file is not detected')
      }

      const output: OutputOptions = format === 'iife'
        ? {
            file: path.join(releaseFolder, pkg.browser || 'index.min.js'),
            inlineDynamicImports: true,
            name: pkg.browserName || pkg.name
              .split('-')
              .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(''),
          }
        : {
            dir: releaseFolder,
            preserveModules: true,
            exports: 'named',
            entryFileNames: ({ name, facadeModuleId }) => {
              if (REG_TJSX.test(facadeModuleId)) {
                return `${name}${ext}`
              }

              const match = facadeModuleId.match(REG_EXT)

              return match ? `${name}${match[0]}${ext}` : `${name}${ext}`
            },
          }

      const options: rollup.RollupOptions = {
        input,
        external: ['tslib'],
        treeshake: false,
        output: {
          ...output,
          format,
        },
        plugins: [
          json(),
          ts({
            tsconfig: this.params.tsconfig,
            compilerOptions: {
              sourceMap: false,
              outDir: releaseFolder,
            },
          }),
          jsx(),
          externals(),
          string({
            include: '**/*.*',
            exclude: stringExcludeDom,
          }),
          image(),
          styles({
            mode: this.params.cssInJs ? 'inject' : 'extract',
            plugins: [autoprefixer()],
            autoModules: cssModules ? (id: string) => !id.includes('.global.') : true,
            minimize: true,
          }),
          nodeResolve(),
          external(),
        ],
      }

      if (format === 'iife') {
        options.plugins.push(terser())
      }

      this.withLint(options)
      this.withEnv(options, true)

      const bundle = await rollup.rollup(options)
      await bundle.write(options.output as rollup.OutputOptions)
      await bundle.close()
    }

    if (!pkg.type || pkg.type === 'commonjs') {
      await logger.start('Build cjs bundle', async () => {
        await build('cjs')
      })
    }

    if (!pkg.type || pkg.type === 'module') {
      await logger.start('Build es6 bundle', async () => {
        await build('es')
      })
    }

    if (min) {
      await logger.start('Build min bundle', async () => {
        await build('iife')
      })
    }

    await logger.start('Copy package.json', async () => {
      const data = { ...pkg }

      delete data.private
      delete data.devDependencies

      fs.writeFile(
        path.resolve(this.params.releaseFolder, 'package.json'),
        JSON.stringify(data, undefined, 2),
        'UTF-8',
      )
    })

    if (pkg.bin) {
      await logger.start('Build bin', async () => {
        const { bin, type } = pkg

        for (const name in bin) {
          const value = bin[name]
          const input = glob.sync(`src/${value}.{${this.params.indexExt}}`)
          const file = path.join(this.params.releaseFolder, value)

          const options: rollup.RollupOptions = {
            input,
            external: [...Object.keys(pkg.dependencies), 'tslib'],
            output: {
              file,
              format: type === 'module' ? 'es' : 'cjs',
            },
            plugins: [
              preserveShebangs(),
              json(),
              ts({
                compilerOptions: {
                  declaration: false,
                },
              }),
              externals(),
              jsx(),
            ],
          }

          this.withLint(options)
          this.withEnv(options)

          const bundle = await rollup.rollup(options)
          await bundle.write(options.output as rollup.OutputOptions)
          await bundle.close()
        }
      })
    }

    if (fs.existsSync(this.params.licenseFile)) {
      await logger.start('Copy license', async () => {
        await fsx.copyFile(this.params.licenseFile, this.params.licenseReleaseFile)
      })
    }

    if (fs.existsSync(this.params.readmeFile)) {
      await logger.start('Copy readme', async () => {
        await fsx.copyFile(this.params.readmeFile, this.params.readmeReleaseFile)
      })
    }

    if (fs.existsSync(this.params.declarationFile)) {
      await logger.start('Copy declaration', async () => {
        await fsx.copyFile(this.params.declarationFile, this.params.declarationReleaseFile)
      })
    }

    if (pub) {
      const date = (Date.now() / 1000) | 0

      await logger.start(`publishing v${pkg.version} ${date}`, async () => {
        await execAsync(`npm publish ${this.params.releaseFolder} --tag ${getNpmTag(pkg.version)}`)
      })
    }
  }

  // Helpers

  private _lintUsage: boolean
  withLint (options: rollup.RollupOptions, prod = false) {
    if (this._lintUsage === undefined) {
      this._lintUsage = fs.existsSync(path.join(this.params.projectFolder, '.eslintrc'))
    }

    if (this._lintUsage) {
      options.plugins.push(eslint({
        include: lintInclude,
        throwOnError: prod,
      }))
    }
  }

  withEnv (options: rollup.RollupOptions, virtual?: boolean, preset?: EnvValues) {
    options.plugins.push(env(this.params.envPrefix, {
      include: options.input as string[],
      virtual,
      preset,
    }))
  }

  async increaseVersion (release: string) {
    const pkg = await this.getPackage()

    await logger.start('Prepare package.json', async () => {
      const version = pkg.version.split('.')

      switch (release) {
        case 'patch': {
          version[2]++
          break
        }
        case 'minor': {
          version[1]++
          version[2] = 0
          break
        }
        case 'major': {
          version[1] = 0
          version[2] = 0
          version[0]++
          break
        }
        default: return
      }

      pkg.version = version.join('.')

      await fs.writeFile(
        path.resolve(this.params.projectFolder, 'package.json'),
        JSON.stringify(pkg, undefined, 2),
        'UTF-8',
      )
    })
  }

  async getPackage (): Promise<Record<string, any>> {
    if (this.package) {
      return this.package
    }

    const packageFolder = path.resolve(this.params.projectFolder, 'package.json')

    await logger.start('Check package.json', async () => {
      if (fs.existsSync(packageFolder)) {
        this.package = await fs.readJson(packageFolder)
      }
    })

    return this.package
  }

  createClient (key, cert, pkg, index: string, inject: boolean): rollup.Plugin {
    let app

    return {
      name: 'client',
      writeBundle: async () => {
        if (!app) {
          app = express()
          const update = async () => {
            const data = await fsx.readFile(this.params.publicIndexFile)
            await fsx.writeFile(
              this.params.devBuildIndexFile,
              await convertIndexFile(data, pkg.version, this.params.baseUrl, index, inject),
            )
          }

          fs.watch(this.params.publicIndexFile, update)
          await update()

          const httpsUsing = !!(cert && key)

          app.use(this.params.baseUrl, express.static(this.params.devBuildFolder))
          app.use(this.params.baseUrl, express.static(this.params.publicFolder))

          if (this.params.proxy?.startsWith('http')) {
            if (this.params.simulateIP) {
              app.use((req, res, next) => {
                req.headers['X-Real-IP'] = this.params.simulateIP
                next()
              })
            }

            app.use(this.params.api, proxy(this.params.proxy, {
              https: httpsUsing,
              limit: '1000mb',
              proxyReqPathResolver: req => req.originalUrl,
            }))
          }

          app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
            res.sendFile(this.params.devBuildFolder + '/index.html')
          })

          const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app)
          let port = this.params.port
          const listener = () => {
            const baseUrl = this.params.baseUrl === '/' ? '' : this.params.baseUrl
            console.log(`${chalk.green('➤')} Started on http${httpsUsing ? 's' : ''}://localhost:${port}${baseUrl} and http${httpsUsing ? 's' : ''}://${address.ip()}:${port}${baseUrl}`)
          }

          server.listen(port, listener)
          server.on('error', async (e: any) => {
            if (e.code === 'EADDRINUSE') {
              port++
              const { userPort } = await prompt({
                name: 'userPort',
                type: 'number',
                message: `Port ${e.port} is reserved, please enter another one [${port}]:`,
              })

              if (userPort) {
                port = userPort
              }

              server.listen(port)
            } else {
              throw e
            }
          })
        }
      },
    }
  }

  createServer (input: string[], error = false, usualConsoleOutput = false): rollup.Plugin {
    const apps: Record<string, any> = {}

    return {
      name: 'server',
      writeBundle: async () => {
        for (const file of input) {
          let stderrBuffer = ''
          const { name } = path.parse(file)
          apps[name]?.kill()
          const filePath = path.resolve(this.params.devBuildFolder, `${name}.js`)

          if (usualConsoleOutput) {
            apps[name] = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' })
            return
          }

          const child = spawn('node', ['-r', 'source-map-support/register', filePath], {
            stdio: ['inherit', 'inherit'],
          })

          apps[name] = child

          child.stderr.on('data', (chunk) => {
            stderrBuffer += chunk.toString()
          })

          child.on('close', (code) => {
            if (code !== 0 && stderrBuffer) {
              console.error(printErrorWithFrame(stderrBuffer, 0, !error))
              stderrBuffer = ''
            }
          })
        }
      },
    }
  }
}
