import path from 'path'
import fs from 'fs-extra'
import ora from 'ora'
import chalk from 'chalk'
import util from 'util'
import rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'

const livereload = require('rollup-plugin-livereload')
const exec = util.promisify(require('child_process').exec)

async function task (name, callback) {
  const task = ora(name).start()
  try {
    await callback(task)
    task.succeed()
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
  const publicPath = `${projectPath}/public`
  let indexExtension: 'js' | 'ts' | 'tsx'

  await task('Check src', () => {
    if (!fs.existsSync(srcPath)) {
      throw Error('src folder is missing')
    }
  })
  await task('Check public', () => {
    if (!fs.existsSync(publicPath)) {
      throw Error('public folder is missing')
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

async function start () {
  const projectPath = path.resolve()

  const indexExtension = await check(projectPath)

  await task('Bundle script', async () => {
    const options = {
      input: `src/index.${indexExtension}`,
      output: {
        sourcemap: true,
        format: 'iife' as 'commonjs',
        file: 'public/build/index.js',
        inlineDynamicImports: true
      },
      plugins: [
        commonjs(),
        nodeResolve(),
        postcss({
          plugins: [autoprefixer()],
          extract: path.resolve('public/build/index.css'),
          modules: true
        }),
        typescript(),
        // // serve(),
        livereload('public')
      ],
    }

    const watcher = rollup.watch(options)

    watcher.on('change', () => {
      task('Update bundle', () => new Promise(resolve => {
        watcher.once('restart', () => {
          resolve(undefined)
        })
      }))
    })
  })
}

async function build () {
  const projectPath = path.resolve()

  const indexExtension = await check(projectPath)

  await task('Remove build', () => fs.remove(`${projectPath}/public/build`))

  await task('Build production bundle', async () => {
    const inputOptions = {
      input: `src/index.${indexExtension}`,
      plugins: [
        commonjs(),
        nodeResolve(),
        postcss({
          plugins: [autoprefixer()],
          extract: path.resolve('public/build/index.css'),
          modules: true
        }),
        typescript()
      ]
    }

    const outputOptions = {
      format: 'iife' as 'commonjs',
      file: 'public/build/index.js',
      plugins: [terser()]
    }

    const bundle = await rollup.rollup(inputOptions)
    await bundle.write(outputOptions)
    await bundle.close()
  })
}

export {
  init,
  start,
  build,
}
