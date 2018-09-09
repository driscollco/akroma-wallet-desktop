import { PouchEntity } from './pouch-entity';

export interface AkromaTx extends PouchEntity {
    _id: string;
    // nonce: number;
    // blockHash: string | null;
    blockNumber: number;
    // transactionIndex: number;
    addressfrom: string;
    addressto: string | null;
    value: string;
    gas: number;
    gasPrice: string;
    ts: number;
    input: string;
}
