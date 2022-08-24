declare type Extensions = 'js' | 'ts' | 'tsx' | 'jsx';
export default class InnetJS {
    baseUrl: string;
    projectFolder: string;
    publicFolder: string;
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
    private projectExtension;
    private package;
    constructor({ projectFolder, baseUrl, publicFolder, buildFolder, srcFolder, sourcemap, cssModules, cssInJs, sslKey, sslCrt, proxy, port, api, }?: {
        projectFolder?: string;
        baseUrl?: string;
        publicFolder?: string;
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
    build({ node }?: {
        node?: boolean;
    }): Promise<void>;
    start({ node, error }?: {
        node?: boolean;
        error?: boolean;
    }): Promise<void>;
    run(file: any): Promise<void>;
    getProjectExtension(): Promise<Extensions>;
    getPackage(): Promise<Record<string, any>>;
    createClient(key: any, cert: any, pkg: any): {
        writeBundle: () => Promise<void>;
    };
    createServer(external: string[]): {
        writeBundle: () => Promise<void>;
    };
}
export {};
