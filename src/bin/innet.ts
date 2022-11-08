#!/usr/bin/env node
import { Option, program } from 'commander'

import { InnetJS } from '..'
import { version } from '../package.json'

const dotenvConfigOutput = require('dotenv').config()
require('dotenv-expand').expand(dotenvConfigOutput)

const innetJS = new InnetJS()

const errorOption = new Option('-e, --error', 'Show error details')
const releaseOption = new Option('-r, --release <release>', 'Select release type')
  .choices(['patch', 'minor', 'major'])

program
  .version(version, '-v, --version')

program
  .command('init <app-name>')
  .description('Create innet boilerplate')
  .option('-t, --template <template>', 'Select template fe or be')
  .addOption(errorOption)
  .action((appName, { error, template }) => {
    innetJS.init(appName, { template }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('run <file-path>')
  .description('Run js, ts or tsx file')
  .addOption(errorOption)
  .action((filePath, { error }) => {
    innetJS.run(filePath).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('start')
  .description('Start development with innet boilerplate')
  .option('-n, --node', 'Start development for Node.js')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .addOption(errorOption)
  .action(({ error, node, index }) => {
    innetJS.start({ node, error, index }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('build')
  .description('Build production bundle')
  .addOption(errorOption)
  .option('-n, --node', 'Build for node.js')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .action(({ error, node, index }) => {
    innetJS.build({ node, index }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('release')
  .description('Release new version of a library')
  .option('-n, --node', 'Release for node.js')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .addOption(releaseOption)
  .addOption(errorOption)
  .action(({ error, node, index, release }) => {
    innetJS.release({ node, index, release }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .parse(process.argv)
