import path from 'path'
import fs, {promises as fsx} from 'fs-extra'
import http from 'http'
import https from 'https'
import { promisify } from 'util'
import axios from 'axios'
import logger from '@cantinc/logger'
import chalk from 'chalk'
import rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import styles from 'rollup-plugin-styles'
import autoprefixer from 'autoprefixer'
import express from 'express'
import json from '@rollup/plugin-json'
import tmp from 'tmp'
import proxy from 'express-http-proxy'
import selector from 'cli-select'
import prompt from 'prompts'
import jsx from 'rollup-plugin-innet-jsx'
import filesize from 'rollup-plugin-filesize'
import image from '@rollup/plugin-image'
import eslint from '@rollup/plugin-eslint'
import injectEnv from 'rollup-plugin-inject-process-env'
import { LinesAndColumns } from 'lines-and-columns'

import { Extract } from './extract'
import { stringExcludeDom, stringExcludeNode, lintIncludeDom } from './constants'
import { convertIndexFile, reporter, getFile } from './helpers'

const livereload = require('rollup-plugin-livereload')
const { string } = require('rollup-plugin-string')
const { exec, spawn } = require('child_process')
const readline = require('readline')
const execAsync = promisify(exec)
const copyFiles = promisify(fs.copy)

require('dotenv').config()

const innetEnv = Object.keys(process.env).reduce((result, key) => {
  if (key.startsWith('INNETJS_')) {
    result[key] = process.env[key]
  }
  return result
}, {})

type Extensions = 'js' | 'ts' | 'tsx' | 'jsx'

export default class InnetJS {
  baseUrl: string
  projectFolder: string
  publicFolder: string
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

  private projectExtension: Extensions
  private package: object

  constructor ({
    projectFolder = process.env.PROJECT_FOLDER || '',
    baseUrl = process.env.BASE_URL || '/',
    publicFolder = process.env.PUBLIC_FOLDER || 'public',
    buildFolder = process.env.BUILD_FOLDER || 'build',
    srcFolder = process.env.SRC_FOLDER || 'src',
    sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false,
    cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true,
    cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true,
    sslKey = process.env.SSL_KEY || 'localhost.key',
    sslCrt = process.env.SSL_CRT || 'localhost.crt',
    proxy = process.env.PROXY || '',
    port = process.env.PORT ? +process.env.PORT : 3000,
    api = process.env.API || '/api/?*',
  } = {}) {
    this.projectFolder = path.resolve(projectFolder)
    this.publicFolder = path.resolve(publicFolder)
    this.buildFolder = path.resolve(buildFolder)
    this.srcFolder = path.resolve(srcFolder)
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
    this.baseUrl = baseUrl
  }

  // Methods
  async init (appName: string, { template, force = false } = {} as any) {
    const appPath = path.resolve(appName)
    const { data } = await logger.start('Get templates list', async () =>
      await axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'))

    const templates = data.map(({ name }) => name).filter(name => name !== 'main')

    if (!template || !templates.includes(template)) {
      logger.log(chalk.green(`Select one of those templates`))

      const { value } = await selector({
        values: templates
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

          const {id: result, value} = await selector({
            values: ['Stop the process', 'Remove the folder', 'Merge with template']
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
      const { data } = await axios.get(`https://github.com/d8corp/innetjs-templates/archive/refs/heads/${template}.zip`, {
        responseType: 'stream'
      })

      await new Promise((resolve, reject) => {
        data.pipe(Extract({
          path: appPath,
        }, template)).on('finish', resolve).on('error', reject)
      })
    })

    await logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`))
  }

  async build ({node = false} = {}) {
    const indexExtension = await this.getProjectExtension()

    await logger.start('Remove build', () => fs.remove(this.buildFolder))

    const pkg = node && await this.getPackage()
    const inputOptions = {
      input: path.resolve(this.srcFolder, `index.${indexExtension}`),
      preserveEntrySignatures: 'strict',
      plugins: [
        commonjs(),
        json(),
        typescript(),
        jsx(),
      ]
    } as Record<string, any>

    const outputOptions = {
      dir: this.buildFolder,
      sourcemap: this.sourcemap
    } as Record<string, any>

    if (node) {
      outputOptions.format = 'cjs'
      inputOptions.external = Object.keys(pkg?.dependencies || {})
      inputOptions.plugins.push(
        nodeResolve({
          moduleDirectories: [path.resolve(this.buildFolder, 'node_modules')]
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeNode,
        }),
      )
    } else {
      inputOptions.plugins = [
        eslint({
          include: lintIncludeDom,
        }),
        ...inputOptions.plugins,
        nodeResolve({
          browser: true,
        }),
        image(),
        styles({
          mode: this.cssInJs ? 'inject' : 'extract',
          url: true,
          plugins: [autoprefixer()],
          modules: this.cssModules,
          sourceMap: this.sourcemap,
          minimize: true,
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeDom,
        }),
        injectEnv(innetEnv),
      ]
      outputOptions.format = 'es'
      outputOptions.plugins = [
        terser(),
        filesize({
          reporter,
        }),
      ]
    }

    await logger.start('Build production bundle', async () => {
      const bundle = await rollup.rollup(inputOptions)
      await bundle.write(outputOptions)
      await bundle.close()
      if (!node) {
        await copyFiles(this.publicFolder, this.buildFolder)
        const data = await fsx.readFile(this.publicIndexFile)
        const pkg = await this.getPackage()
        await fsx.writeFile(
          this.buildIndexFile,
          await convertIndexFile(data, pkg.version, this.baseUrl),
        )
      }
    })

    if (pkg) {
      await logger.start('Copy package.json', async () => {
        const data = {...pkg}
        delete data.private
        delete data.devDependencies

        await fs.writeFile(
          path.resolve(this.buildFolder, 'package.json'),
          JSON.stringify(data, undefined, 2),
          'UTF-8'
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

  async start ({ node = false, error = false } = {}) {
    const indexExtension = await this.getProjectExtension()
    const pkg = await this.getPackage()

    await logger.start('Remove build', () => fs.remove(this.devBuildFolder))

    const options = {
      input: path.resolve(this.srcFolder, `index.${indexExtension}`),
      preserveEntrySignatures: 'strict',
      output: {
        dir: this.devBuildFolder,
        sourcemap: true,
      },
      plugins: [
        commonjs(),
        json(),
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              sourceMap: true
            }
          }
        }),
        jsx(),
      ],
    } as Record<string, any>

    if (node) {
      options.output.format = 'cjs'
      options.external = Object.keys(pkg?.dependencies || {})
      options.plugins.push(
        nodeResolve({
          moduleDirectories: [path.resolve(this.srcFolder, 'node_modules')]
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeNode,
        }),
        this.createServer(options.external),
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

      options.output.format = 'es'
      options.plugins = [
        eslint({
          include: lintIncludeDom,
        }),
        ...options.plugins,
        nodeResolve({
          browser: true,
        }),
        image(),
        styles({
          mode: this.cssInJs ? 'inject' : 'extract',
          url: true,
          plugins: [autoprefixer()],
          modules: this.cssModules,
          sourceMap: true,
        }),
        string({
          include: '**/*.*',
          exclude: stringExcludeDom,
        }),
        this.createClient(key, cert, pkg),
        livereload({
          exts: ['html', 'css', 'js', 'png', 'svg', 'webp', 'gif', 'jpg', 'json'],
          watch: [this.devBuildFolder, this.publicFolder],
          verbose: false,
          ...(key && cert ? {https: {key, cert}} : {})
        }),
        injectEnv(innetEnv),
      ]
    }

    const watcher = rollup.watch(options)

    watcher.on('event', async e => {
      if (e.code == 'ERROR') {
        if (e.error.code === 'UNRESOLVED_IMPORT') {
          const [, importer, file] = e.error.message.match(/^Could not resolve '(.+)' from (.+)$/) || []
          const text = (await fs.readFile(file)).toString()
          const lines = new LinesAndColumns(text)
          const { line, column } = lines.locationForIndex(text.indexOf(importer))
          logger.end('Bundling', e.error.message)
          console.log(`ERROR in ${file}:${line + 1}:${column + 1}`)
        } else if (e.error.code === 'PLUGIN_ERROR' && ['rpt2', 'commonjs'].includes(e.error.plugin)) {
          const [, file, line, column] = e.error.message.match(/^[^(]+(src[^(]+)\((\d+),(\d+)\)/) || []
          logger.end('Bundling', e.error.message)
          if (file) {
            console.log(`ERROR in ${file}:${line}:${column}`)
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

    const folder = await new Promise((resolve, reject) => {
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
          typescript({
            tsconfigOverride: {
              compilerOptions: {
                sourceMap: true
              }
            }
          })
        ]
      }

      const outputOptions = {
        format: 'cjs' as 'commonjs',
        file: jsFilePath,
        sourcemap: true
      }

      const bundle = await rollup.rollup(inputOptions)
      await bundle.write(outputOptions)
      await bundle.close()
    })

    await logger.start('Running of the script', async () => {
      spawn('node', ['-r', 'source-map-support/register', jsFilePath], {stdio: 'inherit'})
    })
  }

  // Utils
  async getProjectExtension (): Promise<Extensions> {
    if (this.projectExtension) {
      return this.projectExtension
    }

    await logger.start('Check src', () => {
      if (!fs.existsSync(this.srcFolder)) {
        throw Error('src folder is missing')
      }
    })

    await logger.start('Detection of index file', () => {
      if (fs.existsSync(path.join(this.srcFolder, 'index.js'))) {
        this.projectExtension = 'js'
      } else if (fs.existsSync(path.join(this.srcFolder, 'index.ts'))) {
        this.projectExtension = 'ts'
      } else if (fs.existsSync(path.join(this.srcFolder, 'index.tsx'))) {
        this.projectExtension = 'tsx'
      } else if (fs.existsSync(path.join(this.srcFolder, 'index.jsx'))) {
        this.projectExtension = 'jsx'
      } else {
        throw Error('index file is not detected')
      }
    })

    return this.projectExtension
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

  createClient (key, cert, pkg) {
    let app

    return {
      writeBundle: async () => {
        if (!app) {
          app = express()
          const update = async () => {
            const data = await fsx.readFile(this.publicIndexFile)
            await fsx.writeFile(
              this.devBuildIndexFile,
              await convertIndexFile(data, pkg.version, this.baseUrl),
            )
          }

          fs.watch(this.publicIndexFile, update)
          await update()

          const httpsUsing = !!(cert && key)

          app.use(express.static(this.devBuildFolder))
          app.use(express.static(this.publicFolder))

          if (this.proxy?.startsWith('http')) {
            app.use(this.api, proxy(this.proxy, {
              https: httpsUsing,
              proxyReqPathResolver: req => req.originalUrl
            }))
          }

          app.use(/^[^.]+$/, (req, res) => {
            res.sendFile(this.devBuildFolder + '/index.html')
          })

          const server = httpsUsing ? https.createServer({ key, cert }, app) : http.createServer(app)
          let port = this.port
          const listener = () => {
            console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${port}`)
          }

          server.listen(port, listener)
          server.on('error', async (e: any) => {
            if (e.code === 'EADDRINUSE') {
              port++
              const { userPort } = await prompt({
                name: 'userPort',
                type: 'number',
                message: `Port ${e.port} is reserved, please enter another one [${port}]:`
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
      }
    }
  }

  createServer (external: string[]) {
    let app
    return {
      writeBundle: async () => {
        app?.kill()
        const filePath = path.resolve(this.buildFolder, 'index.js')
        let data = await fs.readFile(filePath, 'UTF-8')
        const regExp = new RegExp(`require\\('(${external.join('|')})'\\)`, 'g')
        data = data.replace(regExp, `require('${path.resolve(this.projectFolder, 'node_modules', '$1')}')`)
        await fs.writeFile(filePath, data)

        app = spawn('node', ['-r', 'source-map-support/register', filePath], {stdio: 'inherit'})
      }
    }
  }
}
