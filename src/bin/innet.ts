#!/usr/bin/env node
import InnetJS from '..'
import { version } from '../package.json'
import { program } from 'commander'

require('dotenv').config()

const innetJS = new InnetJS()

program
  .version(version, '-v, --version')

program
  .command('init <app-name>')
  .description('Create innet boilerplate')
  .option('-e, --error', 'Show error details')
  .option('-t, --template <template>', 'Select template fe or be')
  .action((appName, {error, template}) => {
    innetJS.init(appName, {template}).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('run <file-path>')
  .description('Run js, ts or tsx file')
  .option('-e, --error', 'Show error details')
  .action((filePath, {error}) => {
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
  .option('-e, --error', 'Show error details')
  .option('-n, --node', 'Start development for Node.js')
  .action(({error, node}) => {
    innetJS.start({node, error}).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('build')
  .description('Build production bundle')
  .option('-e, --error', 'Show error details')
  .option('-n, --node', 'Build for node.js')
  .action(({error, node}) => {
    innetJS.build({node}).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .parse(process.argv)
