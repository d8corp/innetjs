/// <reference types="node" />
import { FileSizeRender } from 'rollup-plugin-filesize';
export declare function getFile(file: any): any;
export declare function convertIndexFile(data: Buffer, version: string, baseUrl: string, index: string, inject: boolean): Promise<string>;
export declare const reporter: FileSizeRender<string | Promise<string>>;
