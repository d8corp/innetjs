import { logger } from '@cantinc/logger'
import image from '@rollup/plugin-image'
import terser from '@rollup/plugin-terser'
import autoprefixer from 'autoprefixer'
import { exec, spawn } from 'child_process'
import { promises as fsx } from 'fs'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import type { ModuleFormat, OutputOptions, RolldownOptions, RolldownPluginOption } from 'rolldown'
import { rolldown } from 'rolldown'
import external from 'rollup-plugin-external-node-modules'
import { externals } from 'rollup-plugin-node-externals'
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs'
import env from 'rollup-plugin-process-env'
import { string } from 'rollup-plugin-string'
import styles from 'rollup-plugin-styles'
import { promisify } from 'util'

import { REG_EXT, REG_TJSX, stringExcludeDom } from '../../constants'
import type { InnetJS } from '../../InnetJs'
import type { ReleaseOptions } from '../../types'
import { getNpmTag } from '../../utils'
const execAsync = promisify(exec)

export async function release ({ index = 'index', pub, min, typeCheck, lintCheck }: ReleaseOptions, instance: InnetJS) {
  const { releaseFolder, cssModules } = instance.params

  if (typeCheck) {
    await logger.start('Check TypeScript', async () => {
      const { resolve, reject, promise } = Promise.withResolvers()

      const params = ['--noEmit']

      if (instance.params.tsconfig) {
        params.push('-p', instance.params.tsconfig)
      }

      const process = spawn('tsc', params, {
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

  await logger.start('Remove previous release', () => fs.remove(releaseFolder))

  const pkg = await instance.getPackage()

  const build = async (format: ModuleFormat) => {
    const ext: string = format === 'es'
      ? (pkg.module || pkg.esnext || pkg['jsnext:main'])?.replace('index', '') || '.mjs'
      : pkg.main?.replace('index', '') || '.js'

    const input = glob.sync(`src/${index}.{${instance.params.indexExt}}`)

    if (!input.length) {
      throw Error('index file is not detected')
    }

    const output: OutputOptions = format === 'iife'
      ? {
          file: path.join(releaseFolder, pkg.browser || 'index.min.js'),
          codeSplitting: false,
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

    const plugins: RolldownPluginOption[] = [
      externals(),
      string({
        include: '**/*.*',
        exclude: stringExcludeDom,
      }),
      image(),
      styles({
        mode: instance.params.cssInJs ? 'inject' : 'extract',
        plugins: [autoprefixer()],
        autoModules: cssModules ? (id: string) => !id.includes('.global.') : true,
        minimize: true,
      }),
      external(),
      env(instance.params.envPrefix, {
        include: input,
        virtual: true,
      }),
    ]

    const options: RolldownOptions = {
      input,
      external: ['tslib'],
      treeshake: false,
      output: {
        ...output,
        format,
      },
      plugins,
    }

    if (format === 'iife') {
      plugins.push(terser())
    }

    const bundle = await rolldown(options)
    await bundle.write(options.output as OutputOptions)
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
      path.resolve(instance.params.releaseFolder, 'package.json'),
      JSON.stringify(data, undefined, 2),
      'UTF-8',
    )
  })

  if (pkg.bin) {
    await logger.start('Build bin', async () => {
      const { bin, type } = pkg

      for (const name in bin) {
        const value = bin[name]
        const input = glob.sync(`src/${value}.{${instance.params.indexExt}}`)
        const file = path.join(instance.params.releaseFolder, value)

        const plugins: RolldownPluginOption[] = [
          preserveShebangs(),
          externals(),
          env(instance.params.envPrefix, {
            include: input,
          }),
        ]

        const options: RolldownOptions = {
          input,
          external: [...Object.keys(pkg.dependencies), 'tslib'],
          output: {
            file,
            format: type === 'module' ? 'es' : 'cjs',
          },
          plugins,
        }

        const bundle = await rolldown(options)
        await bundle.write(options.output as OutputOptions)
        await bundle.close()
      }
    })
  }

  if (fs.existsSync(instance.params.licenseFile)) {
    await logger.start('Copy license', async () => {
      await fsx.copyFile(instance.params.licenseFile, instance.params.licenseReleaseFile)
    })
  }

  if (fs.existsSync(instance.params.readmeFile)) {
    await logger.start('Copy readme', async () => {
      await fsx.copyFile(instance.params.readmeFile, instance.params.readmeReleaseFile)
    })
  }

  if (fs.existsSync(instance.params.declarationFile)) {
    await logger.start('Copy declaration', async () => {
      await fsx.copyFile(instance.params.declarationFile, instance.params.declarationReleaseFile)
    })
  }

  if (pub) {
    const date = (Date.now() / 1000) | 0

    await logger.start(`publishing v${pkg.version} ${date}`, async () => {
      await execAsync(`npm publish ${instance.params.releaseFolder} --tag ${getNpmTag(pkg.version)}`)
    })
  }
}
