import { logger } from '@cantinc/logger'
import { spawn } from 'child_process'
import type { InputOptions, OutputOptions } from 'rolldown'
import { rolldown } from 'rolldown'
import tmp from 'tmp'

import { getFile } from '../../helpers'
import type { RunOptions } from '../../types'

export async function run (file: string, { config = '', exposeGc = false, typeCheck }: RunOptions = {}) {
  const input: string = await logger.start('Check file', () => getFile(file))

  if (!input.length) {
    throw Error('index file is not detected')
  }

  if (typeCheck) {
    await logger.start('Check TypeScript', async () => {
      const { resolve, reject, promise } = Promise.withResolvers()

      const params = ['--noEmit']

      if (config) {
        params.push('-p', config)
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
    const inputOptions: InputOptions = {
      input,
      plugins: [],
    }

    const outputOptions: OutputOptions = {
      format: 'cjs' as 'commonjs',
      file: jsFilePath,
      sourcemap: true,
    }

    const bundle = await rolldown(inputOptions)
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
