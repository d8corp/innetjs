import path from 'path'
import fs from 'fs-extra'
import {Listr} from 'listr2'

const util = require('util')
const exec = util.promisify(require('child_process').exec)

function init (appName) {
  const appPath = path.resolve(appName)
  const libPath = __dirname

  return new Listr([
    {
      title: 'Check if app folder is available',
      async task () {
        if (fs.existsSync(appPath)) {
          throw Error(`'${appPath}' already exist`)
        }
      }
    },
    {
      title: 'Copy files',
      async task () {
        return fs.copy(`${libPath}/template`, appPath)
      }
    },
    {
      title: 'Install packages',
      async task () {
        return exec(`cd ${appPath} && npm i`)
      }
    },
  ], {}).run()
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
