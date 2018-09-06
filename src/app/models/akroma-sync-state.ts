import { PouchEntity } from './pouch-entity';

export interface AkromaSyncState extends PouchEntity {
    currentBlock: number;
}
