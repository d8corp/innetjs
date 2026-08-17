import type { InnetJS } from '../../InnetJs';
import type { ReleaseOptions } from '../../types';
export declare function release({ index, pub, min, typeCheck, lintCheck }: ReleaseOptions, instance: InnetJS): Promise<void>;
