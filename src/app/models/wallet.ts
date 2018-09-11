import { PouchEntity } from './pouch-entity';

export interface Wallet extends PouchEntity {
    address?: string;
    name?: string;
    balance?: number;
    minedBlocks?: number;
    transactions?: number;
    filename?:string;
}
