import rollup from 'rollup';
export interface ReleaseOptions {
    node?: boolean;
    index?: string;
    pub?: boolean;
}
export declare const scriptExtensions: string[];
export declare const indexExt: string;
export declare class InnetJS {
    baseUrl: string;
    projectFolder: string;
    publicFolder: string;
    releaseFolder: string;
    licenseFile: string;
    licenseReleaseFile: string;
    readmeFile: string;
    readmeReleaseFile: string;
    declarationFile: string;
    declarationReleaseFile: string;
    buildFolder: string;
    devBuildFolder: string;
    srcFolder: string;
    publicIndexFile: string;
    buildIndexFile: string;
    devBuildIndexFile: string;
    sslKey: string;
    sslCrt: string;
    proxy: string;
    sourcemap: boolean;
    cssModules: boolean;
    cssInJs: boolean;
    port: number;
    api: string;
    private package;
    constructor({ projectFolder, baseUrl, publicFolder, releaseFolder, buildFolder, srcFolder, sourcemap, cssModules, cssInJs, sslKey, sslCrt, proxy, port, api, }?: {
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
        port?: number;
        api?: string;
    });
    init(appName: string, { template, force }?: any): Promise<void>;
    build({ node, index }?: {
        node?: boolean;
        index?: string;
    }): Promise<void>;
    start({ node, error, index }?: {
        node?: boolean;
        error?: boolean;
        index?: string;
    }): Promise<void>;
    run(file: any): Promise<void>;
    release({ node, index, pub }?: ReleaseOptions): Promise<void>;
    private _lintUsage;
    withLint(options: rollup.RollupOptions): void;
    increaseVersion(release: string): Promise<void>;
    getPackage(): Promise<Record<string, any>>;
    createClient(key: any, cert: any, pkg: any, index: string): rollup.Plugin;
    createServer(): rollup.Plugin;
}
