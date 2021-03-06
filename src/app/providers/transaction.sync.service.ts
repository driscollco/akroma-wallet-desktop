import { Injectable, OnDestroy } from '@angular/core';
import { Client } from 'pg';
import { AkromaTx } from '../models/akroma-tx';
import { Web3Service } from './web3.service';
import { Block } from 'web3';

const pg = (<any>window).require('pg');
/**
 * TransactionSyncService syncs all the transactions from the akroma blockchain to a local postgres instance.
 * Users can decide to use TransactionSyncService or TransactionRemoveService via settings.
 */

@Injectable()
export class TransactionSyncService implements OnDestroy {
    private _intervals: NodeJS.Timer[];
    // transaction syncing
    public lastBlockNumberSynced: number;
    public running: boolean;
    public isPaused: boolean;
    public index: number;
    public status = 'starting....';
    private BATCH_SIZE = 1000;
    public _client: Client;
    public constructor(
        private web3Service: Web3Service,
    ) {
        this._intervals = [];
        this._client = new pg.Client({
            user: 'postgres',
            host: 'localhost',
            database: 'akroma',
            password: 'akroma',
            port: 5432,
        });
        this._client.connect();
    }

    public pauseSync() {
        this._intervals.forEach(timer => clearInterval(timer));
        this._intervals = [];
        this.isPaused = true;
        console.log('[SyncSQLService] pause sync called.');
    }

    public startSync() {
        console.log('[SyncSQLService] start sync called.');
        this._intervals.push(
            setInterval(async () => {
                await this.executeSync();
            }, 5000));
        this.isPaused = false;
    }

    /**
     * Gets percent complete of transaction sync, not blockchain sync
     */
    public get percentComplete() {
        return (this.lastBlockNumberSynced / this.web3Service.blockNumber * 100);
    }

    public get displayTransactions(): boolean {
        return this.percentComplete > 99;
    }

    public get blockchainSynced(): boolean {
        return this.web3Service.peerCount >= 3
            && this.web3Service.connected
            && !this.web3Service.syncing
            && this.web3Service.blockNumber >= 1500000;
    }

    public async getTransactionsForAddress(address: string): Promise<AkromaTx[]> {
        const text = `SELECT hash, blockhash, addressfrom, gas, gasprice, input, nonce, ts, addressto, transactionindex, value, blocknumber
                            FROM aka.transactions
                            WHERE addressfrom = $1
                            OR addressto = $1;`;
        const values = [address];
        try {
            const res = await this._client.query(text, values);
            console.log(res.rows);
            return res.rows;
        } catch (err) {
            console.log(err.stack);
        }
    }

    private async executeSync() {
        if (this.running) {
            console.log('[SyncSQLService] process already running');
            return;
        }
        if (!this.web3Service.connected) {
            this.running = false;
            console.log('[SyncSQLService] not connected to web3');
            return;
        }
        const isSyncing = await this.web3Service.syncing;
        if (isSyncing) {
            this.running = false;
            console.log('[SyncSQLService] syncing');
            return;
        }
        const peers = await this.web3Service.peerCount;
        if (peers < 1) {
            this.running = false;
            console.log('[SyncSQLService] no peers');
            return;
        }
        this.running = true;
        this.index = 0;

        this.lastBlockNumberSynced = await this.getSyncState();
        await this.getBlock(this.lastBlockNumberSynced);
    }

    // only called when sync first starts, we get the last block we know, then go back 10 blocks (to handle reorgs)
    private async getSyncState(): Promise<number> {
        const res = await this._client.query('SELECT num FROM aka.blocks ORDER BY num DESC LIMIT 1;');
        if (res.rows[0]) {
            console.log(`synced total: ${res.rows[0].num}`);
            const last = Number(res.rows[0].num);
            return last;
            // if (last > 10) { // TODO: logic to handle reorgs but not part of initial sync.
            //     console.log(`returning ${last - 10}`);
            //     return last - 10;
            // }
            // return 0;
        }
        return 0;
    }

    private async getBlock(blockNumber: number) {
        this.index = this.index + 1;
        this.status = `importing block ${blockNumber}`;
        this.lastBlockNumberSynced = blockNumber;
        if (this.index - this.BATCH_SIZE >= 0) {
            this.running = false;
            return;
        }
        const block = await this.web3Service.eth.getBlock(blockNumber, true);
        if (block === null || block.number === null) {
            console.log('[SyncSQLService] block number is null, sync"d');
            this.lastBlockNumberSynced = blockNumber;
            return;
        }
        const writeBlockResult = await this.writeBlock(block);
        if (!writeBlockResult) {
            console.warn('[SyncSQLService] unable to write block');
            return;
        }
        await this.writeBlockTransactions(block);
        const nextBlockNumber = block.number + 1;
        this.lastBlockNumberSynced = nextBlockNumber;
        await this.getBlock(nextBlockNumber);
    }


    /**
     * Writes block
     * @param block
     * @returns boolean
     */
    private async writeBlock(block: Block): Promise<boolean> {
        // console.info('SyncSQLService: saving block %s', block.number);

        // tslint:disable-next-line:max-line-length
        const text = `INSERT INTO aka.blocks
                        (num, difficulty, extradata, gaslimit, gasused, hash, logsbloom, miner, nonce, parenthash, sha3uncles, size, stateroot, ts, totaldifficulty, transactionsroot)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                        ON CONFLICT (num)
                        DO UPDATE
                        SET (difficulty, extradata, gaslimit, gasused, hash, logsbloom, miner, nonce, parenthash, sha3uncles, size, stateroot, ts, totaldifficulty, transactionsroot)
                        = ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);`;
        // tslint:disable-next-line:max-line-length
        const values = [block.number, block.difficulty, block.extraData, block.gasLimit, block.gasUsed, block.hash, block.logsBloom, block.miner, block.nonce, block.parentHash, block.sha3Uncles, block.size, block.stateRoot, block.timestamp, block.totalDifficulty, block.transactionRoot];
        try {
            const res = await this._client.query(text, values);
            // console.log(res);
            return true;
        } catch (err) {
            console.error('unable to save block');
            console.log(block);
            console.error(err.stack);
            return false;
        }
    }

    /**
     * Writes block transactions
     * @param block
     * @returns boolean
     */
    private async writeBlockTransactions(block: Block): Promise<boolean> {
        const text = `INSERT INTO aka.transactions(
                            hash, blockhash, addressfrom, gas, gasprice, input, nonce, ts, addressto, transactionindex, value, blocknumber)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            ON CONFLICT (hash)
                            DO UPDATE
                            SET (blockhash, addressfrom, gas, gasprice, input, nonce, ts, addressto, transactionindex, value, blocknumber)
                            = ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
        if (block.transactions.length === 0) {
            return true;
        }
        block.transactions.forEach(async tx => {
            const values = [tx.hash, tx.blockHash, tx.from, tx.gas, tx.gasPrice, tx.input, tx.nonce, block.timestamp, tx.to, tx.transactionIndex, tx.value, tx.blockNumber];
            try {
                const res = await this._client.query(text, values);
                // console.log('transaction: ' + res);
            } catch (err) {
                console.error('unable to save tx');
                console.log(tx);
                console.log(err);
                console.error(err.stack);
            }
        });
        return true;
    }

    public ngOnDestroy() {
        this._intervals.forEach(timer => clearInterval(timer));
    }
}
