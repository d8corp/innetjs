import logger from '@cantinc/logger'
import Zip from 'adm-zip'
import axios from 'axios'
import chalk from 'chalk'
import { exec } from 'child_process'
import selector from 'cli-select'
import fs from 'fs-extra'
import { tmpdir } from 'os'
import path from 'path'
import readline from 'readline'
import stream from 'stream'
import { promisify } from 'util'

import { InitOptions } from '../../types'

const execAsync = promisify(exec)
const pipeline = promisify(stream.pipeline)

export async function init (appName: string, { template, force = false }: InitOptions = {}) {
  const appPath = path.resolve(appName)
  const { data } = await logger.start('Get templates list', async () =>
    await axios.get('https://api.github.com/repos/d8corp/innetjs-templates/branches'))

  const templates: string[] = data.map(({ name }) => name as string).filter((name: string) => name !== 'main')

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
