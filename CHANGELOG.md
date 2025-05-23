# Changelog

## v3.0

### v3.0.0 [![10.05.2025](https://img.shields.io/date/1746887332)](https://github.com/d8corp/innetjs/tree/v3.0.0)

- update `rollup-plugin-innet-jsx` to v2.0

## v2.5

### v2.5.3 [![21.03.2023](https://img.shields.io/date/1679405382)](https://github.com/d8corp/innetjs/tree/v2.5.3)

- make script injection optional, use `-in` flag to have the injection like before.

### v2.5.2 [![21.03.2023](https://img.shields.io/date/1679394876)](https://github.com/d8corp/innetjs/tree/v2.5.2)

- fix errors handling

### v2.5.1 [![20.03.2023](https://img.shields.io/date/1679324482)](https://github.com/d8corp/innetjs/tree/v2.5.1)

- change TypeScript plugin for build
- fix error displaying

### v2.5.0 [![20.03.2023](https://img.shields.io/date/1679321924)](https://github.com/d8corp/innetjs/tree/v2.5.0)

- change TypeScript plugin

## v2.4

### v2.4.4 [![19.03.2023](https://img.shields.io/date/1679246795)](https://github.com/d8corp/innetjs/tree/v2.4.4)

- fix `mjs` import bug

### v2.4.3 [![19.03.2023](https://img.shields.io/date/1679236171)](https://github.com/d8corp/innetjs/tree/v2.4.3)

- add a possible to use a several index files

### v2.4.2 [![08.03.2023](https://img.shields.io/date/1678277776)](https://github.com/d8corp/innetjs/tree/v2.4.2)

- build assets as files instead of url injection for css

### v2.4.1 [![08.03.2023](https://img.shields.io/date/1678265573)](https://github.com/d8corp/innetjs/tree/v2.4.1)

- improve base URL feature

### v2.4.0 [![08.03.2023](https://img.shields.io/date/1678263972)](https://github.com/d8corp/innetjs/tree/v2.4.0)

- build assets as files instead of url injection

## v2.3

### v2.3.10 [![06.02.2023](https://img.shields.io/date/1675677317)](https://github.com/d8corp/innetjs/tree/v2.3.10)

- add `IP` simulation feature

### v2.3.9 [![31.01.2023](https://img.shields.io/date/1675187121)](https://github.com/d8corp/innetjs/tree/v2.3.9)

- fix proxy file size limit

### v2.3.8 [![31.01.2023](https://img.shields.io/date/1675160611)](https://github.com/d8corp/innetjs/tree/v2.3.8)

- fix node `start` and `build`

### v2.3.7 [![24.12.2022](https://img.shields.io/date/1671877589)](https://github.com/d8corp/innetjs/tree/v2.3.7)

- improve `BASE_URL`

### v2.3.6 [![24.12.2022](https://img.shields.io/date/1671875650)](https://github.com/d8corp/innetjs/tree/v2.3.6)

- add `index.html` file replacement with environment variables.
  ```html
  <html>
    <head>
    ...
    <link rel="shortcut icon" href="%PUBLIC_URL%/logo/favicon.ico">
    ...
    </head>
    ...
  </html>
  ```

### v2.3.5 [![09.12.2022](https://img.shields.io/date/1670603179)](https://github.com/d8corp/innetjs/tree/v2.3.5)
- improve css import

### v2.3.3 [![29.11.2022](https://img.shields.io/date/1669727821)](https://github.com/d8corp/innetjs/tree/v2.3.3)
- throw eslint error on `build` and `release`

### v2.3.2 [![24.11.2022](https://img.shields.io/date/1669239835)](https://github.com/d8corp/innetjs/tree/v2.3.2)
- fix error message

### v2.3.0 [![21.11.2022](https://img.shields.io/date/1669032575)](https://github.com/d8corp/innetjs/tree/v2.3.0)
- fix `cli` help information

## v2.2

### v2.2.24 [![19.11.2022](https://img.shields.io/date/1668870840)](https://github.com/d8corp/innetjs/tree/v2.2.24)
- fix build bugs

### v2.2.23 [![13.11.2022](https://img.shields.io/date/1668340263)](https://github.com/d8corp/innetjs/tree/v2.2.23)
- fix env bugs

### v2.2.22 [![13.11.2022](https://img.shields.io/date/1668339846)](https://github.com/d8corp/innetjs/tree/v2.2.22)
- fix env bugs

### v2.2.19 [![13.11.2022](https://img.shields.io/date/1668336865)](https://github.com/d8corp/innetjs/tree/v2.2.19)
- fix rebuilding bug

### v2.2.18 [![12.11.2022](https://img.shields.io/date/1668267233)](https://github.com/d8corp/innetjs/tree/v2.2.18)
- improve build file names

### v2.2.17 [![12.11.2022](https://img.shields.io/date/1668251474)](https://github.com/d8corp/innetjs/tree/v2.2.17)
- remove node flag
- fix build bugs

### v2.2.16 [![11.11.2022](https://img.shields.io/date/1668169948)](https://github.com/d8corp/innetjs/tree/v2.2.16)
- update depends

### v2.2.15 [![11.11.2022](https://img.shields.io/date/1668167799)](https://github.com/d8corp/innetjs/tree/v2.2.15)
- remove `.d.ts` files for `build` and `start`

### v2.2.14 [![11.11.2022](https://img.shields.io/date/1668118382)](https://github.com/d8corp/innetjs/tree/v2.2.14)
- update dependencies

### v2.2.13 [![11.11.2022](https://img.shields.io/date/1668116086)](https://github.com/d8corp/innetjs/tree/v2.2.13)
- fix env

### v2.2.12 [![11.11.2022](https://img.shields.io/date/1668115484)](https://github.com/d8corp/innetjs/tree/v2.2.12)
- fix env

### v2.2.11 [![11.11.2022](https://img.shields.io/date/1668114996)](https://github.com/d8corp/innetjs/tree/v2.2.11)
- add `INNETJS_ENV_PREFIX`

### v2.2.10 [![10.11.2022](https://img.shields.io/date/1668113206)](https://github.com/d8corp/innetjs/tree/v2.2.10)
- improve env injection
- fix linting error

### v2.2.9 [![09.11.2022](https://img.shields.io/date/1668022128)](https://github.com/d8corp/innetjs/tree/v2.2.9)
- fix env injection

### v2.2.8 [![09.11.2022](https://img.shields.io/date/1668004881)](https://github.com/d8corp/innetjs/tree/v2.2.8)
- fix `index` file for `release`

### v2.2.7 [![09.11.2022](https://img.shields.io/date/1668003589)](https://github.com/d8corp/innetjs/tree/v2.2.7)
- fix `index` option

### v2.2.6 [![09.11.2022](https://img.shields.io/date/1667989066)](https://github.com/d8corp/innetjs/tree/v2.2.6)
- fix env bugs

### v2.2.5 [![09.11.2022](https://img.shields.io/date/1667988850)](https://github.com/d8corp/innetjs/tree/v2.2.5)
- fix env bugs

### v2.2.2 [![09.11.2022](https://img.shields.io/date/1667984556)](https://github.com/d8corp/innetjs/tree/v2.2.2)
- add env ejection for `release`

### v2.2.1 [![09.11.2022](https://img.shields.io/date/1667947493)](https://github.com/d8corp/innetjs/tree/v2.2.1)
- change folder `lib` to `release`

### v2.2.0 [![09.11.2022](https://img.shields.io/date/1667947493)](https://github.com/d8corp/innetjs/tree/v2.2.0)
- add method of `release`

## v2.1

### v2.1.6 [![01.11.2022](https://img.shields.io/date/1667297464)](https://github.com/d8corp/innetjs/tree/v2.1.6)
- add using of all environments

### v2.1.2 [![31.10.2022](https://img.shields.io/date/1667247079)](https://github.com/d8corp/innetjs/tree/v2.1.2)
- add polyfill for node dependencies

### v2.1.1 [![31.10.2022](https://img.shields.io/date/1667246009)](https://github.com/d8corp/innetjs/tree/v2.1.1)
- fix bugs after depends update

### v2.1.0 [![31.10.2022](https://img.shields.io/date/1667243220)](https://github.com/d8corp/innetjs/tree/v2.1.0)
- update depends
- add `env` override

## v2.0

### v2.0.12 [![31.08.2022](https://img.shields.io/date/1661935829)](https://github.com/d8corp/innetjs/tree/v2.0.12)
- fix node application development build

### v2.0.11 [![27.08.2022](https://img.shields.io/date/1661594844)](https://github.com/d8corp/innetjs/tree/v2.0.11)
- add displaying of local network server URL

### v2.0.10 [![26.08.2022](https://img.shields.io/date/1661511430)](https://github.com/d8corp/innetjs/tree/v2.0.10)
- change index page detection bug

### v2.0.9 [![24.08.2022](https://img.shields.io/date/1661341931)](https://github.com/d8corp/innetjs/tree/v2.0.9)
- add `BASE_URL`

### v2.0.8 [![19.08.2022](https://img.shields.io/date/1660928100)](https://github.com/d8corp/innetjs/tree/v2.0.8)
- fix browser node resolver

### v2.0.7 [![16.08.2022](https://img.shields.io/date/1660649542)](https://github.com/d8corp/innetjs/tree/v2.0.7)
- add `INNETJS_` env variables

### v2.0.6 [![15.08.2022](https://img.shields.io/date/1660547108)](https://github.com/d8corp/innetjs/tree/v2.0.6)
- fix live reload

### v2.0.5 [![13.08.2022](https://img.shields.io/date/1660417605)](https://github.com/d8corp/innetjs/tree/v2.0.5)
- fix live reload

### v2.0.4 [![13.08.2022](https://img.shields.io/date/1660391789)](https://github.com/d8corp/innetjs/tree/v2.0.4)
- handle if a port is available
- default API starts with `/api`

### v2.0.3 [![13.08.2022](https://img.shields.io/date/1660389000)](https://github.com/d8corp/innetjs/tree/v2.0.3)
- improve errors view

### v2.0.2 [![13.08.2022](https://img.shields.io/date/1660385528)](https://github.com/d8corp/innetjs/tree/v2.0.2)
- improve errors view

### v2.0.1 [![12.08.2022](https://img.shields.io/date/1660322538)](https://github.com/d8corp/innetjs/tree/v2.0.1)
- add images import

### v2.0.0 [![11.08.2022](https://img.shields.io/date/1660204235)](https://github.com/d8corp/innetjs/tree/v2.0.0)
- new way of development build
- new way of templates deliver
- css modules by default
- css in js by default
- fix css code splitting bugs

## v1.12

### v1.12.1 [![19.06.2022](https://img.shields.io/date/1655671076)](https://github.com/d8corp/innetjs/tree/v1.12.1)
- updated fe template

### v1.12.0 [![19.06.2022](https://img.shields.io/date/1655659927)](https://github.com/d8corp/innetjs/tree/v1.12.0)
- updated fe template

## v1.11

### v1.11.1 [![30.04.2022](https://img.shields.io/date/1651318064)](https://github.com/d8corp/innetjs/tree/v1.11.1)

- reduce bundle size information
- remove bundle size information for node app

### v1.11.0 [![30.04.2022](https://img.shields.io/date/1651315818)](https://github.com/d8corp/innetjs/tree/v1.11.0)

- added displaying of bundle filesize

## v1.10

### v1.10.1 [![30.04.2022](https://img.shields.io/date/1651311854)](https://github.com/d8corp/innetjs/tree/v1.10.1)

- fix fe build

### v1.10.0 [![27.04.2022](https://img.shields.io/date/1651007145)](https://github.com/d8corp/innetjs/tree/v1.10.0)

- updated fe template

## v1.9

### v1.9.0 [![22.03.2022](https://img.shields.io/date/1647979618)](https://github.com/d8corp/innetjs/tree/v1.9.0)

- updated dependencies
- support new getter JSX parsing feature

## v1.8

### v1.8.5 [![03.03.2022](https://img.shields.io/date/1646297680)](https://github.com/d8corp/innetjs/tree/v1.8.5)

- fix building errors

### v1.8.4 [![03.03.2022](https://img.shields.io/date/1646294627)](https://github.com/d8corp/innetjs/tree/v1.8.4)

- fix building errors

### v1.8.3 [![02.03.2022](https://img.shields.io/date/1646211534)](https://github.com/d8corp/innetjs/tree/v1.8.3)

- updated dependencies
- improved `be` template

### v1.8.2 [![23.02.2022](https://img.shields.io/date/1645571637)](https://github.com/d8corp/innetjs/tree/v1.8.2)

- fix terminal output

### v1.8.1 [![23.02.2022](https://img.shields.io/date/1645570173)](https://github.com/d8corp/innetjs/tree/v1.8.1)

- fix template bug

### v1.8.0 [![22.02.2022](https://img.shields.io/date/1645544170)](https://github.com/d8corp/innetjs/tree/v1.8.0)

- added `be` template and `-t` flag

## v1.7

### v1.7.4 [![26.08.2021](https://img.shields.io/date/1630010567)](https://github.com/d8corp/innetjs/tree/v1.7.4)

- added more information about errors with `-e` flag

### v1.7.3 [![15.08.2021](https://img.shields.io/date/1629058607)](https://github.com/d8corp/innetjs/tree/v1.7.3)

- updated dependencies

### v1.7.2 [![15.08.2021](https://img.shields.io/date/1629056594)](https://github.com/d8corp/innetjs/tree/v1.7.2)

- fixed bug when you have a message in a terminal during build process

### v1.7.1 [![22.07.2021](https://img.shields.io/date/1626983521)](https://github.com/d8corp/innetjs/tree/v1.7.1)

- fixed bug when you use routing and reload the page
- migrated to es modules system

### v1.7.0 [![20.07.2021](https://img.shields.io/date/1626731958)](https://github.com/d8corp/innetjs/tree/v1.7.0)

- added code-splitting for `fe` template

You can use dynamic imports
```typescript
import('./test').then(test => console.log(test))
```

## v1.6

### v1.6.1 [![11.07.2021](https://img.shields.io/date/1626006977)](https://github.com/d8corp/innetjs/tree/v1.6.1)

- fixed reducing of path when you use `PROXY` with `API`

### v1.6.0 [![11.07.2021](https://img.shields.io/date/1626002305)](https://github.com/d8corp/innetjs/tree/v1.6.0)

- added `API` env param handler
- added `index.html` as default page

## v1.5

### v1.5.9 [![05.07.2021](https://img.shields.io/date/1625479738)](https://github.com/d8corp/innetjs/tree/v1.5.9)

- added copying of `package-lock.json` for the server builder

### v1.5.8 [![29.06.2021](https://img.shields.io/date/1624916254)](https://github.com/d8corp/innetjs/tree/v1.5.8)

- updated [rollup-plugin-innet-jsx](https://www.npmjs.com/package/rollup-plugin-innet-jsx) version to fix bugs of typescript building

### v1.5.7 [![29.06.2021](https://img.shields.io/date/1624915437)](https://github.com/d8corp/innetjs/tree/v1.5.7)

- fixed rollup plugins order bug
- removed types of CLI

### v1.5.6 [![29.06.2021](https://img.shields.io/date/1624912898)](https://github.com/d8corp/innetjs/tree/v1.5.6)

- fixed types location bug
- updated readme

### v1.5.5 [![25.06.2021](https://img.shields.io/date/1624634297)](https://github.com/d8corp/innetjs/tree/v1.5.5)

- updated `rollup-plugin-innet-jsx` version

### v1.5.4 [![23.06.2021](https://img.shields.io/date/1624438104)](https://github.com/d8corp/innetjs/tree/v1.5.4)

- added error exit process status of CLI on exception

### v1.5.2 [![23.06.2021](https://img.shields.io/date/1624437547)](https://github.com/d8corp/innetjs/tree/v1.5.2)

- fixed a bug of `process.stdout.clearLine is not a function`

### v1.5.1 [![19.06.2021](https://img.shields.io/date/1624129830)](https://github.com/d8corp/innetjs/tree/v1.5.1)

- updated fe template

### v1.5.0 [![19.06.2021](https://img.shields.io/date/1624116893)](https://github.com/d8corp/innetjs/tree/v1.5.0)

- implemented new way of JSX transpiling
- added style bundle minimize

## v1.4

- added style bundle minimize

### v1.4.0 [![14.06.2021](https://img.shields.io/date/1623682304)](https://github.com/d8corp/innetjs/tree/v1.4.0)

Migration of [watch-state](https://www.npmjs.com/package/watch-state) to the `3rd` version.
- increased version of libraries in `fe` template, `innet` to `v0.2` and `watch-state` to `v3`

## v1.3

### v1.3.1 [![14.06.2021](https://img.shields.io/date/1623681775)](https://github.com/d8corp/innetjs/tree/v1.3.1)

- fixed `fe` template
