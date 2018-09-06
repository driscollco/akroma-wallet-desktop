import { PouchEntity } from './pouch-entity';

export interface AkromaTx extends PouchEntity {
    _id: string;
    // nonce: number;
    // blockHash: string | null;
    blockNumber: number;
    // transactionIndex: number;
    from: string;
    to: string | null;
    value: string;
    gas: number;
    gasPrice: string;
    timestamp: number;
    input: string;
}
