#!/usr/bin/env node
import { Option, program } from 'commander'

import { InnetJS } from '..'
import { updateDotenv } from '../updateDotenv'

updateDotenv()

const innetJS = new InnetJS()

const errorOption = new Option('-e, --error', 'Show error details')

program
  .version(process.env.__INNETJS__PACKAGE_VERSION, '-v, --version')

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
  .option('-c, --config <file-path>', 'Config file for TypeScript')
  .addOption(errorOption)
  .action((filePath, { error, config }) => {
    innetJS.run(filePath, { config }).catch(e => {
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
  .option('-in, --inject', 'Injects script element into index.html')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .addOption(errorOption)
  .action(({ error, node, index, inject }) => {
    innetJS.start({ node, error, index, inject }).catch(e => {
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
  .option('-in, --inject', 'Injects script element into index.html')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .action(({ error, node, index, inject }) => {
    innetJS.build({ node, index, inject }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('release')
  .description('Release new version of your library')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .option('-p, --public', 'Public the package')
  .option('-m, --min', 'Add minified version of your library')
  .addOption(errorOption)
  .action(({ error, index, public: pub, min }) => {
    innetJS.release({ index, pub, min }).catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('patch')
  .description('Increase patch version of package')
  .addOption(errorOption)
  .action(({ error }) => {
    innetJS.increaseVersion('patch').catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('minor')
  .description('Increase minor version of package')
  .addOption(errorOption)
  .action(({ error }) => {
    innetJS.increaseVersion('minor').catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .command('major')
  .description('Increase major version of package')
  .addOption(errorOption)
  .action(({ error }) => {
    innetJS.increaseVersion('major').catch(e => {
      if (error) {
        console.error(e)
        process.exit(1)
      }
    })
  })

program
  .parse(process.argv)
