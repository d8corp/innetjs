declare type Extensions = 'js' | 'ts' | 'tsx' | 'jsx';
export declare function task(name: any, callback: any): Promise<any>;
export default class InnetJS {
    projectFolder: string;
    publicFolder: string;
    buildFolder: string;
    srcFolder: string;
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
    constructor({ projectFolder, publicFolder, buildFolder, srcFolder, sourcemap, cssModules, cssInJs, sslKey, sslCrt, proxy, port, api, }?: {
        projectFolder?: string;
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
    init(appName: string, { template, force }?: {
        template?: string;
        force?: boolean;
    }): Promise<void>;
    build({ node }?: {
        node?: boolean;
    }): Promise<void>;
    start({ node }?: {
        node?: boolean;
    }): Promise<void>;
    run(file: any): Promise<void>;
    getProjectExtension(): Promise<Extensions>;
    getPackage(): Promise<Record<string, any>>;
    createClient(key: any, cert: any): {
        writeBundle: () => void;
    };
    createServer(external: string[]): {
        writeBundle: () => Promise<void>;
    };
}
export {};
