import type { Plugin } from 'rolldown';
import type { InnetJS } from '../../InnetJs';
import type { StartOptions } from '../../types';
export declare function typecheckWatchPlugin(): Plugin;
export declare function lintCheckWatchPlugin(): Plugin;
export declare function start({ node, inject, error, typeCheck, lintCheck, usualConsoleOutput, index, }: StartOptions, instance: InnetJS): Promise<void>;
