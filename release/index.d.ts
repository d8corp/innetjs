import rollup from 'rollup';
import { EnvValues } from 'rollup-plugin-process-env';
export interface ReleaseOptions {
    node?: boolean;
    index?: string;
    pub?: boolean;
    min?: boolean;
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
    envPrefix: string;
    simulateIP: string;
    tsconfig: string;
    private package;
    constructor({ envPrefix, projectFolder, baseUrl, publicFolder, releaseFolder, buildFolder, srcFolder, sourcemap, cssModules, cssInJs, sslKey, sslCrt, proxy, simulateIP, port, api, tsconfig, }?: {
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
    });
    init(appName: string, { template, force }?: any): Promise<void>;
    build({ node, inject, index }?: {
        node?: boolean;
        inject?: boolean;
        index?: string;
    }): Promise<void>;
    start({ node, inject, error, index, }?: {
        node?: boolean;
        inject?: boolean;
        error?: boolean;
        index?: string;
    }): Promise<void>;
    run(file: any, { config, exposeGc }?: {
        config?: string;
        exposeGc?: boolean;
    }): Promise<void>;
    release({ index, pub, min }?: ReleaseOptions): Promise<void>;
    private _lintUsage;
    withLint(options: rollup.RollupOptions, prod?: boolean): void;
    withEnv(options: rollup.RollupOptions, virtual?: boolean, preset?: EnvValues): void;
    increaseVersion(release: string): Promise<void>;
    getPackage(): Promise<Record<string, any>>;
    createClient(key: any, cert: any, pkg: any, index: string, inject: boolean): rollup.Plugin;
    createServer(input: string[]): rollup.Plugin;
}
