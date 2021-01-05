declare function init(appName: any): Promise<void>;
declare function start(): Promise<void>;
declare function build(): Promise<void>;
declare function server(rootPath: string, cert?: any, key?: any): {
    writeBundle(): void;
};
export { init, start, build, server, };
