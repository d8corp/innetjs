import type { InnetJS } from '../../InnetJs';
import type { StartOptions } from '../../types';
export declare function typecheckWatchPlugin(): {
    name: string;
    buildEnd(): void;
};
export declare function start({ node, inject, error, typeCheck, lintCheck, usualConsoleOutput, index, }: StartOptions, instance: InnetJS): Promise<void>;
