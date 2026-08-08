import path from 'node:path';
import { SCRIPT_EXTENSIONS } from '../../constants.mjs';

function getDefaultOptions({ envPrefix = process.env.INNETJS_ENV_PREFIX || 'INNETJS_', projectFolder = process.env.PROJECT_FOLDER || '', baseUrl = process.env.BASE_URL || '', publicFolder = process.env.PUBLIC_FOLDER || 'public', releaseFolder = process.env.RELEASE_FOLDER || 'release', buildFolder = process.env.BUILD_FOLDER || 'build', srcFolder = process.env.SRC_FOLDER || 'src', sourcemap = process.env.SOURCEMAP ? process.env.SOURCEMAP === 'true' : false, cssModules = process.env.CSS_MODULES ? process.env.CSS_MODULES === 'true' : true, cssInJs = process.env.CSS_IN_JS ? process.env.CSS_IN_JS === 'true' : true, sslKey = process.env.SSL_KEY || 'localhost.key', sslCrt = process.env.SSL_CRT || 'localhost.crt', proxy = process.env.PROXY || '', simulateIP = process.env.IP, port = process.env.PORT ? +process.env.PORT : 3000, api = process.env.API || '/api/?*', tsconfig = process.env.TSCONFIG, indexExt = SCRIPT_EXTENSIONS.join(','), }) {
    const devBuildFolder = path.resolve(projectFolder, 'node_modules', '.cache', 'innetjs', 'build');
    return {
        projectFolder: path.resolve(projectFolder),
        publicFolder: path.resolve(publicFolder),
        releaseFolder: path.resolve(releaseFolder),
        buildFolder: path.resolve(buildFolder),
        srcFolder: path.resolve(srcFolder),
        licenseFile: path.join(projectFolder, 'LICENSE'),
        licenseReleaseFile: path.join(releaseFolder, 'LICENSE'),
        readmeFile: path.join(projectFolder, 'README.md'),
        readmeReleaseFile: path.join(releaseFolder, 'README.md'),
        declarationFile: path.join(srcFolder, 'declaration.d.ts'),
        declarationReleaseFile: path.join(releaseFolder, 'declaration.d.ts'),
        publicIndexFile: path.join(publicFolder, 'index.html'),
        buildIndexFile: path.join(buildFolder, 'index.html'),
        devBuildFolder,
        devBuildIndexFile: path.join(devBuildFolder, 'index.html'),
        sourcemap,
        cssModules,
        cssInJs,
        sslKey,
        sslCrt,
        port,
        proxy,
        api,
        baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
        envPrefix,
        simulateIP,
        tsconfig,
        indexExt,
    };
}

export { getDefaultOptions };
