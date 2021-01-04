#!/usr/bin/env node
import {init, start, build} from '../index'
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
