import logger from '@cantinc/logger'
import commonjs from '@rollup/plugin-commonjs'
import eslint from '@rollup/plugin-eslint'
import image from '@rollup/plugin-image'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import address from 'address'
import Zip from 'adm-zip'
import autoprefixer from 'autoprefixer'
import axios from 'axios'
import chalk from 'chalk'
import selector from 'cli-select'
import express from 'express'
import proxy from 'express-http-proxy'
import fs, { promises as fsx } from 'fs-extra'
import glob from 'glob'
import http from 'http'
import https from 'https'
import { LinesAndColumns } from 'lines-and-columns'
import { tmpdir } from 'os'
import path from 'path'
import prompt from 'prompts'
import rollup from 'rollup'
import external from 'rollup-plugin-external-node-modules'
import filesize from 'rollup-plugin-filesize'
import jsx from 'rollup-plugin-innet-jsx'
import externals from 'rollup-plugin-node-externals'
import polyfill from 'rollup-plugin-polyfill-node'
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs'
import env, { EnvValues } from 'rollup-plugin-process-env'
import styles from 'rollup-plugin-styles'
import { terser } from 'rollup-plugin-terser'
import stream from 'stream'
import tmp from 'tmp'
import { promisify } from 'util'

import {
  imageInclude,
  lintInclude,
  stringExcludeDom,
  stringExcludeNode,
} from './constants'
import { convertIndexFile, getFile, reporter } from './helpers'
import { updateDotenv } from './updateDotenv'

const livereload = require('rollup-plugin-livereload')
const { string } = require('rollup-plugin-string')
const { exec, spawn } = require('child_process')
const readline = require('readline')
const importAssets = require('rollup-plugin-import-assets')
const execAsync = promisify(exec)
const copyFiles = promisify(fs.copy)
const pipeline = promisify(stream.pipeline)

updateDotenv()

const REG_CLEAR_TEXT = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
const REG_RPT_ERROR_FILE = /(src[^:]+):(\d+):(\d+)/
const REG_TJSX = /\.[tj]sx?$/
const REG_EXT = /\.([^.]+)$/

export interface ReleaseOptions {
  node?: boolean
  index?: string
  pub?: boolean
}

export const scriptExtensions = ['ts', 'js', 'tsx', 'jsx']
export const indexExt = scriptExtensions.join(',')

export class InnetJS {
  baseUrl: string
  projectFolder: string
  publicFolder: string
  releaseFolder: string
  licenseFile: string
  licenseReleaseFile: string
  readmeFile: string
  readmeReleaseFile: string
  declarationFile: string
  declarationReleaseFile: string
  buildFolder: string
  devBuildFolder: string
  srcFolder: string
  publicIndexFile: string
  buildIndexFile: string
  devBuildIndexFile: string
  sslKey: string
  sslCrt: string
  proxy: string
  sourcemap: boolean
  cssModules: boolean
  cssInJs: boolean
  port: number
  api: string
  envPrefix: string
  simulateIP: string

  private package: object

  constructor ({
    envPrefix = process.env.INNETJS_ENV_PREFIX || 'INNETJS_',
    projectFolder = process.env.PROJECT_FOLDER || '',
    baseUrl = process.env.BASE_URL || '',
    publicFolder = process.env.PUBLIC_FOLDER || 'public',
    releaseFolder = process.env.RELEASE_FOLDER || 'release',
    buildFolder = process.env.BUILD_FOLDER || 'build',
    srcFolder = process.env.SRC_FOLDER || 'src',
    sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false,
    cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true,
    cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true,
    sslKey = process.env.SSL_KEY || 'localhost.key',
    sslCrt = process.env.SSL_CRT || 'localhost.crt',
    proxy = process.env.PROXY || '',
    simulateIP = process.env.IP,
    port = process.env.PORT ? +process.env.PORT : 3000,
    api = process.env.API || '/api/?*',
  } = {}) {
    this.projectFolder = path.resolve(projectFolder)
    this.publicFolder = path.resolve(publicFolder)
    this.releaseFolder = path.resolve(releaseFolder)
    this.buildFolder = path.resolve(buildFolder)
    this.srcFolder = path.resolve(srcFolder)
    this.licenseFile = path.join(projectFolder, 'LICENSE')
    this.licenseReleaseFile = path.join(releaseFolder, 'LICENSE')
    this.readmeFile = path.join(projectFolder, 'README.md')
    this.readmeReleaseFile = path.join(releaseFolder, 'README.md')
    this.declarationFile = path.join(srcFolder, 'declaration.d.ts')
    this.declarationReleaseFile = path.join(releaseFolder, 'declaration.d.ts')
    this.publicIndexFile = path.join(publicFolder, 'index.html')
    this.buildIndexFile = path.join(buildFolder, 'index.html')
    this.devBuildFolder = path.resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build')
    this.devBuildIndexFile = path.join(this.devBuildFolder, 'index.html')
    this.sourcemap = sourcemap
    this.cssModules = cssModules
    this.cssInJs = cssInJs
    this.sslKey = sslKey
    this.sslCrt = sslCrt
    this.port = port
    this.proxy = proxy
    this.api = api
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    this.envPrefix = envPrefix
    this.simulateIP = simulateIP
  }

  // Methods
  async init (appName: string, { template, force = false } = {} as any) {
    const appPath = path.resolve(appName)
    const { data } = await logger.start('Get templates list', async () =>
      await axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'))

    const templates = data.map(({ name }) => name).filter(name => name !== 'main')

    if (!template || !templates.includes(template)) {
      logger.log(chalk.green('Select one of those templates'))

      const { value } = await selector({
        values: templates,
      })
      template = value

      readline.moveCursor(process.stdout, 0, -1)

      const text = `Selected template: ${chalk.white(value)}`
      logger.start(text)
      logger.end(text)
    }

    if (!force) {
      await logger.start('Check if app folder is available', async () => {
        if (fs.existsSync(appPath)) {
          logger.log(chalk.red(`'${appPath}' already exist, what do you want?`))

          const { id: result, value } = await selector({
            values: ['Stop the process', 'Remove the folder', 'Merge with template'],
          })

          readline.moveCursor(process.stdout, 0, -1)

          logger.log(`Already exist, selected: ${value}`)

          if (!result) {
            throw Error(`'${appPath}' already exist`)
          }

          if (result === 1) {
            await fs.remove(appPath)
          }
        }
      })
    }

    await logger.start('Download template', async () => {
      const tmpPath = tmpdir()
      const zipPath = path.join(tmpPath, 'template.zip')
      const unzipPath = path.join(tmpPath, `innetjs-templates-${template}`)
      const { data } = await axios.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
        responseType: 'stream',
      })

      await pipeline(data, fs.createWriteStream(zipPath))

      const zip = new Zip(zipPath)

      await new Promise((resolve, reject) => {
        zip.extractAllToAsync(tmpPath, false, false, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve(undefined)
          }
        })
      })

      await fs.remove(zipPath)

      await fs.move(unzipPath, appPath, { overwrite: true })
    })

    await logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`))
  }

  async build ({ node = false, inject = false, index = 'index' } = {}) {
    const input = glob.sync(`src/${index}.{${indexExt}}`)

    if (!input.length) {
      throw Error('index file is not detected')
    }

    await logger.start('Remove build', () => fs.remove(this.buildFolder))

    const pkg = node && await this.getPackage()
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

    this.withLint(options, true)

    const outputOptions = {
      dir: this.buildFolder,
      sourcemap: this.sourcemap,
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
          publicPath: this.baseUrl,
        }),
        styles({
          mode: this.cssInJs ? 'inject' : 'extract',
          url: {
            inline: false,
            publicPath: `${this.baseUrl}assets`,
          },
          plugins: [autoprefixer()],
          autoModules: this.cssModules ? (id: string) => !id.includes('.global.') : true,
          sourceMap: this.sourcemap,
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

    this.withEnv(options, true)

    await logger.start('Build production bundle', async () => {
      const bundle = await rollup.rollup(options)
      await bundle.write(outputOptions)
      await bundle.close()
      if (!node) {
        await copyFiles(this.publicFolder, this.buildFolder)
        const data = await fsx.readFile(this.publicIndexFile)
        const pkg = await this.getPackage()
        await fsx.writeFile(
          this.buildIndexFile,
          await convertIndexFile(data, pkg.version, this.baseUrl, path.parse(input[0]).name, inject),
        )
      }
    })

    if (pkg) {
      await logger.start('Copy package.json', async () => {
        const data = { ...pkg }
        delete data.private
        delete data.devDependencies

        await fs.writeFile(
          path.resolve(this.buildFolder, 'package.json'),
          JSON.stringify(data, undefined, 2),
          'UTF-8',
        )
      })
      const pkgLockPath = path.resolve(this.projectFolder, 'package-lock.json')
      if (fs.existsSync(pkgLockPath)) {
        await logger.start('Copy package-lock.json', () => {
          return fs.copy(pkgLockPath, path.resolve(this.buildFolder, 'package-lock.json'))
        })
      }
    }
  }

  async start ({
    node = false,
    inject = false,
    error = false,
    index = 'index',
  } = {}) {
    const pkg = await this.getPackage()
    const input = glob.sync(`src/${index}.{${indexExt}}`)

    if (!input.length) {
      throw Error('index file is not detected')
    }

    await logger.start('Remove build', () => fs.remove(this.devBuildFolder))

    const options: rollup.RollupOptions = {
      input,
      preserveEntrySignatures: 'strict',
      output: {
        dir: this.devBuildFolder,
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
          const { loc: { line, column, file }, frame, message } = warning
          console.log(`ERROR in ${file}:${line}:${column}`)
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
        this.createServer(input),
      )
    } else {
      const key = path.basename(this.sslKey) !== this.sslKey
        ? this.sslKey
        : fs.existsSync(this.sslKey)
          ? fs.readFileSync(this.sslKey)
          : undefined

      const cert = path.basename(this.sslCrt) !== this.sslCrt
        ? this.sslCrt
        : fs.existsSync(this.sslCrt)
          ? fs.readFileSync(this.sslCrt)
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
          publicPath: this.baseUrl,
        }),
        styles({
          mode: this.cssInJs ? 'inject' : 'extract',
          url: {
            inline: false,
            publicPath: `${this.baseUrl}assets`,
          },
          plugins: [autoprefixer()],
          autoModules: this.cssModules ? (id: string) => !id.includes('.global.') : true,
          sourceMap: true,
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeDom,
        }),
        this.createClient(key, cert, pkg, path.parse(input[0]).name, inject),
        livereload({
          exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'],
          watch: [this.devBuildFolder, this.publicFolder],
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

  async run (file) {
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
            compilerOptions: {
              sourceMap: true,
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
      spawn('node', ['-r', 'source-map-support/register', jsFilePath], { stdio: 'inherit' })
    })
  }

  async release ({ index = 'index', pub }: ReleaseOptions = {}) {
    const { releaseFolder, cssModules } = this
    await logger.start('Remove previous release', () => fs.remove(releaseFolder))

    const pkg = await this.getPackage()

    const build = async (format: rollup.ModuleFormat) => {
      const ext: string = format === 'es'
        ? (pkg.module || pkg.esnext || pkg['jsnext:main'])?.replace('index', '') || '.mjs'
        : pkg.main?.replace('index', '') || '.js'

      const input = glob.sync(`src/${index}.{${indexExt}}`)

      if (!input.length) {
        throw Error('index file is not detected')
      }

      const options: rollup.RollupOptions = {
        input,
        external: ['tslib'],
        treeshake: false,
        output: {
          dir: releaseFolder,
          entryFileNames: ({ name, facadeModuleId }) => {
            if (REG_TJSX.test(facadeModuleId)) {
              return `${name}${ext}`
            }

            const match = facadeModuleId.match(REG_EXT)

            return match ? `${name}${match[0]}${ext}` : `${name}${ext}`
          },
          format,
          preserveModules: true,
          exports: 'named',
        },
        plugins: [
          json(),
          ts({
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
            mode: this.cssInJs ? 'inject' : 'extract',
            plugins: [autoprefixer()],
            autoModules: cssModules ? (id: string) => !id.includes('.global.') : true,
            minimize: true,
          }),
          nodeResolve(),
          external(),
        ],
      }

      this.withLint(options)
      this.withEnv(options, true)

      const bundle = await rollup.rollup(options)
      await bundle.write(options.output as rollup.OutputOptions)
      await bundle.close()
    }

    await logger.start('Build cjs bundle', async () => {
      await build('cjs')
    })

    await logger.start('Build es6 bundle', async () => {
      await build('es')
    })

    await logger.start('Copy package.json', async () => {
      const data = { ...pkg }

      delete data.private
      delete data.devDependencies

      await fs.writeFile(
        path.resolve(this.releaseFolder, 'package.json'),
        JSON.stringify(data, undefined, 2),
        'UTF-8',
      )
    })

    if (pkg.bin) {
      await logger.start('Build bin', async () => {
        const { bin } = pkg

        for (const name in bin) {
          const value = bin[name]
          const input = glob.sync(`src/${value}.{${indexExt}}`)
          const file = path.join(this.releaseFolder, value)

          const options: rollup.RollupOptions = {
            input,
            external: [...Object.keys(pkg.dependencies), 'tslib'],
            output: {
              file,
              format: 'cjs',
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

    if (fs.existsSync(this.licenseFile)) {
      await logger.start('Copy license', async () => {
        await fsx.copyFile(this.licenseFile, this.licenseReleaseFile)
      })
    }

    if (fs.existsSync(this.readmeFile)) {
      await logger.start('Copy readme', async () => {
        await fsx.copyFile(this.readmeFile, this.readmeReleaseFile)
      })
    }

    if (fs.existsSync(this.declarationFile)) {
      await logger.start('Copy declaration', async () => {
        await fsx.copyFile(this.declarationFile, this.declarationReleaseFile)
      })
    }

    if (pub) {
      const date = (Date.now() / 1000) | 0
      await logger.start(`publishing v${pkg.version} ${date}`, async () => {
        await execAsync(`npm publish ${this.releaseFolder}`)
      })
    }
  }

  // Helpers

  private _lintUsage: boolean
  withLint (options: rollup.RollupOptions, prod = false) {
    if (this._lintUsage === undefined) {
      this._lintUsage = fs.existsSync(path.join(this.projectFolder, '.eslintrc'))
    }

    if (this._lintUsage) {
      options.plugins.push(eslint({
        include: lintInclude,
        throwOnError: prod,
      }))
    }
  }

  withEnv (options: rollup.RollupOptions, virtual?: boolean, preset?: EnvValues) {
    options.plugins.push(env(this.envPrefix, {
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
        path.resolve(this.projectFolder, 'package.json'),
        JSON.stringify(pkg, undefined, 2),
        'UTF-8',
      )
    })
  }

  async getPackage (): Promise<Record<string, any>> {
    if (this.package) {
      return this.package
    }

    const packageFolder = path.resolve(this.projectFolder, 'package.json')

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
            const data = await fsx.readFile(this.publicIndexFile)
            await fsx.writeFile(
              this.devBuildIndexFile,
              await convertIndexFile(data, pkg.version, this.baseUrl, index, inject),
            )
          }

          fs.watch(this.publicIndexFile, update)
          await update()

          const httpsUsing = !!(cert && key)

          app.use(this.baseUrl, express.static(this.devBuildFolder))
          app.use(this.baseUrl, express.static(this.publicFolder))

          if (this.proxy?.startsWith('http')) {
            if (this.simulateIP) {
              app.use((req, res, next) => {
                req.headers['X-Real-IP'] = this.simulateIP
                next()
              })
            }

            app.use(this.api, proxy(this.proxy, {
              https: httpsUsing,
              limit: '1000mb',
              proxyReqPathResolver: req => req.originalUrl,
            }))
          }

          app.use(/^([^.]*|.*\.[^.]{5,})$/, (req, res) => {
            res.sendFile(this.devBuildFolder + '/index.html')
          })

          const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app)
          let port = this.port
          const listener = () => {
            const baseUrl = this.baseUrl === '/' ? '' : this.baseUrl
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

  createServer (input: string[]): rollup.Plugin {
    const apps: Record<string, any> = {}

    return {
      name: 'server',
      writeBundle: async () => {
        for (const file of input) {
          const { name } = path.parse(file)
          apps[name]?.kill()
          const filePath = path.resolve(this.devBuildFolder, `${name}.js`)
          apps[name] = spawn('node', ['-r', 'source-map-support/register', filePath], { stdio: 'inherit' })
        }
      },
    }
  }
}
