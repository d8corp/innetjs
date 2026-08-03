import logger from '@cantinc/logger'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import rollup from 'rollup'
import tmp from 'tmp'

import { getFile } from '../../helpers'
import { RunOptions } from '../../types'
const { spawn } = require('child_process')

export async function run (file: string, { config = '', exposeGc = false }: RunOptions = {}) {
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
