import path from 'path'
import fs from 'fs-extra'
import http from 'http'
import https from 'https'
import logger from '@cantinc/logger'
import chalk from 'chalk'
import {promisify} from 'util'
import rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import express from 'express'
import json from '@rollup/plugin-json'
import tmp from 'tmp'
import proxy from 'express-http-proxy'
import selector from 'cli-select'
import jsx from 'rollup-plugin-innet-jsx'

const livereload = require('rollup-plugin-livereload')
const {string} = require('rollup-plugin-string')
const {exec, spawn} = require('child_process')
const readline = require('readline')
const execAsync = promisify(exec)

require('dotenv').config()

type Extensions = 'js' | 'ts' | 'tsx' | 'jsx'

function getFile (file) {
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

export default class InnetJS {

  // Setup during initialisation
  projectFolder: string
  publicFolder: string
  buildFolder: string
  srcFolder: string
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
    publicFolder = process.env.PUBLIC_FOLDER || 'public',
    buildFolder = process.env.BUILD_FOLDER || path.join('public', 'build'),
    srcFolder = process.env.SRC_FOLDER || 'src',
    sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false,
    cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : false,
    cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : false,
    sslKey = process.env.SSL_KEY || 'localhost.key',
    sslCrt = process.env.SSL_CRT || 'localhost.crt',
    proxy = process.env.PROXY || '',
    port = process.env.PORT ? +process.env.PORT : 3000,
    api = process.env.API || '*',
  } = {}) {
    this.projectFolder = path.resolve(projectFolder)
    this.publicFolder = path.resolve(publicFolder)
    this.buildFolder = path.resolve(buildFolder)
    this.srcFolder = path.resolve(srcFolder)
    this.sourcemap = sourcemap
    this.cssModules = cssModules
    this.cssInJs = cssInJs
    this.sslKey = sslKey
    this.sslCrt = sslCrt
    this.port = port
    this.proxy = proxy
    this.api = api
  }

  // Methods
  async init (appName: string, { template, force = false } = {} as any) {
    const appPath = path.resolve(appName)

    if (!template) {
      logger.log(chalk.green(`Select one of those templates`))

      const { value } = await selector({
        values: ['fe', 'be']
      })
      template = value

      readline.moveCursor(process.stdout, 0, -1)

      logger.log(`Selected ${value} template`)
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

    const libPath = path.resolve(__dirname, '..')
    const templatePath = path.resolve(libPath, 'templates', template)

    await logger.start('Check if the template exists', async () => {
      if (!fs.existsSync(templatePath)) {
        throw Error(`The template '${template}' is not exist`)
      }
    })

    await logger.start('Copy files', () => fs.copy(templatePath, appPath))

    await logger.start('Install packages', () => execAsync(`cd ${appPath} && npm i`))
  }

  async build ({node = false} = {}) {
    const indexExtension = await this.getProjectExtension()

    await logger.start('Remove build', () => fs.remove(this.buildFolder))

    const pkg = node && await this.getPackage()
    const inputOptions = {
      input: path.resolve(this.srcFolder, `index.${indexExtension}`),
      plugins: [
        commonjs(),
        nodeResolve(),
        json(),
        typescript(),
        jsx(),
        string({
          include: '**/*.*',
          exclude: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
            '**/*.css',
            '**/*.scss',
          ]
        }),
      ]
    } as Record<string, any>

    const outputOptions = {
      dir: this.buildFolder,
      sourcemap: this.sourcemap
    } as Record<string, any>

    if (node) {
      inputOptions.external = Object.keys(pkg?.dependencies || {})
      outputOptions.format = 'cjs'
      outputOptions.plugins.push(
        string({
          include: '**/*.*',
          exclude: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
          ]
        }),
      )
    } else {
      inputOptions.plugins.push(
        string({
          include: '**/*.*',
          exclude: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
            '**/*.css',
            '**/*.scss',
          ]
        }),
        postcss({
          plugins: [autoprefixer()],
          extract: !this.cssInJs,
          modules: this.cssModules,
          sourceMap: this.sourcemap,
          minimize: true
        }),
      )
      outputOptions.format = 'es'
      outputOptions.plugins = [terser()]
    }

    await logger.start('Build production bundle', async () => {
      const bundle = await rollup.rollup(inputOptions)
      await bundle.write(outputOptions)
      await bundle.close()
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

  async start ({node = false, error = false} = {}) {
    const indexExtension = await this.getProjectExtension()

    const pkg = node && await this.getPackage()

    await logger.start('Remove build', () => fs.remove(this.buildFolder))

    const options = {
      input: path.resolve(this.srcFolder, `index.${indexExtension}`),
      output: {
        dir: this.buildFolder,
        sourcemap: true
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
          exclude: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
          ]
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
      options.plugins.push(
        nodeResolve(),
        string({
          include: '**/*.*',
          exclude: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
            '**/*.css',
            '**/*.scss',
          ]
        }),
        postcss({
          plugins: [autoprefixer()],
          modules: this.cssModules,
          sourceMap: true,
          extract: !this.cssInJs,
        }),
        this.createClient(key, cert),
        livereload({
          watch: this.publicFolder,
          verbose: false,
          ...(key && cert ? {https: {key, cert}} : {})
        })
      )
    }

    const watcher = rollup.watch(options)

    watcher.on('event', e => {
      if (e.code == 'ERROR') {
        logger.end('Bundling', error ? e.error.stack : e.error.message)
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

  createClient (key, cert) {
    let app

    return {
      writeBundle: () => {
        if (!app) {
          const httpsUsing = !!(cert && key)

          app = express()
          app.use(express.static(this.publicFolder))

          if (this.proxy?.startsWith('http')) {
            app.use(this.api, proxy(this.proxy, {
              https: httpsUsing,
              proxyReqPathResolver: req => req.originalUrl
            }))
          }

          app.use(/^[^.]+$/, (req, res) => {
            res.sendFile(this.publicFolder + '/index.html')
          })

          const server = httpsUsing ? https.createServer({key, cert}, app) : http.createServer(app)
          server.listen(this.port, () => {
            console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${this.port}`)
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
