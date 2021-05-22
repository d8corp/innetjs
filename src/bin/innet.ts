#!/usr/bin/env node
import {init, start, build, run} from '../index'
import {version} from '../../package.json'
import {program} from 'commander'

program
  .version(version, '-v, --version')

program
  .command('init <app-name>')
  .description('create innet boilerplate')
  .option('-e, --error', 'show error details')
  .action((appName, {error}) => {
    init(appName).catch(e => {
      if (error) {
        console.error(e)
      }
    })
  })

program
  .command('run <file-path>')
  .description('Run js, ts or tsx file')
  .option('-e, --error', 'show error details')
  .action((filePath, {error}) => {
    run(filePath).catch(e => {
      if (error) {
        console.error(e)
      }
    })
  })

program
  .command('start')
  .description('start development with innet boilerplate')
  .option('-e, --error', 'show error details')
  .action(({error}) => {
    start().catch(e => {
      if (error) {
        console.error(e)
      }
    })
  })

program
  .command('build')
  .description('build production bundle')
  .option('-e, --error', 'show error details')
  .action(({error}) => {
    build().catch(e => {
      if (error) {
        console.error(e)
      }
    })
  })

program
  .parse(process.argv)
