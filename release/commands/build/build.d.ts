import type { InnetJS } from '../../InnetJs';
import type { BuildOptions } from '../../types';
export declare function build({ node, inject, index, typeCheck, lintCheck }: BuildOptions, instance: InnetJS): Promise<void>;
