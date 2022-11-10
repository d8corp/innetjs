function updateDotenv() {
    const { __INNETJS__PACKAGE_VERSION: before } = process.env;
    delete process.env.__INNETJS__PACKAGE_VERSION;
    require('dotenv-expand').expand(require('dotenv').config());
    if (!('__INNETJS__PACKAGE_VERSION' in process.env)) {
        process.env.__INNETJS__PACKAGE_VERSION = before;
    }
}

export { updateDotenv };
