import typescript from 'rollup-plugin-typescript2'
import {preserveShebangs} from 'rollup-plugin-preserve-shebangs'
import json from '@rollup/plugin-json'

export default [{
  input: 'src/index.ts',
  output: {
    file: 'lib/index.js',
    format: 'cjs'
  },
  plugins: [
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          target: 'es6',
        }
      }
    })
  ]
}, {
  input: 'src/index.ts',
  output: {
    file: 'lib/index.es6.js',
    format: 'es'
  },
  plugins: [
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true
    })
  ]
}, {
  input: 'src/bin/innet.ts',
  output: {
    file: 'lib/bin/innet',
    format: 'cjs'
  },
  plugins: [
    json(),
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false
        }
      }
    }),
    preserveShebangs()
  ]
}]
