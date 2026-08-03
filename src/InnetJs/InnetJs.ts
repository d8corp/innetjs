import logger from '@cantinc/logger'
import eslint from '@rollup/plugin-eslint'
import address from 'address'
import chalk from 'chalk'
import express from 'express'
import proxy from 'express-http-proxy'
import fs, { promises as fsx } from 'fs-extra'
import http from 'http'
import https from 'https'
import path from 'path'
import prompt from 'prompts'
import rollup from 'rollup'
import env, { EnvValues } from 'rollup-plugin-process-env'

import { build, init, release, run, start } from '../commands'
import {
  lintInclude,
} from '../constants'
import { convertIndexFile } from '../helpers'
import { BuildOptions, InitOptions, InnetJSParams, ReleaseOptions, RunOptions, StartOptions } from '../types'
import { getDefaultOptions, printErrorWithFrame, updateDotenv } from '../utils'

const { spawn } = require('child_process')

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

  async start (options: StartOptions = {}) {
    await start(options, this)
  }

  async run (file: string, options: RunOptions = {}) {
    await run(file, options)
  }

  async release (options: ReleaseOptions = {}) {
    await release(options, this)
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
