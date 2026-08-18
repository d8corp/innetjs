import type { Plugin } from 'rolldown';
import type { BuildOptions, InitOptions, InnetJSParams, ReleaseOptions, RunOptions, StartOptions } from '../types';
export declare class InnetJS {
    params: Required<InnetJSParams>;
    private package;
    constructor(options?: InnetJSParams);
    init(appName: string, options?: InitOptions): Promise<void>;
    build(options?: BuildOptions): Promise<void>;
    start(options?: StartOptions): Promise<void>;
    run(file: string, options?: RunOptions): Promise<void>;
    release(options?: ReleaseOptions): Promise<void>;
    getPackage(): Promise<Record<string, any>>;
    createClient(key: any, cert: any, pkg: any, index: string, inject: boolean): Plugin;
    createServer(input: string[], error?: boolean, usualConsoleOutput?: boolean): Plugin;
}
