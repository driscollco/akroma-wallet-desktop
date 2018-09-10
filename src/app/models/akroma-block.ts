import { PouchEntity } from './pouch-entity';

export interface AkromaBlock extends PouchEntity {
    _id: string | null;
    number: number;
}
