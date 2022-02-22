# Changelog

## v1.8

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
