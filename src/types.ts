export interface InnetJSParams {
  envPrefix?: string
  projectFolder?: string
  baseUrl?: string
  publicFolder?: string
  releaseFolder?: string
  buildFolder?: string
  srcFolder?: string
  sourcemap?: boolean
  cssModules?: boolean
  cssInJs?: boolean
  sslKey?: string
  sslCrt?: string
  proxy?: string
  simulateIP?: string
  port?: number
  api?: string
  tsconfig?: string
  licenseFile?: string
  licenseReleaseFile?: string
  readmeFile?: string
  readmeReleaseFile?: string
  declarationFile?: string
  declarationReleaseFile?: string
  devBuildFolder?: string
  publicIndexFile?: string
  buildIndexFile?: string
  devBuildIndexFile?: string
  indexExt?: string
}

export interface InitOptions {
  template?: string
  force?: boolean
}

export interface BuildOptions {
  node?: boolean
  inject?: boolean
  index?: string
}

export interface StartOptions {
  node?: boolean
  inject?: boolean
  error?: boolean
  usualConsoleOutput?: boolean
  index?: string
}

export interface RunOptions {
  config?: string
  exposeGc?: boolean
}

export interface ReleaseOptions {
  node?: boolean
  index?: string
  pub?: boolean
  min?: boolean
}
