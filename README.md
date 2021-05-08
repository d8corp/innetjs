[![NPM](https://raw.githubusercontent.com/d8corp/innet/main/logo.svg)](https://github.com/d8corp/innet)

# innetjs
[![NPM](https://img.shields.io/npm/v/innetjs.svg)](https://github.com/d8corp/innetjs/blob/master/CHANGELOG.md)
[![downloads](https://img.shields.io/npm/dm/innetjs.svg)](https://www.npmjs.com/package/innetjs)
[![license](https://img.shields.io/npm/l/innetjs)](https://github.com/d8corp/innetjs/blob/master/LICENSE)

CLI for [innet](https://www.npmjs.com/package/innet) boilerplate.

### Installation
npm
```shell
npm i -g innetjs
```
You can use `npx innetjs` instead of `innetjs` without installation.
### Using
To get full list of commands run
```shell
innetjs
```
Run the next command to get `innetjs` version.
```shell
innetjs -v
```
Use `-h` flag with a command to get help information about the command.
```shell
innetjs init -h
```
### Commands
##### init <app-name>
Use the command to start a new project with innet boilerplate. Change `<app-name>` to your application name.
The name equals a folder that will be created in your current location.
```shell
innetjs init my-app
```
##### start
Use the command in the project folder to run the development environment.
```shell
innetjs start
```
##### build
Use the command in the project folder to build it.
```shell
innetjs build
```
