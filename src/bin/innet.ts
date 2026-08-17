#!/usr/bin/env node
import { Option, program } from 'commander'

import { updateDotenv } from '../utils'

import { InnetJS } from '..'

updateDotenv()

const innetJS = new InnetJS()

const errorOption = new Option('-e, --error', 'Show error details')

const checkError = (flag: boolean) => (error: any) => {
  if (flag) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

program
  .version(process.env.__INNETJS__PACKAGE_VERSION, '-v, --version')

program
  .command('init <app-name>')
  .description('Create innet boilerplate')
  .option('-t, --template <template>', 'Select template fe or be')
  .addOption(errorOption)
  .action((appName, { error, template }) => {
    innetJS.init(appName, { template }).catch(checkError(error))
  })

program
  .command('run <file-path>')
  .description('Run js, ts or tsx file')
  .option('-c, --config <file-path>', 'Config file for TypeScript')
  .option('--expose-gc', 'Run node with global.gc support')
  .option('-tc, --type-check', 'Runes TypeScript errors checker')
  .addOption(errorOption)
  .action((filePath: string, params) => {
    innetJS.run(filePath, params).catch(checkError(params.error))
  })

program
  .command('start')
  .description('Start development with innet boilerplate')
  .option('-n, --node', 'Start development for Node.js')
  .option('-uco, --usual-console-output', 'Removes custom error output (code-frame, colors...)')
  .option('-in, --inject', 'Injects script element into index.html')
  .option('-tc, --type-check', 'Runes TypeScript errors checker')
  .option('-lc, --lint-check', 'Runes ESLint errors checker')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .addOption(errorOption)
  .action((params) => {
    innetJS.start(params).catch(checkError(params.error))
  })

program
  .command('build')
  .description('Build production bundle')
  .addOption(errorOption)
  .option('-n, --node', 'Build for node.js')
  .option('-in, --inject', 'Injects script element into index.html')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .option('-tc, --type-check', 'Runes TypeScript errors checker')
  .option('-lc, --lint-check', 'Runes ESLint errors checker')
  .action((params) => {
    innetJS.build(params).catch(checkError(params.error))
  })

program
  .command('release')
  .description('Release new version of your library')
  .option('-i, --index <index>', 'Root index file name', 'index')
  .option('-p, --public', 'Public the package')
  .option('-m, --min', 'Add minified version of your library')
  .option('-tc, --type-check', 'Runes TypeScript errors checker')
  .option('-lc, --lint-check', 'Runes ESLint errors checker')
  .addOption(errorOption)
  .action(({ error, index, public: pub, min, lintCheck, typeCheck }) => {
    innetJS.release({ index, pub, min, lintCheck, typeCheck }).catch(checkError(error))
  })

program
  .parse(process.argv)
