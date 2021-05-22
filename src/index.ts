import path from 'path'
import fs from 'fs-extra'
import http from 'http'
import https from 'https'
import ora, {Ora} from 'ora'
import chalk from 'chalk'
import util from 'util'
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

require('dotenv').config()

const publicFolder = process.env.PUBLIC_FOLDER || 'public'

const livereload = require('rollup-plugin-livereload')
const exec = util.promisify(require('child_process').exec)
const proxy = require('express-http-proxy')

async function task (name, callback) {
  const task = ora(name).start()
  try {
    const result = await callback(task)
    task.succeed()
    return result
  } catch (e) {
    task.fail()
    console.log(chalk.red('└ ' + (e?.message || e)))
    return Promise.reject(e)
  }
}

async function init (appName) {
  const appPath = path.resolve(appName)
  const libPath = path.resolve(__dirname + '/..')

  await task('Check if app folder is available', () => {
    if (fs.existsSync(appPath)) {
      throw Error(`'${appPath}' already exist`)
    }
  })

  await task('Copy files', () => fs.copy(`${libPath}/template`, appPath))

  await task('Install packages', () => exec(`cd ${appPath} && npm i`))
}

async function check (projectPath): Promise<'js' | 'ts' | 'tsx'> {
  const srcPath = `${projectPath}/src`
  const publicPath = `${projectPath}/${publicFolder}`
  let indexExtension: 'js' | 'ts' | 'tsx'

  await task('Check src', () => {
    if (!fs.existsSync(srcPath)) {
      throw Error('src folder is missing')
    }
  })
  await task('Check public', () => {
    if (!fs.existsSync(publicPath)) {
      throw Error(`public folder is missing here ${publicPath}`)
    }
  })
  await task('Check index.html', () => {
    if (!fs.existsSync(`${publicPath}/index.html`)) {
      throw Error('index.html is missing')
    }
  })
  await task('Detection of index file', () => {
    if (fs.existsSync(`${srcPath}/index.js`)) {
      indexExtension = 'js'
    } else if (fs.existsSync(`${srcPath}/index.ts`)) {
      indexExtension = 'ts'
    } else if (fs.existsSync(`${srcPath}/index.tsx`)) {
      indexExtension = 'tsx'
    } else {
      throw Error('index file is not detected')
    }
  })
  return indexExtension
}

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

async function start () {
  const projectPath = path.resolve()
  let cert
  let key
  try {
    cert = fs.readFileSync(process.env.SSL_CRT_FILE || 'localhost.crt')
  } catch (e) {}
  try {
    key = fs.readFileSync(process.env.SSL_KEY_FILE || 'localhost.key')
  } catch (e) {}

  const indexExtension = await check(projectPath)

  const options = {
    input: `src/index.${indexExtension}`,
    output: {
      sourcemap: true,
      format: 'iife' as 'commonjs',
      dir: `${publicFolder}/build`
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      json(),
      postcss({
        plugins: [autoprefixer()],
        modules: process.env.CSS_MODULES === 'true',
        sourceMap: true,
        extract: process.env.CSS_EXTRACT === 'true' && path.resolve(`${publicFolder}/build/index.css`),
      }),
      typescript(),
      server(`${projectPath}/${publicFolder}`, cert, key),
      livereload({
        watch: publicFolder,
        verbose: false,
        ...(key && cert ? {https: {key, cert}} : {})
      })
    ],
  }

  const watcher = rollup.watch(options)

  let eventTask: Ora

  watcher.on('event', e => {
    if (e.code == 'ERROR') {
      eventTask.fail('Bundling is failed')
      console.log(chalk.red('└ ' + e.error.message))
    } else if (e.code === 'BUNDLE_START') {
      if (!!eventTask?.isSpinning) {
        eventTask.stop()
      }
      eventTask = ora('Bundling\n').start()
    } else if (e.code === 'BUNDLE_END') {
      if (eventTask.isSpinning) {
        eventTask.succeed('Bundle is ready')
      }
    }
  })
}

async function build () {
  const projectPath = path.resolve()

  const indexExtension = await check(projectPath)

  await task('Remove build', () => fs.remove(`${projectPath}/${publicFolder}/build`))

  await task('Build production bundle', async () => {
    const inputOptions = {
      input: `src/index.${indexExtension}`,
      plugins: [
        commonjs(),
        nodeResolve(),
        json(),
        postcss({
          plugins: [autoprefixer()],
          extract: process.env.CSS_EXTRACT === 'true' && path.resolve(`${publicFolder}/build/index.css`),
          modules: process.env.CSS_MODULES === 'true',
          sourceMap: process.env.GENERATE_SOURCEMAP === 'true'
        }),
        typescript()
      ]
    }

    const outputOptions = {
      format: 'iife' as 'commonjs',
      dir: `${publicFolder}/build`,
      plugins: [terser()],
      sourcemap: process.env.GENERATE_SOURCEMAP === 'true'
    }

    const bundle = await rollup.rollup(inputOptions)
    await bundle.write(outputOptions)
    await bundle.close()
  })
}

async function run (file) {
  const input = await task('Check file', () => getFile(file))

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

  await task('Build bundle', async () => {
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

  await task('Running of the script', async () => {
    const childProcess = require('child_process').exec(`node -r source-map-support/register ${jsFilePath}`)
    childProcess.stdout.pipe(process.stdout)
    childProcess.stderr.pipe(process.stderr)
  })
}

function server (rootPath: string, cert?, key?) {
  let app

  return {
    writeBundle () {
      if (!app) {
        const httpsUsing = !!(cert && key)
        const port = process.env.PORT || 3000

        app = express()
        app.use(express.static(rootPath))

        if (process.env.PROXY?.startsWith('http')) {
          app.use(proxy(process.env.PROXY, {
            https: httpsUsing
          }))
        }

        const server = httpsUsing ? https.createServer({key, cert}, app) : http.createServer(app)
        server.listen(port, () => {
          console.log(`${chalk.green('➤')} Server started on http${httpsUsing ? 's' : ''}://localhost:${port}`)
        })
      }
    }
  }
}

export {
  init,
  start,
  build,
  server,
  run,
}
