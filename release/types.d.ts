export interface InnetJSParams {
    envPrefix?: string;
    projectFolder?: string;
    baseUrl?: string;
    publicFolder?: string;
    releaseFolder?: string;
    buildFolder?: string;
    srcFolder?: string;
    sourcemap?: boolean;
    cssModules?: boolean;
    cssInJs?: boolean;
    sslKey?: string;
    sslCrt?: string;
    proxy?: string;
    simulateIP?: string;
    port?: number;
    api?: string;
    tsconfig?: string;
    startTSConfig?: string;
    buildTSConfig?: string;
    releaseTSConfig?: string;
    licenseFile?: string;
    licenseReleaseFile?: string;
    readmeFile?: string;
    readmeReleaseFile?: string;
    declarationFile?: string;
    declarationReleaseFile?: string;
    devBuildFolder?: string;
    publicIndexFile?: string;
    buildIndexFile?: string;
    devBuildIndexFile?: string;
    indexExt?: string;
}
export interface InitOptions {
    template?: string;
    force?: boolean;
}
export interface BuildOptions {
    node?: boolean;
    inject?: boolean;
    index?: string;
    typeCheck?: boolean;
    lintCheck?: boolean;
}
export interface StartOptions {
    node?: boolean;
    inject?: boolean;
    error?: boolean;
    usualConsoleOutput?: boolean;
    index?: string;
    typeCheck?: boolean;
    lintCheck?: boolean;
}
export interface RunOptions {
    config?: string;
    exposeGc?: boolean;
    typeCheck?: boolean;
}
export interface ReleaseOptions {
    node?: boolean;
    index?: string;
    pub?: boolean;
    min?: boolean;
    typeCheck?: boolean;
    lintCheck?: boolean;
}
