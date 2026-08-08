import { ReleaseOptions } from '../../types';
import type { InnetJS } from '../../InnetJs';
export declare function release({ index, pub, min }: ReleaseOptions, instance: InnetJS): Promise<void>;
