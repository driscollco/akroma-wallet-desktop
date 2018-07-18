import { PouchEntity } from './pouch-entity';

export interface BlockSync extends PouchEntity {
    currentBlock: number;
    highestBlock?: number;
    knownStates?: number;
    pulledStates?: number;
    startingBlock?: number;
}
