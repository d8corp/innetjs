export function updateDotenv () {
  const { INNETJS_INNETJS_PACKAGE_VERSION } = process.env
  delete process.env.INNETJS_INNETJS_PACKAGE_VERSION

  require('dotenv-expand').expand(require('dotenv').config())

  if (!('INNETJS_INNETJS_PACKAGE_VERSION' in process.env)) {
    process.env.INNETJS_INNETJS_PACKAGE_VERSION = INNETJS_INNETJS_PACKAGE_VERSION
  }
}
