import { PouchEntity } from './pouch-entity';
import { KeyStore } from './keystore';

export interface Wallet extends PouchEntity {
    address?: string;
    name?: string;
    balance?: number;
    minedBlocks?: number;
    transactions?: number;
    keyStore?: KeyStore;
}
