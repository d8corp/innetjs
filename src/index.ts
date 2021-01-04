import path from 'path'
import fs from 'fs-extra'
import ora from 'ora'
import chalk from 'chalk'

const util = require('util')
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
  const libPath = __dirname

  await task('Check if app folder is available', () => {
    if (fs.existsSync(appPath)) {
      throw Error(`'${appPath}' already exist`)
    }
  })

  await task('Copy files', () => fs.copy(`${libPath}/template`, appPath))

  await task('Install packages', () => exec(`cd ${appPath} && npm i`))
}

function start () {

}

function build () {

}

export {
  init,
  start,
  build,
}
